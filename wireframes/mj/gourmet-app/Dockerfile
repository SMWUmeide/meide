FROM node:24-bookworm-slim
WORKDIR /app
COPY . .
RUN node scripts/restore-city-database.mjs && rm -f data/europe-cities.sqlite.gz*
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000
EXPOSE 10000
CMD ["node", "server.mjs"]
