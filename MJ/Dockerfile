FROM node:22-bookworm-slim
WORKDIR /app
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev --ignore-scripts --no-audit --no-fund
COPY server/*.mjs ./server/
COPY data/travel/manifest.json data/travel/countries.json data/travel/gazetteer-*.part* data/travel/NOTICE.md ./data/travel/
ENV TRAVEL_CACHE_DIR=/app/travel-cache
RUN node server/prepare-travel-cache.mjs && rm data/travel/gazetteer-*.part*
COPY dist/web ./dist/web
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 STORAGE_BACKEND=firestore
USER node
EXPOSE 8080
CMD ["node", "server/start.mjs"]
