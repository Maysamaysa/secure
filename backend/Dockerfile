# Dockerfile for the JWT-auth backend (Express)

# base image with Node.js 20
FROM node:20

# create working directory
WORKDIR /usr/src/app

# copy manifest and install deps before adding source (cache friendly)
COPY package*.json ./

# install production dependencies only
RUN npm ci --only=production

# copy application files
COPY . .

EXPOSE 3000

# runtime environment
ENV NODE_ENV=production

# start the server
CMD ["npm","start"]