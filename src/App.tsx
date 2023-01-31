import './theme/variables.scss'
/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

import './base.scss'

import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { FC } from 'react'
import { Redirect, Route } from 'react-router-dom'
import Session from './pages/session/Session'
import { CookiesProvider } from 'react-cookie'
import Dashboard from './pages/dashboard/dashboard'
import SessionDetail from './pages/session-detail/SessionDetail'

/* Core CSS required for Ionic components to work properly */
/* Basic CSS for apps built with Ionic */
/* Optional CSS utils that can be commented out */
/* Theme variables */
setupIonicReact()

const App: FC = () => {
    return (
        <CookiesProvider defaultSetOptions={{ path: '/' }}>
            <IonApp>
                <IonReactRouter>
                    <IonRouterOutlet>
                        <Route
                            path={`${process.env.PUBLIC_URL}/register/session/:sessionID`}
                            component={Session}
                        />
                        <Route
                            exact
                            path={`${process.env.PUBLIC_URL}/dashboard`}
                            component={Dashboard}
                        />
                        <Route
                            path={`${process.env.PUBLIC_URL}/dashboard/session/:sessionID/:segmentID`}
                            component={SessionDetail}
                        />
                        <Route exact path="/">
                            <Redirect
                                to={`${process.env.PUBLIC_URL}/dashboard`}
                            />
                        </Route>
                    </IonRouterOutlet>
                </IonReactRouter>
            </IonApp>
        </CookiesProvider>
    )
}

export default App
