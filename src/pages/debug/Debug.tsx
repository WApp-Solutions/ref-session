import { FC } from 'react'
import {useFirestoreDebugger, useFirestoreSubscription} from '../../core/services/firebase'
import { ISession, ISessionAttendee } from '../../core/models/session'

// Sessions to fetch
// 8fJjz5fQpsTMSbX9L322

const Debug: FC = () => {
    useFirestoreDebugger<ISession[]>()

    return <div>Debug</div>
}

export default Debug
