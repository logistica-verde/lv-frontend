declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL?: string
    readonly VITE_TILE_URL?: string
    readonly VITE_GEOCODER_URL?: string
  }
}

export {}
