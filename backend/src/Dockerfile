FROM node:20-alpine AS builder

WORKDIR /build

RUN apk add --no-cache python3 make g++

COPY package.json ./

RUN npm ci --omit=dev || npm install --omit=dev

FROM node:20-alpine AS runner 

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /build/node_modules ./node_modules

COPY --chown=node:node . .

RUN mkdir -p /usr/src/app/logs && chown -R node:node /usr/src/app

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-5000}/health || exit 1

CMD ["node", "server.js"]