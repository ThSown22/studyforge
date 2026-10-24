# Legacy V1 SQLite image; PostgreSQL V2 is not configured yet.
FROM node:22.23.4-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/build.mjs scripts/paths.mjs scripts/frontend-config.mjs ./scripts/
COPY backend/src ./backend/src
COPY packages ./packages
RUN node scripts/build.mjs --backend-only

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 API_PORT=3001 SECURE_COOKIES=true DATABASE_PATH=/app/data/studyforge.sqlite FRONTEND_DIR=/app/empty-public
COPY --from=build /app/dist/backend ./dist/backend
COPY --from=build /app/dist/packages ./dist/packages
COPY database/migrations ./database/migrations
COPY package.json ./
RUN mkdir /app/data /app/empty-public && chown -R node:node /app/data
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+process.env.API_PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/backend/src/main.js"]
