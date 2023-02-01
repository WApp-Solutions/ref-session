import { FirebaseOptions, initializeApp } from 'firebase/app'
import {
    arrayUnion,
    collection,
    doc,
    DocumentData,
    DocumentSnapshot,
    FirestoreDataConverter,
    getDocs,
    getFirestore,
    onSnapshot,
    query,
    QueryDocumentSnapshot,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    UpdateData,
    updateDoc,
    where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { DataPointType } from '../models/data-point.firebase'
import { Timestamp } from '@firebase/firestore'
import { ISession, ISessionAttendee } from '../models/session'

const firebaseOptions: FirebaseOptions = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
} as const

const app = initializeApp(firebaseOptions)

const db = getFirestore(app)

// This helper function pipes your types through a firestore converter
const converter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore: (data: T) => data,
    fromFirestore: (snap: QueryDocumentSnapshot<T>) => snap.data() as T,
})
// This helper function exposes a 'typed' version of firestore().collection(collectionPath)
// Pass it a collectionPath string as the path to the collection in firestore
// Pass it a type argument representing the 'type' (schema) of the docs in the collection
const dataPoint = <T>(type: DataPointType, path: string) => {
    switch (type) {
        case DataPointType.document:
            return doc(db, path, '').withConverter(converter<T>())
        case DataPointType.collection:
            return doc(collection(db, path, '').withConverter(converter<T>()))
    }
    throw new Error(`The given DataPoint type ${type} is invalid.`)
}

export const useFirestoreSubscription = <T = DocumentData>(
    path: string,
    onNextSnapshot: (snapshot: DocumentSnapshot<T>) => void
) => {
    const [unsubscribe, setUnsubscribe] = useState<{ t: Unsubscribe }>()

    const pathSegments = path.split('/')

    if (pathSegments.length === 1) {
        throw new Error(
            `[Firestore Subscription Hook] The path '${path}' has an odd count of segments => Points to a collection?`
        )
    }

    /*const pathToLastDocumentInPath =
        pathSegments.length % 2 !== 0
            ? pathSegments.join('/')
            : pathSegments.slice(0, pathSegments.length - 1).join('/')*/

    useEffect(() => {
        const unsub = onSnapshot(
            dataPoint<T>(DataPointType.document, path),
            onNextSnapshot
        )
        setUnsubscribe({ t: unsub })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return unsubscribe
}

export const useFirebaseFirestoreWriter = <T>(path: string) => {
    const pathSegments = path.split('/')

    const pathToLastCollectionInPath =
        pathSegments.length % 2 === 0
            ? pathSegments.slice(0, pathSegments.length - 1).join('/')
            : pathSegments.join('/')

    const collectionRef = doc(collection(db, pathToLastCollectionInPath))

    const firestoreWriter = {
        create: async (
            data: T,
            checkIfDocExists?: { fieldPath: keyof T; value: string }
        ): Promise<void> => {
            let snapshot
            if (checkIfDocExists) {
                const query1 = query(
                    collection(db, path),
                    where(
                        checkIfDocExists.fieldPath as string,
                        '==',
                        checkIfDocExists.value
                    )
                )

                snapshot = await getDocs(query1)
            }

            if (!snapshot || (!!snapshot && snapshot.size === 0)) {
                await setDoc(collectionRef, data)
            } else {
                throw new Error(
                    `Document with fieldPath '${checkIfDocExists?.fieldPath}==${checkIfDocExists?.value} already exists!'`
                )
            }
        },
        update: async (data: UpdateData<T>): Promise<void> => {
            if (pathSegments.length % 2 !== 0) {
                throw new Error(
                    `[Firestore Writer Hook] The path '${path}' has an odd count of segments => Points to a collection?`
                )
            }

            const docRef = dataPoint<T>(DataPointType.document, path)

            await updateDoc<T>(docRef, data)
        },
    }

    return { firestoreWriter, serverTimestamp, arrayUnion }
}

interface DebugAttendees {
    id: string
    sessionTitle: string
    date: string
    attendees: {
        firstName: string
        lastName: string
    }[]
}

const capitalizeFirstLetter = (input: string): string => {
    return input.charAt(0).toUpperCase() + input.slice(1)
}

const shell = async (
    session: DebugAttendees,
    csvString: CSVString
): Promise<string> => {
    return new Promise((resolve) => {
        session.attendees.forEach((attendee) => {
            csvString.appendRow(`${attendee.firstName},${attendee.lastName}`)
        })

        resolve(csvString.getValue())
    })
}

export const useFirestoreDebugger = <T>() => {
    useEffect(() => {
        const asyncShell = async () => {
            const debugAttendees = await fetchData()

            const csvColumns = `Vorname,Nachname\n`

            //console.log(debugAttendees.length)

            debugAttendees.forEach((session) => {
                if (session.attendees.length > 0) {
                    const attendeeCSV = session.attendees
                        .map((a) => `${a.firstName}, ${a.lastName}`)
                        .reduce((acc, curr) => `${acc}\n ${curr}`)

                    downloadBlob(
                        `${csvColumns}${attendeeCSV}`,
                        session.sessionTitle
                    )
                }
            })
        }

        void asyncShell()
    }, [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
}

const fetchData = async (): Promise<DebugAttendees[]> => {
    return new Promise(async (resolve, reject) => {
        const collectionRef = collection(db, 'sessions').withConverter(
            converter<ISession>()
        )

        const a = new Date('2022-09-01').getTime() / 1000
        const b = new Date('2022-12-31').getTime() / 1000

        const q = query(
            collectionRef,
            where('startDate', '>=', new Timestamp(a, 0)),
            where('startDate', '<=', new Timestamp(b, 0))
        )

        const debugAttendees: DebugAttendees[] = []

        const sessions = await getDocs(q)
        for (let session of sessions.docs) {
            debugAttendees.push({
                id: session.id,
                sessionTitle: `${session.data().title} (${
                    session.data().squad
                })`,
                attendees: [],
                date: session.data().startDate.toDate().toDateString(),
            })

            const attendees = await getDocs(
                query(
                    collection(
                        db,
                        `sessions/${session.id}/attendees`
                    ).withConverter(converter<ISessionAttendee>())
                )
            )

            debugAttendees[
                debugAttendees.findIndex((a) => a.id === session.id)
            ].attendees = [
                ...attendees.docs.map((d) => {
                    return {
                        firstName: capitalizeFirstLetter(d.data().firstName),
                        lastName: capitalizeFirstLetter(d.data().lastName),
                    }
                }),
            ]
        }
        resolve(debugAttendees)
    })
}

/** Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function downloadBlob(content: string, filename: string) {
    var blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)

    // Create a link to download it
    var pom = document.createElement('a')
    pom.href = url
    pom.setAttribute('download', filename)

    console.log(pom)
    // Create a blob
}

class CSVString {
    private initialValue: string
    private value: string
    constructor(initialValue: string) {
        this.value = initialValue
        this.initialValue = initialValue
    }

    appendRow(row: string): void {
        this.value += `\n${row}`
    }

    getValue(): string {
        return this.value
    }

    clearValue(): void {
        this.value = this.initialValue
    }
}
