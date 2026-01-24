import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/amico-fabio/',

  // 👇 الإضافة السحرية: دي بتزرع المتغير جوه كود الجافاسكريبت
  define: {
    '__BASE': JSON.stringify('/amico-fabio/'),
    // أو لو عايزها أوتوماتيك ممكن تكتب: JSON.stringify(process.env.BASE_URL || '/amico-fabio/')
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
      },
    },
    outDir: 'dist',
  }
})