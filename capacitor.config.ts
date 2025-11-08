import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.77bd7f0c66f94344b841d4d70864f700',
  appName: 'personalgram-84',
  webDir: 'dist',
  server: {
    url: 'https://77bd7f0c-66f9-4344-b841-d4d70864f700.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      // Request permissions on app start
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
