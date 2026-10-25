# syntax=docker/dockerfile:1.7
FROM node:22.23.4-bookworm-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY scripts/build.mjs scripts/paths.mjs scripts/frontend-config.mjs ./scripts/
COPY frontend/index.html frontend/.env.example frontend/tsconfig.json ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY packages ./packages
RUN node node_modules/typescript/lib/tsc.js --project frontend/tsconfig.json
RUN cp frontend/.env.example frontend/.env && node scripts/build.mjs --frontend-only

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV FE_HOST=0.0.0.0 FE_PORT=3000 API_PROXY_TARGET=http://backend:3001 PUBLIC_API_BASE_URL=
COPY --from=frontend-build /app/dist/frontend ./dist/frontend
COPY scripts/paths.mjs scripts/frontend-config.mjs scripts/frontend-server.mjs ./scripts/
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+process.env.FE_PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/frontend-server.mjs"]
