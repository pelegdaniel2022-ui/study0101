import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.study0101.physics',
  appName: 'PhysicsStudy',
  webDir: 'dist',
  android: {
    backgroundColor: '#0d0d14',
    allowMixedContent: false,
    loggingBehavior: 'none',
    webContentsDebuggingEnabled: false,
  },
}

export default config
