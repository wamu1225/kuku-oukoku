import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages の固定 BASE。'./' だとサブディレクトリ（/attack/ など）から
  // assets/ への相対パス解決が失敗するため、絶対パス指定が必須。
  base: '/kuku-oukoku/',
})
