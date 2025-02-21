FROM node:latest

WORKDIR /usr/src/buscador_elastic

COPY . .

RUN npm install

EXPOSE 9201

CMD ["npm", "run", "dev"]