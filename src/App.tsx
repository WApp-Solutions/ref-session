import './theme/variables.scss'
import '@ionic/react/css/core.css'
import '@ionic/react/css/display.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/typography.css'

import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { FC } from 'react'
import { Route } from 'react-router-dom'
import Session from './pages/session/Session'
import Debug from './pages/debug/Debug'

/* Core CSS required for Ionic components to work properly */
/* Basic CSS for apps built with Ionic */
/* Optional CSS utils that can be commented out */
/* Theme variables */
setupIonicReact()

const App: FC = () => {
    return (
        <IonApp>
            <IonReactRouter>
                <IonRouterOutlet>
                    <Route path="/register/session/:sessionID">
                        <Session />
                    </Route>
                    <Route path="/debug/attendees">
                        <Debug />
                    </Route>
                </IonRouterOutlet>
            </IonReactRouter>
        </IonApp>
    )
}

export default App
