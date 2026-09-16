// In dev (`pnpm run dev`) blijft dit leeg: vite.config.ts's proxy vangt /hubs, /games en
// /maps dan al af op relatieve paden naar de lokale API. In productie (Vercel) wijst dit
// naar de Azure App Service-origin (docs/azure-hosting-deployment.md).
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
