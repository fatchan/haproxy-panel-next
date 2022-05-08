FROM node:16

WORKDIR /opt
ENV NODE_ENV production

COPY package.json /opt/package.json

RUN npm install --production

COPY .env /opt/.env
COPY . /opt
COPY ./node_modules/@fatchan/haproxy-sdk/lib/_utils.js /opt/node_modules/@fatchan/haproxy-sdk/lib/_utils.js

RUN npm run build

CMD ["npm","start"]
