import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.js';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CIFRA PAY API',
      version: '1.0.0',
      description: 'Documentación de la API de Cifra Pay',
    },
    servers: [
      {
        url: (`http://localhost:${env.PORT_SWAGGER}`) ,
        description: 'Servidor local de desarrollo',
      },
    ],
  },
  apis: ['./src/modules/admin/routes/*.js', './src/modules/client/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerUi, swaggerSpec };
