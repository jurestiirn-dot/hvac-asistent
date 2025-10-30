HVAC Asistent v2

This is a fresh Vite + React + TypeScript scaffold for the HVAC Asistent rewrite (MVP).

Quick start:

1. cd app-v2
2. npm install
3. npm run dev

Notes:
- The scaffold is minimal. We'll port lesson content (Annex1) from the old `src` into `app-v2/src/content` as JSON/MDX.
- For production builds run `npm run build`.

Strapi integration (optional)
-----------------------------
This frontend supports a Strapi backend. To connect:

1. Provision Strapi (local quickstart):
	npx create-strapi-app@latest backend --quickstart
2. Copy the files in `backend-strapi/src/api` into your Strapi project's `src/api` to create the Lesson/Quiz/Question/QuizAttempt content types, or inspect `backend-strapi` for schema files.
3. Start Strapi and create an admin user via http://localhost:1337/admin.
4. Set environment variable in `app-v2/.env` (create it):
	VITE_STRAPI_URL=http://localhost:1337

5. Restart the frontend (`npm run dev`). The app will use the Strapi API for lessons and quiz attempts. If `VITE_STRAPI_URL` is not set, the frontend runs with mock data and stores attempts in localStorage.

Security note: Do NOT commit admin passwords or secrets into this repository. Create the Strapi admin user in the admin UI and keep credentials private.

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
