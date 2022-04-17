import './ExploreContainer.scss'

import { FC } from 'react'

interface ContainerProps {}

const ExploreContainer: FC<ContainerProps> = () => {
    return (
        <div className="container">
            <strong>Hello World</strong>
            <p>
                Start with Ionic{' '}
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://ionicframework.com/docs/components"
                >
                    UI Components
                </a>
            </p>
        </div>
    )
}

export default ExploreContainer
