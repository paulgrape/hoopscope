# Multi-stage build for the Hoopscope NestJS backend.
# Built from the repo root: docker build -f apps/backend/Dockerfile .

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
RUN npm ci --workspace apps/backend --include-workspace-root

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/backend apps/backend
RUN npm run build -w apps/backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY apps/backend/package.json ./package.json
USER app
EXPOSE 3000
CMD ["node", "dist/main"]
