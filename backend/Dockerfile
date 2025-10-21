# Imagen base
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

# Usa modo desarrollo
CMD ["npm", "run", "dev"]
