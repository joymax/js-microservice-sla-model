FROM node:11-alpine
WORKDIR .
COPY package.json /app
RUN npm install
COPY . /app
CMD node index.js
EXPOSE 8081
