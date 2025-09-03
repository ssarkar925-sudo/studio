import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'SC Billing',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
