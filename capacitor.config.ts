import { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard'

const config: CapacitorConfig = {
    appId: 'com.wapp-solutions.ref-session',
    appName: 'ref-session',
    webDir: 'build',
    bundledWebRuntime: false,

    plugins: {
        Keyboard: {
            resize: KeyboardResize.None,
            style: KeyboardStyle.Dark,
            resizeOnFullScreen: true,
        },
    },
}

export default config
