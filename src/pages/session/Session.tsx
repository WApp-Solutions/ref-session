import {
    IonAccordion,
    IonAccordionGroup,
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
import { FC, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'

import SessionStyles from './Session.module.scss'

import {
    useFirebaseFirestoreReader,
    useFirebaseFirestoreWriter,
    useFirestoreSubscription,
} from '../../core/services/firebase'
import { ISession, ISessionAttendee } from '../../core/models/session'
import { useForm } from 'react-hook-form'
import {
    caretDownCircle,
    checkmarkCircleOutline,
    closeOutline,
    flashOffOutline,
    homeOutline,
    lockClosed,
    peopleOutline,
    timerOutline,
} from 'ionicons/icons'
import { useDeviceID } from '../../core/services/device'

const Session: FC = () => {
    const { sessionID } = useParams<{ sessionID: string }>()
    const [showModal] = useState(true)
    const [registrationSucceeded, setRegistrationSucceeded] = useState<{
        firstname: string
        isSucceeded: boolean
    }>()
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

    const deviceID = useDeviceID(
        sessionID,
        snapshotData?.endDate.toDate() ?? new Date()
    )
    const firestoreReader = useFirebaseFirestoreReader<ISessionAttendee>(
        `sessions/${sessionID}/attendees`
    )
    useEffect(() => {
        if (!!deviceID) {
            firestoreReader
                .checkExistance('deviceID', deviceID)
                .then((isRegistered) => {
                    if (typeof isRegistered !== 'boolean') {
                        setRegistrationSucceeded({
                            firstname: isRegistered.firstName,
                            isSucceeded: true,
                        })
                    } else {
                        setRegistrationSucceeded(undefined)
                    }
                })
        }
    }, [deviceID, firestoreReader, setRegistrationSucceeded])

    const { firestoreWriter: attendeeWriter } =
        useFirebaseFirestoreWriter<ISessionAttendee>(
            `sessions/${sessionID}/attendees`
        )

    const registerCallback = useCallback(async () => {
        const uniqueId = `${firstName?.toLowerCase().trim()}${lastName
            ?.toLowerCase()
            .trim()}`

        if (!!firstName && !!lastName && !!deviceID) {
            try {
                await attendeeWriter.create(
                    {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        uniqueId,
                        registeredAt: new Date(),
                        deviceID,
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
        } else if (!deviceID) {
            await present({
                mode: 'ios',
                message: 'Dein Gerät konnte nicht identifiziert werden!',
                icon: flashOffOutline,
                color: 'danger',
                header: 'Anmeldung nicht möglich!',
                position: 'top',
                buttons: [{ role: 'cancel', icon: closeOutline }],
                duration: 15000,
            })
        }
    }, [
        attendeeWriter,
        firstName,
        lastName,
        present,
        setRegistrationSucceeded,
        deviceID,
    ])

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
                <IonContent scrollY={false}>
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
                    {registrationSucceeded === undefined ||
                    !registrationSucceeded.isSucceeded ? (
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
                            <IonAccordionGroup>
                                <IonAccordion
                                    value="first"
                                    toggleIcon={caretDownCircle}
                                    toggleIconSlot="start"
                                >
                                    <IonItem slot="header">
                                        <IonLabel>Eventdaten</IonLabel>
                                    </IonItem>
                                    <div
                                        className={SessionStyles.eventDetails}
                                        slot="content"
                                    >
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
                                </IonAccordion>
                            </IonAccordionGroup>
                        </form>
                    ) : (
                        <div className={SessionStyles.successDialog}>
                            <IonIcon icon={checkmarkCircleOutline} />
                            <b>Du wurdest erfolgreich angemeldet,</b>
                            <b>{registrationSucceeded.firstname}!</b>
                        </div>
                    )}
                </IonContent>
            </IonModal>
        </>
    )
}

export default Session
