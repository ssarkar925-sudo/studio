
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'SC Billing',
  webDir: 'out',
  server: {
    url: 'http://YOUR_COMPUTER_IP:9002',
    cleartext: true,
  },
};

export default config;
