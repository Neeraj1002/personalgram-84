import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.77bd7f0c66f94344b841d4d70864f700',
  appName: 'personalgram-84',
  webDir: 'dist',
  // Remove server.url for production APK - it should use bundled files
  // Only use server.url during development for live reload
  plugins: {
    Camera: {
      // Request permissions on app start
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
