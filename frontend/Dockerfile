FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine

USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh \
    && chown -R 101:0 /usr/share/nginx/html /etc/nginx/conf.d

USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
