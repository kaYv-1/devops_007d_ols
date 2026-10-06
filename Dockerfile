FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY src ./src
COPY test ./test
COPY scripts ./scripts

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD sh -c "wget -qO- http://127.0.0.1:${PORT:-3000}/health >/dev/null 2>&1 || exit 1"
CMD ["node", "src/index.js"]
