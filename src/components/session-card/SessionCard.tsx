import { FC } from 'react'

import SessionCardStyles from './SessionCard.module.scss'
import { ISession } from '../../core/models/session'
import { IonIcon } from '@ionic/react'
import { person } from 'ionicons/icons'

const SessionCard: FC<{ session: Partial<ISession> }> = ({ session }) => {
    return (
        <div className={SessionCardStyles.card}>
            <div className={SessionCardStyles.dateWrapper}>
                <span className={SessionCardStyles.month}>04</span>
                <span className={SessionCardStyles.year}>22</span>
            </div>
            <div className={SessionCardStyles.contentWrapper}>
                <div className={SessionCardStyles.titleWrapper}>
                    <div className={SessionCardStyles.title}>
                        {session.title}
                        <div className={SessionCardStyles.instructor}>
                            <IonIcon icon={person} />
                            <i>{session.instructor}</i>
                        </div>
                    </div>
                    <div
                        className={`${SessionCardStyles.statusIndicator} ${
                            session.isRegistrationAllowed
                                ? SessionCardStyles.active
                                : null
                        }`}
                    ></div>
                </div>

                <div className={SessionCardStyles.content}>
                    <div>09 Teilnehmer</div>
                </div>
            </div>
        </div>
    )
}

export default SessionCard
