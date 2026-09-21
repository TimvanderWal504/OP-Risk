import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'
import { GameHubCtx } from './GameHubContext'
import { apiUrl } from '../config/apiConfig'

export function GameHubProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() =>
    // withCredentials: false — de SignalR-client stuurt anders standaard cookies mee
    // cross-origin (incl. Azure's eigen ARRAffinity-cookie), wat de CORS-preflight laat
    // stuklopen omdat de API bewust geen AllowCredentials() heeft (Program.cs): onze eigen
    // app-logica gebruikt toch geen cookies/Authorization-headers, sessietokens gaan als
    // expliciet hub-argument (RejoinGame).
    new HubConnectionBuilder()
      .withUrl(apiUrl('/hubs/game'), { withCredentials: false })
      .withAutomaticReconnect()
      .build(),
  )
  const [connectionState, setConnectionState] = useState(connection.state)
  // houdt start/stop gescheiden over StrictMode-remounts heen
  const chain = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    let disposed = false
    const sync = () => { if (!disposed) setConnectionState(connection.state) }

    connection.onreconnecting(sync)
    connection.onreconnected(sync)
    connection.onclose(sync)

    chain.current = chain.current.then(async () => {
      if (disposed || connection.state !== HubConnectionState.Disconnected) return
      for (let attempt = 0; !disposed; attempt++) {
        try {
          sync()                     // toont Connecting
          await connection.start()
          sync()
          return
        } catch (err) {
          console.error('[GameHub] start mislukt', err)
          sync()
          await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 30_000)))
        }
      }
    })

    return () => {
      disposed = true
      chain.current = chain.current.then(() => connection.stop()).catch(() => {})
    }
  }, [connection])

  return <GameHubCtx.Provider value={{ connection, connectionState }}>{children}</GameHubCtx.Provider>
}
