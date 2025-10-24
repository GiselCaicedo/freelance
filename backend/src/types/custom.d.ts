declare module 'xss-clean' {
  import type { RequestHandler } from 'express'

  const xss: () => RequestHandler
  export default xss
}

declare module 'hpp' {
  import type { RequestHandler } from 'express'

  const hpp: () => RequestHandler
  export default hpp
}

declare module 'cors' {
  import type { RequestHandler } from 'express'

  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void)
    methods?: string | string[]
    allowedHeaders?: string | string[]
    exposedHeaders?: string | string[]
    credentials?: boolean
    maxAge?: number
    preflightContinue?: boolean
    optionsSuccessStatus?: number
  }

  type Cors = (options?: CorsOptions) => RequestHandler

  const cors: Cors
  export default cors
}

declare module 'cookie-parser' {
  import type { RequestHandler } from 'express'

  function cookieParser(secret?: string, options?: { decode?(val: string): string }): RequestHandler
  export default cookieParser
}

declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi: string
    info: Record<string, unknown>
    servers?: Array<Record<string, unknown>>
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition
    apis: string[]
  }

  function swaggerJsdoc(options: SwaggerOptions): Record<string, unknown>
  export default swaggerJsdoc
}

declare module 'swagger-ui-express' {
  import type { RequestHandler } from 'express'

  interface SwaggerUi {
    serve: RequestHandler[]
    setup: (document: unknown, customOptions?: Record<string, unknown>, options?: Record<string, unknown>, customCss?: string) => RequestHandler
  }

  const swaggerUi: SwaggerUi
  export default swaggerUi
}

declare module 'sanitize-html' {
  interface SanitizeOptions {
    allowedTags?: string[]
    allowedAttributes?: Record<string, string[]>
  }

  function sanitizeHtml(value: string, options?: SanitizeOptions): string
  export default sanitizeHtml
}
