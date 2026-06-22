FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN apk add --no-cache mosquitto-clients bash
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
