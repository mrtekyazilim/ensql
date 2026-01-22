// Global type definitions for config modules

declare module '*/config.js' {
  interface Config {
    API_URL: string
    PARTNER_URL?: string
    CLIENT_URL?: string
    ADMIN_URL?: string
    environment: 'development' | 'production'
  }

  const config: Config
  export default config
}

declare module '*/config.dev.js' {
  interface Config {
    API_URL: string
    PARTNER_URL?: string
    CLIENT_URL?: string
    ADMIN_URL?: string
    environment: 'development' | 'production'
  }

  const config: Config
  export default config
}
