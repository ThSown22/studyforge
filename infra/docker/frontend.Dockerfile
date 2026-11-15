# syntax=docker/dockerfile:1.7
FROM node:22.23.4-bookworm-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts
COPY frontend ./frontend
COPY packages/contracts ./packages/contracts
RUN npm run build --workspace=@studyforge/frontend

FROM node:22.23.4-bookworm-slim
WORKDIR /app
ENV FE_HOST=0.0.0.0 FE_PORT=3000 API_PROXY_TARGET=http://backend:3001 PUBLIC_API_BASE_URL=
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
COPY frontend/config.mjs frontend/server.mjs ./frontend/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+process.env.FE_PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "frontend/server.mjs"]
