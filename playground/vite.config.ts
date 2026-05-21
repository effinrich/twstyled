import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { twStyled } from 'tw-styled-vite-plugin'

export default defineConfig({
  plugins: [tailwindcss(), twStyled(), react()]
})
