import { env } from '@/config/env'

export function apiUrl(path: string): string {
  return `${env.apiUrl}${path}`
}
