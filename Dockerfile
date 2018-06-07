FROM node:alpine

RUN apk update \
  && apk add curl \
  && apk add python   # needed for youtube-dl

COPY package.json /app/package.json

RUN cd /app && npm install -g gulp && yarn

COPY app /app

CMD node /app/app.js

HEALTHCHECK \
   --interval=30s \
   --timeout=5s \
   --retries=3 \
   CMD curl -Ifs localhost:9000/health
