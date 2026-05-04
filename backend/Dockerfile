FROM node:20-alpine AS base
WORKDIR /app

ARG SERVICE=gateway

FROM base AS deps
COPY code/${SERVICE}/package*.json ./
RUN npm ci

FROM base AS runtime
ARG SERVICE
COPY --from=deps /app/node_modules ./node_modules
COPY code/${SERVICE}/ ./
EXPOSE 4000
CMD ["node", "index.js"]

