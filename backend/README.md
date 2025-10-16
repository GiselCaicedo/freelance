# Instala dependencias 
npm install

# Instala Prisma 
npm install prisma --save-dev

# Inicializa Prisma (crea la carpeta prisma/ y el archivo schema.prisma)
npx prisma init

# Ajustar variables en el archivo .env
DATABASE_URL="xxxx"
PORT="xxxx"
PORT_SWAGGER="xxxx"
JWT_SECRET=jwt_secret_key 

# Genera el cliente Prisma 
npx prisma generate

# Ejecuta app
npm run dev
