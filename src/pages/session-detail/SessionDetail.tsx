import { FC, useCallback, useEffect, useRef, useState } from 'react'

import { RouteComponentProps, RouterProps } from 'react-router-dom'
import {
    IonAvatar,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonItemDivider,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonPage,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToggle,
    IonToolbar,
} from '@ionic/react'
import {
    useFirebaseFirestoreReader,
    useFirebaseFirestoreWriter,
    useFirebaseSessionAttendeeReader,
    useFirebaseSessionReader,
} from '../../core/services/firebase'
import {
    add,
    arrowBack,
    informationCircle,
    key,
    map,
    mapOutline,
    mapSharp,
    peopleCircle,
    personCircle,
    save,
    saveOutline,
    trashBin,
    warning,
} from 'ionicons/icons'
import { info } from 'sass'
import {
    InputChangeEventDetail,
    SegmentChangeEventDetail,
    ToggleChangeEventDetail,
} from '@ionic/core'
import { ISession, ISessionAttendee } from '../../core/models/session'
import {
    IonInputCustomEvent,
    IonToggleCustomEvent,
} from '@ionic/core/dist/types/components'
import { useExcelExport } from '../../core/services/data-export'

interface SessionDetailProps
    extends RouteComponentProps<{ sessionID: string; segmentID: string }>,
        RouterProps {}

const SessionDetail: FC<SessionDetailProps> = ({ match, history }) => {
    const { unsubscribe, test } = useFirebaseSessionReader(
        match.params.sessionID
    )

    const { firestoreWriter: sessionWriter } =
        useFirebaseFirestoreWriter<ISession>(
            `sessions/${match.params.sessionID}`
        )

    const { unsubscribe: unsub, test: attendees } =
        useFirebaseSessionAttendeeReader(match.params.sessionID)
    /*const attendees = useFirebaseFirestoreReader<ISessionAttendee>(
        `sessions/${match.params.sessionID}/attendees`
    )*/

    const { workbook, exportExcel } = useExcelExport('test', attendees)

    const [segmentValue, setSegmentValue] = useState<'details' | 'attendees'>(
        'details'
    )

    const segment = useRef<HTMLIonSegmentElement>(null)
    const newAttendeeInputRef = useRef<HTMLIonInputElement>(null)

    useEffect(() => {
        console.log('useEffect')
        if (segment && segment.current) {
            segment.current.value = match.params.segmentID
        }
    }, [segment])

    const ionSegmentChangeHandler = useCallback(
        (segmentChange: CustomEvent<SegmentChangeEventDetail>) => {
            setSegmentValue(
                segmentChange.detail.value as 'attendees' | 'details'
            )
        },
        []
    )

    const { firestoreWriter: attendeeWriter } =
        useFirebaseFirestoreWriter<ISessionAttendee>(
            `sessions/${match.params.sessionID}/attendees`
        )

    const handleAttendeeCreation = useCallback(async () => {
        const tmp = newAttendeeInputRef.current?.value as string
        const tmpArray = tmp.split(' ')
        const firstName = tmpArray[0]
        const lastName = tmpArray[1]
        const uniqueId = `${tmp.toLowerCase().trim()}`

        console.log('create')
        try {
            await attendeeWriter.create(
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    uniqueId,
                    deviceID: 'BY_ADMIN',
                    registeredAt: new Date(),
                },
                {
                    fieldPath: 'uniqueId',
                    value: uniqueId,
                }
            )
            if (newAttendeeInputRef.current) {
                newAttendeeInputRef.current.value = ''
            }
        } catch (e) {
            console.log(e)
        }
    }, [])

    const [isNewAttendeeNameValid, setIsNewAttendeeNameValid] = useState(false)

    const handleIonInputChange = useCallback(
        (event: IonInputCustomEvent<InputChangeEventDetail>) => {
            if ((event.detail.value as string).match(/(.+\s.+)/g)) {
                setIsNewAttendeeNameValid(true)
            } else {
                setIsNewAttendeeNameValid(false)
            }
        },
        []
    )

    const attendeeDeletionHandler = useCallback(
        (index: number) => {
            if (attendees) {
                void attendeeWriter.delete(attendees[index].id)
            }
        },
        [attendees, attendeeWriter]
    )

    const handleIsRegistrationAllowedToggle = useCallback(
        (
            event: IonToggleCustomEvent<ToggleChangeEventDetail>,
            id: string | undefined
        ) => {
            void sessionWriter.update({
                ...test,
                isRegistrationAllowed: event.detail.checked,
            })
        },
        [sessionWriter, test]
    )

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons>
                        <IonButton
                            slot="start"
                            onClick={(e) => {
                                e.preventDefault()
                                history.goBack()
                            }}
                        >
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>{test?.title}</IonTitle>
                </IonToolbar>
                <IonToolbar>
                    <IonSegment
                        ref={segment}
                        onIonChange={ionSegmentChangeHandler}
                    >
                        <IonSegmentButton value="details">
                            <IonIcon icon={informationCircle} />
                        </IonSegmentButton>
                        <IonSegmentButton value="attendees">
                            <IonIcon icon={peopleCircle} />
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>
            <IonContent scrollEvents={true} fullscreen={true}>
                {segmentValue === 'details' ? (
                    <IonList>
                        <IonListHeader>
                            <IonLabel>Details</IonLabel>
                        </IonListHeader>
                        <IonItem lines="full">
                            <IonIcon slot="start" icon={key} />
                            <span>{test?.id}</span>
                        </IonItem>
                        <IonItem lines="full">
                            <IonIcon slot="start" icon={warning} />
                            <IonLabel>Aktive Sitzung</IonLabel>
                            <IonToggle
                                slot="end"
                                checked={test?.isRegistrationAllowed}
                                onIonChange={(event) =>
                                    handleIsRegistrationAllowedToggle(
                                        event,
                                        test?.id
                                    )
                                }
                            ></IonToggle>
                        </IonItem>
                        <IonItem lines="full">
                            <IonIcon slot="start" icon={personCircle} />
                            <IonLabel position="stacked">
                                <b>Titel</b>
                            </IonLabel>
                            <p>{test?.title}</p>
                        </IonItem>

                        <IonItem lines="full">
                            <IonIcon slot="start" icon={peopleCircle} />
                            <IonLabel position="stacked">
                                <b>Gruppe</b>
                            </IonLabel>
                            <p>{test?.squad.title}</p>
                        </IonItem>
                        <IonItem lines="full">
                            <IonIcon slot="start" icon={mapSharp} />
                            <IonLabel position="stacked">
                                <b>Ort</b>
                            </IonLabel>
                            <span>
                                {test?.location.street} {test?.location.number}
                            </span>
                            {test?.location.postalCode} {test?.location.city}
                            <a
                                href="https://goo.gl/maps/K3zBFZhLk8tQtzeX6"
                                target="_blank"
                            >
                                <IonIcon slot="end" icon={mapSharp} />
                            </a>
                        </IonItem>
                    </IonList>
                ) : (
                    <IonList>
                        <IonListHeader>
                            <IonLabel>
                                {`Teilnehmer (${
                                    attendees ? attendees.length : 0
                                })`}
                            </IonLabel>
                        </IonListHeader>
                        <IonItem lines="full">
                            <IonButton
                                slot="end"
                                onClick={handleAttendeeCreation}
                                disabled={!isNewAttendeeNameValid}
                            >
                                Hinzufügen
                            </IonButton>
                            <IonLabel position="stacked">Name</IonLabel>
                            <IonInput
                                onIonChange={handleIonInputChange}
                                ref={newAttendeeInputRef}
                            />
                        </IonItem>
                        <IonItemDivider />
                        {attendees?.map((a, index) => (
                            <IonItemSliding key={a.id}>
                                <IonItem lines="full">
                                    <IonLabel>
                                        <h3>
                                            {a.lastName}, {a.firstName}
                                        </h3>
                                    </IonLabel>
                                </IonItem>
                                <IonItemOptions
                                    side="end"
                                    onIonSwipe={() =>
                                        attendeeDeletionHandler(index)
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
                )}
            </IonContent>
        </IonPage>
    )
}

export default SessionDetail
