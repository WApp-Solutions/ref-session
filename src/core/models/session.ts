import { Timestamp } from '@firebase/firestore'

export interface ISession {
    startDate: Timestamp
    endDate: Timestamp
    isRegistrationAllowed: boolean
    title: string
    attendees: string
    location: ISessionLocation
    squad: string
}

export interface ISessionLocation {
    city: string
    postalCode: number
    number: string
    street: string
}

export interface ISessionAttendee {
    firstName: string
    lastName: string
    uniqueId: string
    registeredAt: Date
}
