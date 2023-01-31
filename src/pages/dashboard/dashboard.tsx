import { FC, useCallback, useEffect, useRef, useState } from 'react'
import {
    useFirebaseFirestoreWriter,
    useTest,
} from '../../core/services/firebase'
import { ISession } from '../../core/models/session'
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonModal,
    IonPage,
    IonTitle,
    IonToolbar,
    useIonAlert,
    useIonModal,
    useIonRouter,
} from '@ionic/react'
import { Timestamp } from '@firebase/firestore'
import {
    add,
    addCircle,
    peopleCircle,
    personCircle,
    trashBin,
} from 'ionicons/icons'

import DashboardStyles from './dashboard.module.scss'
import SessionCard from '../../components/session-card/SessionCard'
import { RouterProps } from 'react-router'
import { info } from 'sass'
import SessionCreate from '../session-create/SessionCreate'

interface DashboardProps extends RouterProps {}

const Dashboard: FC<DashboardProps> = ({ history }) => {
    const [sessions, setSessions] = useState<ISession[]>([])
    const [isScrolling, setIsScrolling] = useState(false)

    const { firestoreWriter } =
        useFirebaseFirestoreWriter<Omit<ISession, 'id'>>('sessions')
    const firestoreSubscription = useTest<ISession>('sessions', (snap) => {
        const t: ISession[] = []
        snap.forEach((el) => {
            t.push({ ...el.data(), id: el.id })
        })
        setSessions(t)
    })

    const onContentScrollChange = useCallback(() => {
        setIsScrolling((value) => !value)
    }, [])

    const page = useRef(null)

    const [presentingElement, setPresentingElement] =
        useState<HTMLElement | null>(null)

    const sessionDeletionHandler = useCallback(
        (index: number) => {
            void firestoreWriter.delete(sessions[index].id)
        },
        [sessions, firestoreWriter]
    )

    useEffect(() => {
        setPresentingElement(page.current)
    }, [page])

    const [presentCreateModal, dismissCreateModal] = useIonModal(
        SessionCreate,
        {
            onDismiss: () => dismissCreateModal(),
        }
    )

    const openCreateModal = useCallback(() => {
        presentCreateModal({
            canDismiss: true,
            animated: true,
            presentingElement: presentingElement!,
        })
    }, [presentCreateModal, presentingElement])

    return (
        <>
            <IonPage ref={page}>
                <IonHeader collapse="fade" translucent={true}>
                    <IonToolbar>
                        <IonButtons collapse={true} slot="primary">
                            <IonButton onClick={openCreateModal}>
                                <IonIcon slot="icon-only" icon={addCircle} />
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Sitzungen</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent
                    scrollEvents={true}
                    fullscreen={true}
                    onIonScrollStart={onContentScrollChange}
                    onIonScrollEnd={onContentScrollChange}
                >
                    <IonHeader collapse="condense">
                        <IonToolbar>
                            <IonButtons slot="primary">
                                <IonButton onClick={openCreateModal}>
                                    <IonIcon
                                        slot="icon-only"
                                        icon={addCircle}
                                    />
                                </IonButton>
                            </IonButtons>
                            <IonTitle size="large">Sitzungen</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonList className={DashboardStyles.itemContainer}>
                        {sessions.map((session, index) => (
                            <IonItemSliding key={session.id}>
                                <IonItem
                                    button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        console.log(history)
                                        history.push(
                                            `/dashboard/session/${session.id}/details`
                                        )
                                    }}
                                    detail
                                >
                                    <IonLabel>
                                        <p>
                                            {`${session.startDate
                                                .toDate()
                                                .toLocaleDateString(['de-DE'], {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}Uhr`}
                                        </p>
                                        <h2>{session.title}</h2>

                                        <p>
                                            <IonIcon icon={personCircle} />
                                            {session.squad.manager.lastName}
                                        </p>
                                        <p>
                                            <IonIcon icon={peopleCircle} />
                                            {session.squad.title}
                                        </p>
                                    </IonLabel>
                                </IonItem>
                                <IonItemOptions
                                    side="end"
                                    onIonSwipe={() =>
                                        sessionDeletionHandler(index)
                                    }
                                >
                                    <IonItemOption
                                        color="danger"
                                        expandable
                                        slot="icon-only"
                                    >
                                        <IonIcon icon={trashBin} />
                                    </IonItemOption>
                                </IonItemOptions>
                            </IonItemSliding>
                        ))}
                    </IonList>
                </IonContent>
            </IonPage>
        </>
    )
}

export default Dashboard
