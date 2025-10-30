This folder contains Strapi content-type schemas you can copy into a Strapi project (src/api/*) to create the Lesson/Quiz/Question/Option/QuizAttempt content types.

Usage:
1. Create a new Strapi project (locally or on server):
   npx create-strapi-app@latest backend --quickstart
2. Stop the Strapi server and copy the folders from this `backend-strapi` into your Strapi project's `src/api` directory.
3. Start Strapi and open Admin UI at http://localhost:1337/admin to verify the content types are available.

Security note: Do NOT commit admin passwords or secrets into the repo. Create the admin user in the Strapi admin UI or via CLI. For production, switch SQLite to PostgreSQL in config/database.js and set environment variables.

Recommended quick admin creation:
- Run Strapi and open http://localhost:1337/admin to create the initial admin user (pick a secure password).
