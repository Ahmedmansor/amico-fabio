import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',

  // 👇 الإضافة السحرية: دي بتزرع المتغير جوه كود الجافاسكريبت
  define: {
    // 👇 لازم دي كمان تبقى شرطة بس، عشان إحنا بقينا ع الدومين الرئيسي
    '__BASE': JSON.stringify('/'),
  },

  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        explore: resolve(__dirname, 'explore.html'),
        secrets: resolve(__dirname, 'sharm-secrets/index.html'),
        legal: resolve(__dirname, 'legal.html'),
        packageDetails: resolve(__dirname, 'package-details.html'),
        details: resolve(__dirname, 'details.html'),
        offertaSharm: resolve(__dirname, 'offerta-sharm/index.html'),
      },
    },
    outDir: 'dist',
  }
})