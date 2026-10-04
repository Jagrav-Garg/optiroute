import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: Object.fromEntries(['/chats', '/chat-config', '/runs', '/health', '/spending'].map(path => [path, 'http://127.0.0.1:8000'])),
  },
});
