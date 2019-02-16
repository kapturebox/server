FROM node:alpine

WORKDIR /app

RUN apk update \
  && apk add curl \
  # needed for youtube-dl
  && apk add python \
  && npm install -g gulp

COPY package.json package-lock.json /app/
RUN npm install

COPY . /app/

CMD npm start

HEALTHCHECK \
   --start-period=5s \
   --interval=30s \
   --timeout=5s \
   --retries=3 \
   CMD curl -Ifs localhost:9000/health
