/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_ACCESS_TOKEN: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_SECRET: string
  readonly VITE_GOOGLE_SEARCH_ENGINE_ID: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_YOUTUBE_API_KEY: string
  readonly VITE_BRAVE_API_KEY: string
  readonly VITE_ELEVENLABS_API_KEY: string
  readonly VITE_SLACK_CLIENT_ID: string
  readonly VITE_ZOOM_CLIENT_ID: string
  readonly DEV: boolean
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Ensure this is treated as a module
export {}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_ACCESS_TOKEN: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_SECRET: string
  readonly VITE_ELEVENLABS_API_KEY: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
