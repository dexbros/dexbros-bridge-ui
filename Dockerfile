# syntax=docker/dockerfile:1.6  <-- enables RUN --mount=type=ssh

################## 1 : Build React app ##################
FROM node:20 AS build

WORKDIR /app

# Copy lock-files first (better cache)
COPY package.json yarn.lock ./

# Install deps; needs the SSH key forwarded from the runner
RUN --mount=type=ssh \
    mkdir -p ~/.ssh && \
    ssh-keyscan github.com >> ~/.ssh/known_hosts && \
    yarn install --frozen-lockfile

# Pass build-time env vars if CRA / Vite needs them
COPY .env.development .env

# Copy the rest of the source tree
COPY . .

# More memory for large React builds
ENV NODE_OPTIONS=--max-old-space-size=8192

RUN yarn build

################## 2 : Serve with Nginx ##################
FROM nginx:alpine

# Wipe default html and add our build
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]