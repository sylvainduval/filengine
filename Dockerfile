FROM node:14
# WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN mkdir /usr/data
# Bundle app source
COPY . .
EXPOSE 3000
VOLUME /usr/data
CMD [ "node", "app.js" ]