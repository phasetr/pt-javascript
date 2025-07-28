import { defineConfig } from 'vite';
import honox from 'honox/vite';

export default defineConfig({
  plugins: [
    honox()
  ]
  // ssr: {
  //   external: ['sql.js']
  // }
});