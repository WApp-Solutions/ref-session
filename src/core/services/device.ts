import { useCookies } from 'react-cookie'
import { useEffect } from 'react'

export const useDeviceID = (
    sessionID: string,
    expiresAt: Date
): string | undefined => {
    const [cookies, setCookie] = useCookies([`deviceID-${sessionID}`])
    const deps = [cookies[`deviceID-${sessionID}`], sessionID]
    useEffect(() => {
        if (!cookies[`deviceID-${sessionID}`]) {
            const deviceID =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15)
            // add two hours to expiresAt
            expiresAt.setHours(expiresAt.getHours() + 2)
            setCookie(`deviceID-${sessionID}`, deviceID, {
                path: `${process.env.PUBLIC_URL}/register/session/${sessionID}`,
                secure: true,
                expires: expiresAt,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return cookies[`deviceID-${sessionID}`]
}
