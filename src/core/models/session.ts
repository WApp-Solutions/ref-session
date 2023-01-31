import { Timestamp } from '@firebase/firestore'
import { ILocation } from './location'
import { ISquad } from './squad'

export interface ISession {
    id: string
    startDate: Timestamp
    endDate: Timestamp
    isRegistrationAllowed: boolean
    title: string
    location: ISessionLocation
    instructor?: string
    squad: ISquad
}

export interface ISessionLocation extends Omit<ILocation, 'title'> {}

export interface ISessionAttendee {
    id: string
    firstName: string
    lastName: string
    uniqueId: string
    deviceID: string
    registeredAt: Date
}
