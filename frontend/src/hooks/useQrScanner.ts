import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

/** Waarom de camera niet loopt: geen toestemming, of geen (bruikbare) camera. */
export type QrScannerError = 'denied' | 'unavailable'

/**
 * Of dit toestel überhaupt een camera kan openen. Browsers geven `getUserMedia` alleen in een
 * beveiligde context (HTTPS of localhost) — over kaal `http://` op het lokale netwerk ontbreekt 'ie.
 */
export function canScanQr(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
}

/**
 * Opent de achtercamera in de teruggegeven `videoRef` en leest elk frame op een QR-code. Elke
 * gevonden tekst gaat naar `onDecoded`; geeft die `true` terug, dan stopt het scannen. De camera
 * gaat uit zodra het component unmount.
 */
export function useQrScanner(onDecoded: (text: string) => boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDecodedRef = useRef(onDecoded)
  const [error, setError] = useState<QrScannerError | null>(null)

  useEffect(() => {
    onDecodedRef.current = onDecoded
  })

  useEffect(() => {
    let stream: MediaStream | null = null
    let frame = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    const scan = () => {
      const video = videoRef.current

      if (stopped || !video || !context) return

      if (video.readyState >= video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })

        if (code?.data && onDecodedRef.current(code.data)) return
      }

      frame = requestAnimationFrame(scan)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (mediaStream) => {
        stream = mediaStream

        if (stopped || !videoRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop())

          return
        }

        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        frame = requestAnimationFrame(scan)
      })
      .catch((cameraError: unknown) => {
        if (stopped) return

        const denied = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
        setError(denied ? 'denied' : 'unavailable')
      })

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { videoRef, error }
}
