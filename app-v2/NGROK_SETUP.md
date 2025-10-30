# NGROK SETUP NOTES

## Allow ngrok host in Vite dev server

✅ **Done:** Updated `app-v2/vite.config.ts` to allow external hosts via `server.allowedHosts: true`.

## API calls are backend-routed

✅ **Done:** All AI chat calls go through backend endpoints (chat.ts, knowledge.ts use `/api` routes), proxied to localhost:3001 in dev.

No client-side API keys exposed. Backend handles Gemini API key via environment variable.

## Strapi CORS (if needed later)

If using Strapi CMS on different port/domain, update `backend/config/middlewares.ts` to include the ngrok URL in CORS settings. Currently Strapi is not strictly needed for basic operation.

## Steps to share via ngrok

1. Start backend: `cd backend && npm run proxy`
2. Start frontend: `cd app-v2 && npm run dev`
3. Run ngrok: `ngrok http 5173`
4. Share the ngrok URL with users (e.g., https://zoie-nonshrinking-omar.ngrok-free.app)

Backend stays on localhost:3001; frontend proxies all `/api` calls to it automatically.

## Production considerations

- Remove or conditionally enable `allowedHosts: true` for production builds.
- Use environment variables to configure backend URL if deploying separately.
- Ensure Gemini API key is set on backend only, never exposed to clients.
