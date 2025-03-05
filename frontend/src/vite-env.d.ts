/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_API_URL: string
  readonly VITE_APP_ACCESS_TOKEN_EXPIRE_MINUTES: string
  readonly VITE_APP_ENABLE_DEBUG_MODE: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 