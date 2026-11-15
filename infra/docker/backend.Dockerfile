# syntax=docker/dockerfile:1.7
FROM node:22.23.4-bookworm-slim AS quality
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY frontend ./frontend
COPY backend ./backend
COPY packages ./packages
COPY scripts ./scripts
COPY tests ./tests
CMD ["npm", "run", "check"]

FROM node:22.23.4-bookworm-slim AS backend-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts --workspace=@studyforge/backend --include-workspace-root=false

FROM node:22.23.4-bookworm-slim AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY backend ./backend
COPY packages/contracts ./packages/contracts
RUN npm run build --workspace=@studyforge/backend

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 API_PORT=3001 FRONTEND_DIR=/app/empty-public
COPY backend/package.json ./package.json
COPY --from=backend-dependencies /app/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY database/migrations/postgres ./database/migrations/postgres
COPY scripts/migrate-postgres.mjs ./scripts/
COPY tests/smoke/compose-smoke.mjs ./tests/smoke/
RUN mkdir /app/empty-public && chown -R node:node /app
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:'+process.env.API_PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
