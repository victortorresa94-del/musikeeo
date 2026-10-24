import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// La app tiene que abrir sin cobertura (el cancionero se usa en el bolo): al publicar, el
// service worker recibe la lista de todo el código y las fuentes para guardarlo al instalarse,
// y una versión nueva para que el móvil lo renueve en cada publicación.
function precacheServiceWorker(): Plugin {
  let outDir = 'dist'
  return {
    name: 'musikeeo-precache-sw',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir },
    closeBundle() {
      const sw = join(outDir, 'service-worker.js')
      if (!existsSync(sw)) return
      const lista = (dir: string, re: RegExp) => existsSync(join(outDir, dir)) ? readdirSync(join(outDir, dir)).filter(f => re.test(f)).map(f => `/${dir}/${f}`) : []
      const assets = lista('assets', /\.(js|css|woff2)$/)
      const fuentes = lista('fonts', /\.woff2$/)
      const version = Date.now().toString(36)
      writeFileSync(sw, readFileSync(sw, 'utf8')
        .replace('[/*PRECACHE*/]', JSON.stringify([...assets, ...fuentes]))
        .replace('"/*VERSION*/dev"', JSON.stringify(version)))
    },
  }
}

export default defineConfig({
  plugins: [react(), precacheServiceWorker()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'sonner'],
          'vendor-utils': ['zustand', 'zod', 'react-hook-form', '@hookform/resolvers', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
