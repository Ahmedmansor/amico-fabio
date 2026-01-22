import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/amico-fabio/', // تأكد أنه يطابق اسم الريبو
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        explore: resolve(__dirname, 'explore.html'),
        // إذا كان لديك صفحات أخرى أضفها هنا بنفس الطريقة
        secrets: resolve(__dirname, 'sharm-secrets/index.html'),
        legal: resolve(__dirname, 'legal.html'),
        packageDetails: resolve(__dirname, 'package-details.html'),
        details: resolve(__dirname, 'details.html'),

      },
    },
    outDir: 'dist',
  }
})