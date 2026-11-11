import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// La clave de CARTO (fondo del mapa de musikeers) está en Vercel como CARTO_API_KEY: Vite solo
// pasa al navegador las VITE_*, así que se copia antes de que las lea. Es una clave pública de basemaps
if (!process.env.VITE_CARTO_KEY && process.env.CARTO_API_KEY) process.env.VITE_CARTO_KEY = process.env.CARTO_API_KEY

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
      // Los lectores de Word y PDF (~250 kB) solo hacen falta al importar: se guardan cuando se usan.
      // El mapa (Leaflet, ~45 kB) tampoco: sin red no hay teselas ni musikeers que enseñar
      const assets = lista('assets', /\.(js|css|woff2)$/).filter(f => !/\/(lectorWord|pdf|Mapa)[-.]/.test(f))
      const fuentes = lista('fonts', /\.woff2$/)
      // Los objetos 3D y logos del Cancionero: sin ellos, en el bolo sin cobertura salían rotos
      const iconos = [...lista('images/cancionero', /\.(webp|png|svg)$/), ...lista('images/marcas', /\.(webp|png|svg)$/),
        '/images/categorias/momento-boda-3d.webp', '/images/categorias/momento-banda-sala-3d.webp'].filter(f => existsSync(join(outDir, f)))
      const version = Date.now().toString(36)
      writeFileSync(sw, readFileSync(sw, 'utf8')
        .replace('[/*PRECACHE*/]', JSON.stringify([...assets, ...fuentes, ...iconos]))
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
