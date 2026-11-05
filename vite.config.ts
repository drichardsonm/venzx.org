// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "fs";
import path from "path";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Pasamos la configuración adicional nativa de Vite aquí:
  vite: {
    server: {
      https: {
        key: fs.readFileSync(path.resolve(process.cwd(), "key.pem")),
        cert: fs.readFileSync(path.resolve(process.cwd(), "cert.pem")),
      },
      port: 8443, // Puerto HTTPS compatible con Cloudflare sin requerir Administrador en Windows
      host: true, // Permite conexiones externas (necesario para el proxy de Cloudflare)
      strictPort: true, // Evita que Vite cambie de puerto si el 8443 llega a estar ocupado
      
      // Permitimos que Vite acepte peticiones dirigidas a tu dominio de Cloudflare
      allowedHosts: ["www.venzx.org", "venzx.org"],
      
      // Configuramos el cliente de WebSocket para que viaje a través del proxy seguro de Cloudflare
      ws: {
        protocol: "wss",         // Obliga al navegador a usar WebSocket Seguro (SSL)
        host: "www.venzx.org",   // El dominio externo por donde Cloudflare escucha
        clientPort: 443,         // Cloudflare maneja el tráfico SSL del navegador en el puerto estándar 443
      },
    },
  },
});
