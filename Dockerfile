FROM node:alpine

RUN apk update \
  && apk add curl \
  && apk add python   # needed for youtube-dl

COPY package.json package-lock.json /app

RUN cd /app && npm install -g gulp && npm install

COPY app /app

CMD node /app/app.js

HEALTHCHECK \
   --interval=30s \
   --timeout=5s \
   --retries=3 \
   CMD curl -Ifs localhost:9000/health
