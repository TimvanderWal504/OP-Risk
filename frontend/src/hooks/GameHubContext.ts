import { createContext } from 'react'
import type { HubConnection, HubConnectionState } from '@microsoft/signalr'

export type GameHubContext = { connection: HubConnection; connectionState: HubConnectionState }

export const GameHubCtx = createContext<GameHubContext | null>(null)
