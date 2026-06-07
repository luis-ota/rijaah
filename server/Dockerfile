FROM oven/bun:1-alpine

WORKDIR /app

COPY package*.json bun.lock* ./
RUN bun install --production

COPY . .

EXPOSE 3001

CMD ["bun", "index.js"]
