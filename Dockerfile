# syntax=docker/dockerfile:1
#
# The OpsDesk frontend as an image, in two stages:
#   build: Node, the dependencies and the source -> the static files in dist/
#   serve: nginx and those files, nothing else (no Node, no source, no node_modules)
#
#   docker build --build-arg VITE_API_URL=http://localhost:8080/api/v1 -t opsdesk-frontend .
#   docker run -p 3000:80 opsdesk-frontend
#
# VITE_API_URL IS BAKED IN AT BUILD TIME. Vite writes its value into the
# JavaScript when `npm run build` runs, inside this image build. The running
# container has no idea it was ever a variable: setting it on the container,
# or changing it in the compose file and restarting, changes nothing. To point
# the app at a different API, rebuild the image:
#   docker compose up --build        (not `docker compose restart`)

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# package.json and the lockfile first, on their own, then the install. Docker
# reuses a step's cached result while the files copied before it are
# unchanged, so a change to the source alone skips the install. `npm ci`
# installs exactly what the lockfile says, for Linux (the local node_modules,
# built for Windows, is kept out by .dockerignore).
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# Declared after the install, so a new URL reuses the cached install. A build
# argument is visible to the RUN steps below as an environment variable,
# which is where Vite reads it from. It is also recorded in the image's
# history, which is fine only because every VITE_ value is public anyway
# (README, "Environment variables"): never pass a secret this way.
#
# No default, on purpose: without --build-arg VITE_API_URL=..., the build
# fails at `npm run build` (vite.config.ts refuses it) instead of producing an
# image whose every request goes to its own origin and gets a 404.
ARG VITE_API_URL
RUN npm run build

# ---- serve ----------------------------------------------------------------
FROM nginx:1.30-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
