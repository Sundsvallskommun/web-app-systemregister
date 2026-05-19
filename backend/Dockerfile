# Install dependencies
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# Build
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build || (echo "Build failed" && exit 1)

# Runtime
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Pre-create /app/data with nodejs ownership so the named volume from compose
# (data:/app/data) inherits it. Utan detta får mounten root-ägd och loggern
# kraschar med EACCES när den försöker mkdir under /app/data/logs.
RUN mkdir -p /app/data/logs && chown -R nodejs:nodejs /app/data

USER nodejs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "./dist/server.js"]
