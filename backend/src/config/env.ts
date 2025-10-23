import dotenv from 'dotenv'

dotenv.config()

export const env = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    PORT: process.env.PORT || '3000',
    PORT_SWAGGER: process.env.PORT_SWAGGER || '3000',
    JWT_SECRET: process.env.JWT_SECRET || '',
}
