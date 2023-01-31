import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { parseISO } from 'date-fns'
import { format } from 'date-fns-tz'
import {
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonPopover,
    IonSelect,
    IonSelectOption,
    IonSlide,
    IonSlides,
    IonTitle,
    IonToolbar,
} from '@ionic/react'
import styles from './SessionCreate.module.scss'
import { ILocation } from '../../core/models/location'
import { ISquad } from '../../core/models/squad'
import {
    useFirebaseFirestoreReader,
    useFirebaseFirestoreWriter,
} from '../../core/services/firebase'
import { Timestamp } from '@firebase/firestore'
import { DatetimeChangeEventDetail, InputChangeEventDetail } from '@ionic/core'
import {
    IonDatetimeCustomEvent,
    IonInputCustomEvent,
} from '@ionic/core/dist/types/components'
import { arrowForward, checkmark } from 'ionicons/icons'
import { ISession, ISessionLocation } from '../../core/models/session'
import { formatISOString, formatISOStringTZ } from '../../core/utils/date'

const SessionCreate: FC<{ onDismiss: () => void }> = ({
    onDismiss: dismissMe,
}) => {
    // Optional parameters to pass to the swiper instance.
    // See https://swiperjs.com/swiper-api for valid options.
    const slideOpts = {
        initialSlide: 0,
        speed: 400,
    }

    const [locations, setLocations] = useState<ILocation[]>([])
    const locationReader = useFirebaseFirestoreReader<ILocation>('locations')
    const squadReader = useFirebaseFirestoreReader<ISquad>('squads')

    const [squads, setSquads] = useState<ISquad[]>([])
    useEffect(() => {
        locationReader.read().then((locations) => {
            setLocations(locations)
        })

        squadReader.read().then((squads) => {
            setSquads(squads)
        })
    }, [squadReader, locationReader])

    const sliderRef = useRef<HTMLIonSlidesElement>(null)
    const squadRef = useRef<HTMLIonSelectElement>(null)
    const locationRef = useRef<HTMLIonSelectElement>(null)
    const startTimeRef = useRef<HTMLIonDatetimeElement>(null)
    const endTimeRef = useRef<HTMLIonDatetimeElement>(null)
    const datetimeRef = useRef<HTMLIonDatetimeElement>(null)
    const sessionTitleRef = useRef<HTMLIonInputElement>(null)

    const [startTime, setStartTime] = useState<string>(
        format(parseISO(new Date().toISOString()), "yyyy-MM-dd'T'HH:mm:ssXXX")
    )
    const [endTime, setEndTime] = useState<string>(
        format(parseISO(new Date().toISOString()), "yyyy-MM-dd'T'HH:mm:ssXXX")
    )

    const [isSlideEnd, setIsSlideEnd] = useState<boolean>(false)

    const { firestoreWriter } =
        useFirebaseFirestoreWriter<Omit<ISession, 'id'>>('sessions')

    const handleHeaderButton = useCallback(
        async (isEnd: boolean) => {
            if (sliderRef && sliderRef.current) {
                // const isEnd = await slider.current.isEnd()
                if (!isEnd) {
                    if (sliderRef && sliderRef.current) {
                        await sliderRef.current.lockSwipes(false)
                        await sliderRef.current.slideNext()
                        await sliderRef.current.lockSwipeToNext(true)
                    }
                } else {
                    // the end of the slides
                    const selectedSquad: ISquad = squads.find(
                        (s) => s.title === squadRef.current?.value
                    ) as ISquad

                    const newSession: Omit<ISession, 'id'> = {
                        title: sessionTitleRef.current?.value as string,
                        startDate: new Timestamp(
                            new Date(
                                startTimeRef.current?.value as string
                            ).getTime() / 1000,
                            0
                        ),
                        endDate: new Timestamp(
                            new Date(
                                endTimeRef.current?.value as string
                            ).getTime() / 1000,
                            0
                        ),
                        squad: selectedSquad,
                        location: {
                            ...locations.find(
                                (l) => l.title === locationRef.current?.value
                            ),
                        } as ISessionLocation,
                        isRegistrationAllowed: false,
                    }

                    await firestoreWriter.create(newSession)

                    dismissMe()
                }
            }
        },
        [locations, firestoreWriter]
    )

    const handleIonSlideWillChange = useCallback(async () => {
        if (sliderRef && sliderRef.current) {
            const isEnd = await sliderRef.current.isEnd()
            setIsSlideEnd(isEnd)
        }
    }, [])

    const [currentDate, setCurrentDate] = useState<string>(
        new Date().toISOString()
    )

    const handleIonDatetimeChange = useCallback(
        (
            context: 'date' | 'start' | 'end',
            event: IonDatetimeCustomEvent<DatetimeChangeEventDetail>
        ) => {
            switch (context) {
                case 'date':
                    const a = format(
                        parseISO(event.detail.value as string),
                        'yyyy-MM-dd'
                    )

                    const updatedStartTime = format(
                        parseISO(startTimeRef.current?.value as string),
                        `${a}'T'HH:mm:ssXXX`
                    )

                    const updatedEndTime = format(
                        parseISO(endTimeRef.current?.value as string),
                        `${a}'T'HH:mm:ssXXX`
                    )

                    setCurrentDate(event.detail.value as string)
                    setStartTime(updatedStartTime)
                    setEndTime(updatedEndTime)
                    break
                case 'start':
                    setStartTime(event.detail.value as string)
                    break
                case 'end':
                    setEndTime(event.detail.value as string)
            }
        },
        [startTimeRef, endTimeRef]
    )

    return (
        <IonPage>
            <IonHeader translucent={true}>
                <IonToolbar>
                    <IonTitle>Neue Session erstellen</IonTitle>

                    <IonButtons slot="end">
                        <IonButton
                            onClick={() => handleHeaderButton(isSlideEnd)}
                        >
                            <IonIcon
                                icon={isSlideEnd ? checkmark : arrowForward}
                            />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen={true} class="ion-padding">
                <IonSlides
                    ref={sliderRef}
                    options={slideOpts}
                    pager={true}
                    onIonSlideWillChange={handleIonSlideWillChange}
                >
                    <IonSlide className={styles.slide}>
                        <h1>Vergebe einen Namen</h1>

                        <IonItem className={styles.nameInput}>
                            <IonInput ref={sessionTitleRef}></IonInput>
                        </IonItem>
                    </IonSlide>
                    <IonSlide className={styles.slide}>
                        <h1>Wann und Wo?</h1>
                        <IonItem>
                            <IonDatetime
                                value={currentDate}
                                ref={datetimeRef}
                                presentation="date"
                                onIonChange={(e) =>
                                    handleIonDatetimeChange('date', e)
                                }
                            />
                        </IonItem>

                        <div className={styles.timeSelection}>
                            <IonItem>
                                <IonLabel>Beginn</IonLabel>
                                <IonDatetimeButton datetime="startTime"></IonDatetimeButton>
                            </IonItem>
                            <IonItem>
                                <IonLabel>Ende</IonLabel>
                                <IonDatetimeButton datetime="endTime"></IonDatetimeButton>
                            </IonItem>

                            <IonPopover keepContentsMounted={true}>
                                <IonDatetime
                                    ref={startTimeRef}
                                    value={startTime}
                                    presentation="time"
                                    onIonChange={(e) =>
                                        handleIonDatetimeChange('start', e)
                                    }
                                    id="startTime"
                                ></IonDatetime>
                            </IonPopover>

                            <IonPopover keepContentsMounted={true}>
                                <IonDatetime
                                    ref={endTimeRef}
                                    value={endTime}
                                    presentation="time"
                                    onIonChange={(e) =>
                                        handleIonDatetimeChange('end', e)
                                    }
                                    id="endTime"
                                ></IonDatetime>
                            </IonPopover>
                        </div>

                        <IonList>
                            <IonItem>
                                <IonSelect
                                    ref={locationRef}
                                    interface="action-sheet"
                                    placeholder="Wähle einen Ort"
                                >
                                    {locations?.map((location) => (
                                        <IonSelectOption
                                            key={location.title.trim()}
                                            value={location.title}
                                        >
                                            {location.title}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonList>
                    </IonSlide>
                    <IonSlide className={styles.slide}>
                        <h1>Wer?</h1>

                        <IonList>
                            <IonItem>
                                <IonSelect
                                    ref={squadRef}
                                    interface="action-sheet"
                                    placeholder="Wähle einen Kader"
                                >
                                    {squads?.map((squad) => (
                                        <IonSelectOption
                                            key={squad.title.trim()}
                                            value={squad.title}
                                        >
                                            {squad.title}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonList>
                    </IonSlide>
                </IonSlides>
            </IonContent>
        </IonPage>
    )
}

export default SessionCreate
