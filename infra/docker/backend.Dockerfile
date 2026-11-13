# syntax=docker/dockerfile:1.7
FROM node:22.23.4-bookworm-slim AS backend-dependencies
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts

FROM node:22.23.4-bookworm-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY backend/package.json backend/package-lock.json ./backend/
RUN --mount=type=cache,target=/root/.npm npm ci --prefix backend --ignore-scripts
COPY scripts/build.mjs scripts/paths.mjs scripts/frontend-config.mjs ./scripts/
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY packages ./packages
COPY tests ./tests
RUN node node_modules/typescript/lib/tsc.js --project backend/tsconfig.json
RUN node scripts/build.mjs --backend-only

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 API_PORT=3001 FRONTEND_DIR=/app/empty-public
COPY backend/package.json ./package.json
COPY --from=backend-dependencies /app/node_modules ./node_modules
COPY --from=backend-build /app/dist/backend ./dist/backend
COPY --from=backend-build /app/dist/packages ./dist/packages
COPY database/migrations/postgres ./database/migrations/postgres
COPY scripts/migrate-postgres.mjs scripts/smoke-v2.mjs ./scripts/
RUN mkdir /app/empty-public && chown -R node:node /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:'+process.env.API_PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/backend/src/main.js"]
