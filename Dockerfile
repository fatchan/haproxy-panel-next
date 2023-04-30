FROM node:latest

WORKDIR /opt
ENV NODE_ENV production

COPY package.json /opt/package.json

RUN npm install --omit=dev

COPY .env /opt/.env
COPY . /opt

RUN npm run build
RUN npx next telemetry disable
