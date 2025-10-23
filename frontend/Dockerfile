# Imagen base para desarrollo
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Ejecutar modo desarrollo de Next.js
CMD ["npm", "run", "dev"]
