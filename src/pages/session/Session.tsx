import {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonModal,
    IonSkeletonText,
    IonText,
    IonTitle,
    IonToolbar,
    useIonToast,
} from '@ionic/react'
import { FC, useCallback, useState } from 'react'
import { useParams } from 'react-router'

import SessionStyles from './Session.module.scss'

import {
    useFirebaseFirestoreWriter,
    useFirestoreSubscription,
} from '../../core/services/firebase'
import { ISession, ISessionAttendee } from '../../core/models/session'
import { useForm } from 'react-hook-form'
import {
    checkmarkCircleOutline,
    homeOutline,
    lockClosed,
    peopleOutline,
    timerOutline,
} from 'ionicons/icons'

const Session: FC = () => {
    const { sessionID } = useParams<{ sessionID: string }>()
    const [showModal] = useState(true)
    const [registrationSucceeded, setRegistrationSucceeded] = useState({
        firstname: '',
        isSucceeded: false,
    })
    const [snapshotData, setSnapshotData] = useState<ISession>()
    const [lastName, setLastName] = useState<string>()
    const [firstName, setFirstName] = useState<string>()

    type MyFieldValues = {
        firstname: string
        lastname: string
    }

    const [present] = useIonToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MyFieldValues>({
        mode: 'all',
        reValidateMode: 'onSubmit',
    })

    useFirestoreSubscription<ISession>(`sessions/${sessionID}`, (snapshot) => {
        setSnapshotData(snapshot.data())
    })

    const { firestoreWriter: attendeeWriter } =
        useFirebaseFirestoreWriter<ISessionAttendee>(
            `sessions/${sessionID}/attendees`
        )

    const registerCallback = useCallback(async () => {
        const uniqueId = `${firstName?.toLowerCase().trim()}${lastName
            ?.toLowerCase()
            .trim()}`

        if (!!firstName && !!lastName) {
            try {
                await attendeeWriter.create(
                    {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        uniqueId,
                        registeredAt: new Date(),
                    },
                    {
                        fieldPath: 'uniqueId',
                        value: uniqueId,
                    }
                )
                setRegistrationSucceeded({
                    firstname: firstName ?? '',
                    isSucceeded: true,
                })
                setFirstName('')
                setLastName('')
            } catch (e: unknown) {
                await present({
                    mode: 'ios',
                    message: 'Du bist bereits angemeldet!',
                    icon: checkmarkCircleOutline,
                    color: 'success',
                    position: 'top',
                    duration: 5000,
                })
            }
        }
    }, [attendeeWriter, firstName, lastName, present])

    return (
        <>
            {/* Default */}
            <IonModal isOpen={showModal} backdropDismiss={false}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle className={SessionStyles.title}>
                            {snapshotData?.title ?? (
                                <IonSkeletonText animated={true} />
                            )}
                        </IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    {!snapshotData?.isRegistrationAllowed && (
                        <>
                            <div className={SessionStyles.lockScreenBack}></div>
                            <div className={SessionStyles.lockScreenFront}>
                                <IonIcon
                                    icon={lockClosed}
                                    size="large"
                                ></IonIcon>
                                <p>
                                    <strong>
                                        Die Anmeldung ist aktuell deaktiviert!
                                    </strong>
                                </p>
                            </div>
                        </>
                    )}
                    {!registrationSucceeded.isSucceeded ? (
                        <form
                            className={SessionStyles.form}
                            onSubmit={handleSubmit(registerCallback)}
                        >
                            <div className={SessionStyles.upperPart}>
                                <div className={SessionStyles.logoWrapper}>
                                    <img
                                        alt="BFV logo"
                                        src={`${process.env.PUBLIC_URL}/assets/BFV_Logo.svg.png`}
                                    />
                                </div>

                                <div>
                                    <IonItem>
                                        <IonLabel position="floating">
                                            Vorname
                                        </IonLabel>
                                        <IonInput
                                            {...register('firstname', {
                                                required: true,
                                            })}
                                            onIonInput={(e: any) =>
                                                setFirstName(
                                                    e.target.value.trim()
                                                )
                                            }
                                            value={firstName}
                                            disabled={
                                                !snapshotData?.isRegistrationAllowed
                                            }
                                        ></IonInput>
                                    </IonItem>
                                    {errors.firstname && (
                                        <IonText color="danger">
                                            Bitte gib einen Vornamen an!
                                        </IonText>
                                    )}
                                    <IonItem>
                                        <IonLabel position="floating">
                                            Nachname
                                        </IonLabel>
                                        <IonInput
                                            {...register('lastname', {
                                                required: true,
                                                validate: (value: string) => {
                                                    return (
                                                        value.trim().length > 0
                                                    )
                                                },
                                            })}
                                            onIonInput={(e: any) =>
                                                setLastName(
                                                    e.target.value.trim()
                                                )
                                            }
                                            value={lastName}
                                            disabled={
                                                !snapshotData?.isRegistrationAllowed
                                            }
                                        ></IonInput>
                                    </IonItem>
                                    {errors.lastname && (
                                        <IonText color="danger">
                                            Bitte gib einen Nachnamen an!
                                        </IonText>
                                    )}
                                </div>
                            </div>

                            <div className={SessionStyles.eventDetails}>
                                <h2>Eventdaten</h2>
                                <p>
                                    <IonIcon icon={peopleOutline} />
                                    {snapshotData?.squad}
                                </p>
                                <p>
                                    <IonIcon icon={homeOutline} />
                                    {`${snapshotData?.location.street} ${snapshotData?.location.number}, ${snapshotData?.location.postalCode} ${snapshotData?.location.city}`}
                                </p>
                                <p>
                                    <IonIcon icon={timerOutline} />
                                    {`${snapshotData?.startDate
                                        .toDate()
                                        .toLocaleString('de', {
                                            timeStyle: 'short',
                                        })} Uhr - ${snapshotData?.endDate
                                        .toDate()
                                        .toLocaleString('de', {
                                            timeStyle: 'short',
                                        })} Uhr`}
                                </p>
                            </div>
                            <IonButton
                                className={SessionStyles.register}
                                expand="full"
                                size="large"
                                strong
                                mode="md"
                                type="submit"
                                disabled={!snapshotData?.isRegistrationAllowed}
                            >
                                Anmelden
                            </IonButton>
                        </form>
                    ) : (
                        <div className={SessionStyles.successDialog}>
                            <IonIcon icon={checkmarkCircleOutline} />
                            <b>{`Du wurdest erfolgreich angemeldet, ${registrationSucceeded.firstname}!`}</b>
                        </div>
                    )}
                </IonContent>
            </IonModal>
        </>
    )
}

export default Session
