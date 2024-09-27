# syntax=docker/dockerfile:1
FROM --platform=linux/amd64 node:16.19.1-alpine3.17 as build

WORKDIR /app
RUN apk --no-cache add python3 make g++ git
COPY package.json yarn.lock ./
RUN ["yarn", "install", "--frozen-lockfile"]

COPY . .
RUN ["yarn", "db-client-gen"]
RUN ["yarn", "build"]

# Prune dev dependencies
RUN ["yarn", "install", "--production"]

FROM --platform=linux/amd64 node:16.19-alpine3.17

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

RUN apk add --no-cache postgresql-client

WORKDIR /app
COPY --chown=node:node package.json .
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build


ENV NODE_ENV=production

USER node

CMD ["yarn", "start"]
