FROM node:latest

WORKDIR /usr/src/clh-bash

COPY package.json .

RUN npm install

COPY . .

RUN npm run extract

EXPOSE 3000

CMD ["npm","start"]
