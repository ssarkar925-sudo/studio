
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'SC Billing',
  webDir: 'out',
  server: {
    url: 'http://10.0.2.2:9002',
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
