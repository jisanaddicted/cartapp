import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // 👈 CRITICAL: This forces Vite to use relative paths so assets load correctly inside the Shopify iframe!
  plugins: [react()],
  build: {
    // This pushes the compiled React app directly into the backend folder structure
    outDir: '../backend/shopify-milestone-backend/dist',
    emptyOutDir: true,
  },
  // Ensure your development server knows how to talk to your backend locally
  server: {
    port: 5174,
    proxy: {
      '^/api(/|(\\?.*)?$)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});