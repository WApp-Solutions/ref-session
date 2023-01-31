import { FirebaseOptions, initializeApp } from 'firebase/app'
import {
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    DocumentSnapshot,
    FirestoreDataConverter,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    QuerySnapshot,
    serverTimestamp,
    setDoc,
    Unsubscribe,
    UpdateData,
    updateDoc,
    where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { DataPointType } from '../models/data-point.firebase'
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

export const useTest = <T = DocumentData>(
    path: string,
    onNextSnapshot: (snapshot: QuerySnapshot<T>) => void
) => {
    const [unsubscribe, setUnsubscribe] = useState<{ t: Unsubscribe }>()

    useEffect(() => {
        const unsub = onSnapshot(
            query(
                collection(db, path, '').withConverter(converter<T>()),
                orderBy('startDate'),
                limit(20)
            ),
            onNextSnapshot
        )
        setUnsubscribe({ t: unsub })
        return () => {
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return unsubscribe
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

        return () => {
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return unsubscribe
}

export const useFirebaseFirestoreReader = <T>(path: string) => {
    const pathSegments = path.split('/')

    const pathToLastCollectionInPath =
        pathSegments.length % 2 === 0
            ? pathSegments.slice(0, pathSegments.length - 1).join('/')
            : pathSegments.join('/')

    const [firestoreReader, setFirestoreReader] = useState({
        checkExistance: async (
            key: string,
            value: string
        ): Promise<boolean | T> => Promise.resolve(false),
        read: async (): Promise<T[]> => Promise.resolve([]),
    })

    if (pathSegments.length % 2 === 0) {
        throw new Error(
            `[Firestore Reader Hook] The path '${path}' has an even count of segments => Points to a collection?`
        )
    }
    useEffect(() => {
        const firestoreReader = {
            checkExistance: async (
                key: string,
                value: string
            ): Promise<boolean | T> => {
                const readQuery = query(
                    collection(db, path),
                    where(key, '==', value)
                )
                const snapshot = await getDocs(readQuery)

                return snapshot.size > 0 && (snapshot.docs[0].data() as T)
            },
            read: async () => {
                console.log('select from DB')
                const docs = await getDocs(
                    query<T>(
                        collection(
                            db,
                            pathToLastCollectionInPath
                        ).withConverter(converter<T>())
                    )
                )
                let cleanData: T[] = []
                docs.forEach((doc) => (cleanData = [...cleanData, doc.data()]))

                return cleanData
            },
        }

        setFirestoreReader(firestoreReader)
    }, [setFirestoreReader, path])

    return firestoreReader
}

export const useFirebaseFirestoreWriter = <T>(path: string) => {
    const pathSegments = path.split('/')

    const pathToLastCollectionInPath =
        pathSegments.length % 2 === 0
            ? pathSegments.slice(0, pathSegments.length - 1).join('/')
            : pathSegments.join('/')

    let collectionRef

    const firestoreWriter = {
        create: async (
            data: Omit<T, 'id'>,
            checkIfDocExists?: { fieldPath: keyof T; value: string }
        ): Promise<void> => {
            collectionRef = doc(collection(db, pathToLastCollectionInPath))
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
                    `Document with fieldPath '${checkIfDocExists?.fieldPath}==${checkIfDocExists?.value}' already exists!`
                )
            }
        },
        update: async (data: UpdateData<Omit<T, 'id'>>): Promise<void> => {
            if (pathSegments.length % 2 !== 0) {
                throw new Error(
                    `[Firestore Writer Hook] The path '${path}' has an odd count of segments => Points to a collection?`
                )
            }
            const docRef = dataPoint<T>(DataPointType.document, path)

            await updateDoc<Omit<T, 'id'>>(docRef, data)
        },
        delete: async (documentId: string): Promise<void> => {
            const docRef = dataPoint<T>(
                DataPointType.document,
                `${path}/${documentId}`
            )

            await deleteDoc(docRef)
        },
    }

    return { firestoreWriter, serverTimestamp, arrayUnion }
}

export const useFirebaseSessionReader = (id: string) => {
    const [unsubscribe, setUnsubscribe] = useState<{ t: Unsubscribe }>()
    const [test, setTest] = useState<ISession>()

    useEffect(() => {
        const unsub = onSnapshot<ISession>(
            doc(db, `sessions/${id}`).withConverter(converter<ISession>()),
            (snap) => {
                setTest({ ...(snap.data() as ISession), id: snap.id })
            }
        )
        setUnsubscribe({ t: unsub })

        return () => {
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { unsubscribe, test }
}

export const useFirebaseSessionAttendeeReader = (id: string) => {
    const [unsubscribe, setUnsubscribe] = useState<{ t: Unsubscribe }>()
    const [test, setTest] = useState<ISessionAttendee[]>()

    useEffect(() => {
        const unsub = onSnapshot<ISessionAttendee>(
            query<ISessionAttendee>(
                collection(db, `sessions/${id}/attendees`).withConverter(
                    converter<ISessionAttendee>()
                )
            ),
            (snap) => {
                let cleanData: ISessionAttendee[] = []
                snap.docs.forEach((doc) => {
                    let document: ISessionAttendee = {
                        ...doc.data(),
                        id: doc.id,
                    }
                    cleanData = [...cleanData, document]
                })

                setTest([
                    ...cleanData.sort((a, b) =>
                        a.lastName.localeCompare(b.lastName)
                    ),
                ])
            }
        )
        setUnsubscribe({ t: unsub })

        return () => {
            unsub()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return { unsubscribe, test }
}
