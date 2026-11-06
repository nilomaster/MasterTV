import type { CapacitorConfig } from '@capacitor/cli';

// MasterTV Android and Web configuration
// All comments in this file strictly follow ASCII rules
const config: CapacitorConfig = {
  appId: 'com.mastertv.app',
  appName: 'MasterTV',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0d14',
  },
};

export default config;
