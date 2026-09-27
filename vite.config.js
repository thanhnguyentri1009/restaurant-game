import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // host: true để điện thoại cùng mạng Wi-Fi mở được game qua địa chỉ Network
  server: { host: true },
  preview: { host: true },
});
