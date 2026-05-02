# Stage 1: Build
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Custom nginx config to handle SPA routing if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
# Cloud Run sets the PORT environment variable to 8080 by default
CMD ["nginx", "-g", "daemon off;"]
