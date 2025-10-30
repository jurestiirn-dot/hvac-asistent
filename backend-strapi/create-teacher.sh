#!/usr/bin/env bash
# Script to create a teacher user via Strapi Admin API (example)
# WARNING: Replace ADMIN_EMAIL and ADMIN_PASSWORD with your admin credentials (do not commit them)
# Usage: ADMIN_EMAIL=you@domain.com ADMIN_PASS=yourpass TEACHER_EMAIL=teacher@domain.com TEACHER_PASS=pass ./create-teacher.sh

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASS" ] || [ -z "$TEACHER_EMAIL" ] || [ -z "$TEACHER_PASS" ]; then
  echo "Set ADMIN_EMAIL, ADMIN_PASS, TEACHER_EMAIL and TEACHER_PASS environment variables"
  exit 1
fi

STRAPI_URL=${STRAPI_URL:-http://localhost:1337}

# Login as admin (this endpoint is for admin panel login)
ADMIN_TOKEN=$(curl -s -X POST "$STRAPI_URL/admin/login" -H "Content-Type: application/json" -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}" | jq -r '.data.token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "Admin login failed"
  exit 1
fi

# Create user via admin API (Strapi internal user creation)
# This uses the users-permissions plugin to create a standard user and then assign role
# Create the user
curl -s -X POST "$STRAPI_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEACHER_EMAIL\", \"password\": \"$TEACHER_PASS\", \"username\": \"$TEACHER_EMAIL\"}" | jq '.'

echo "Created teacher user (check Admin UI)."
