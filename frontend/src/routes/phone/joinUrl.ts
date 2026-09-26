const JOIN_PATH = /^\/play\/([^/]+)\/?$/

/** De spelcode uit de join-URL die `LobbyQrPanel` in de QR zet; `null` voor elke andere QR. */
export function gameIdFromJoinUrl(text: string): string | null {
  try {
    const match = JOIN_PATH.exec(new URL(text).pathname)

    return match ? decodeURIComponent(match[1]).toUpperCase() : null
  } catch {
    return null
  }
}
