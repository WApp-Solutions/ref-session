import { FC } from 'react'
import { useIonRouter } from '@ionic/react'

import HeaderStyles from './Header.module.scss'

const Header: FC = () => {
    const router = useIonRouter()
    return router.routeInfo.pathname.includes('register') ? null : (
        <div className={HeaderStyles.header}>
            <img
                className={HeaderStyles.logo}
                alt="BFV logo"
                src={`${process.env.PUBLIC_URL}/assets/logo_light.svg`}
            />
        </div>
    )
}

export default Header
