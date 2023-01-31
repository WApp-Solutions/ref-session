import { format } from 'date-fns-tz'
import { parseISO } from 'date-fns'

export const formatISOStringTZ = (dateString: string): string => {
    return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm:ssXXX", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
}

export const formatISOString = (dateString: string): string => {
    return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
}
