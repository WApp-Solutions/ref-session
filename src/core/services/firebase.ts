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

const firebaseOptions: FirebaseOptions = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
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

    const pathToLastDocumentInPath =
        pathSegments.length % 2 !== 0
            ? pathSegments.join('/')
            : pathSegments.slice(0, pathSegments.length - 1).join('/')

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
