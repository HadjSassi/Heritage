FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY code/package*.json ./
RUN npm ci

FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY code/ ./
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

