HVAC Asistent v2

This is a fresh Vite + React + TypeScript scaffold for the HVAC Asistent rewrite (MVP).

Quick start:

1. Install frontend: `cd app-v2 && npm install`
2. Install & start backend: `cd ../backend && npm install && npm run proxy`
3. Start frontend (in another terminal): `cd app-v2 && npm run dev`
4. Access at: http://localhost:5173

Notes:
- The scaffold is minimal. We'll port lesson content (Annex1) from the old `src` into `app-v2/src/content` as JSON/MDX.
- For production builds run `npm run build`.

Backend proxy for AI chat and external feeds
--------------------------------------------
This application requires the Node.js backend to provide:
- AI chat via Google Gemini (in `backend/proxy.js`)
- RSS feed aggregation and news endpoints
- Azure Cosmos DB vector search for regulatory documents

**Local development:**
1. Backend expects API keys in `.env`:
   - GOOGLE_GEMINI_API_KEY (free at https://aistudio.google.com/app/apikey)
   - Optional: Azure Cosmos DB credentials for vector search
2. Start backend: `cd backend && npm install && npm run proxy`
3. Backend runs on http://localhost:3001; frontend proxy forwards `/api` calls in dev

**Ngrok/public tunnels:**
- Vite dev server now allows external hosts (`allowedHosts: 'any'`) so ngrok URLs work.
- All AI API calls are server-side; no client keys exposed.
- Run ngrok: `ngrok http 5173`
- Access the frontend at the ngrok URL; backend remains on localhost:3001 (proxied).

Strapi (optional, for content management)
------------------------------------------
Strapi backend (under `backend/`) can optionally manage lesson content and quiz attempts. By default, the app runs with mock JSON data and localStorage. To enable Strapi:

1. Set `VITE_STRAPI_URL=http://localhost:1337` in `app-v2/.env`
2. Start Strapi: `cd backend && npm run dev`
3. Create admin user at http://localhost:1337/admin

Security note: Do NOT commit API keys or credentials to this repository.

Quick steps to create teacher/student accounts (Strapi Admin UI):

1. Open Strapi Admin: http://localhost:1337/admin and login with your admin account.
2. Go to Plugins -> Users & Permissions -> Roles. Configure public and authenticated roles as appropriate.
3. Create users via the Admin UI (Users) and set roles, or implement a separate user collection for teachers if you need richer profiles.

Note about credentials:
- If you created an admin account to get Strapi running, do not store that password in this repo. Use the Admin UI to manage users and roles.

E2E and CI
----------
This repo includes a Playwright E2E test scaffold and a GitHub Actions workflow (CI) that will run build, typecheck and E2E tests.

Locally you can run the E2E tests after installing dependencies and starting the dev server:

1. npm install --save-dev @playwright/test
2. npx playwright install
3. npm run dev (in one terminal)
4. npm run test:e2e (in a separate terminal)

Note: Playwright will run tests against http://localhost:5173 by default.
