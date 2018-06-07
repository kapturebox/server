FROM node:alpine

COPY package.json /app/package.json

RUN cd /app && npm install -g gulp && yarn

COPY app /app

CMD node /app/app.js

HEALTHCHECK \
   --interval=30s \
   --timeout=5s \
   --start-period=5s \
   --retries=3 \
   CMD [ "curl localhost:9000/api/v1 -HI" ]
