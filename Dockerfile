FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY src ./src

FROM build AS test
COPY test ./test
COPY scripts ./scripts
USER node
CMD ["npm", "test"]

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q -O - "http://127.0.0.1:${PORT:-3000}/health" >/dev/null 2>&1 || exit 1
CMD ["node", "src/index.js"]
