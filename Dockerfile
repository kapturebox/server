FROM node

WORKDIR /app
COPY package.json /app

RUN npm install -g gulp && yarn

COPY app /app

CMD ['node', 'app/app.js']
