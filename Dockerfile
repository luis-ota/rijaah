# Build stage
FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY package*.json bun.lock* ./
RUN bun install

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN bun run build

# Runtime stage
FROM nginx:alpine

ENV BACKEND_URL=http://backend:3001

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
