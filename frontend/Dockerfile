
# build stage
FROM node:20-alpine AS build
WORKDIR /app

# install deps early (cacheable)
COPY package.json package-lock.json ./
RUN npm ci --silent

# copy sources and build
COPY . .
RUN npm run build

# runtime stage: use a lightweight Node server to serve built files
FROM node:20-alpine AS runtime
WORKDIR /app

# install a static file server globally
RUN npm install -g serve

# copy built assets
COPY --from=build /app/dist ./dist

EXPOSE 5173

# serve the production build on port 5173 (same as dev port)
CMD ["serve", "-s", "dist", "-l", "5173"]