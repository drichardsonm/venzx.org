# VENZX en tu servidor (Node.js + Supabase Docker + Ollama vía Cloudflare Zero Trust)

## 1. Base de datos
1. Supabase en Docker: https://supabase.com/docs/guides/self-hosting/docker
2. Abre Studio → SQL Editor → pega y ejecuta `selfhost/schema.sql`.
3. Copia `ANON_KEY` y `SERVICE_ROLE_KEY` del `.env` de tu Docker de Supabase.

## 2. Ollama
```bash
ollama pull llama3.2:3b
```
En Cloudflare Zero Trust:
- Tunnel → Public hostname `ollama.tudominio.com` → `http://localhost:11434`
  (en "HTTP Settings" pon **HTTP Host Header** = `localhost:11434`, o Ollama responderá 403).
- Access → Application para `ollama.tudominio.com` con política **Service Auth**,
  y crea un **Service Token** → pon su ID/Secret en `CF_ACCESS_CLIENT_ID/SECRET`.

Si la IA falla o tarda, la app sigue funcionando con resultados calculados.

## 3. Supabase por el túnel
- Public hostname `supabase.tudominio.com` → `http://localhost:8000` (Kong).
- **No** pongas Access con login en este hostname: el navegador de los ciudadanos no podría pasar.
  (La app nunca consulta tablas desde el navegador; todo pasa por el servidor Node.)
- Si el servidor Node está en la misma máquina, usa `SUPABASE_URL=http://localhost:8000`.

## 4. Compilar y ejecutar la app
```bash
cp selfhost/.env.example .env      # y rellénalo
npm install
NITRO_PRESET=node-server npm run build
node --env-file=.env .output/server/index.mjs
```
Expón `http://localhost:3000` con otro Public hostname del túnel (ej. `venzx.tudominio.com`).

Para mantenerlo encendido (pm2):
```bash
npm i -g pm2
pm2 start .output/server/index.mjs --name venzx --node-args="--env-file=.env"
pm2 save && pm2 startup
```

## 5. Privacidad (anti-persecución)
- La app no guarda IPs. Cloudflare sí ve las IPs: revisa Zero Trust → Logs y desactiva lo que no necesites.
- En Supabase Docker, baja la retención de logs (Analytics/Vector) o desactívalo.
- Haz copias de seguridad cifradas de la base de datos.
