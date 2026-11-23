import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.bensinku.app',
  appName: 'BensinKu',
  webDir: 'dist',
  android: {
    backgroundColor: '#f6f7f9',
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
