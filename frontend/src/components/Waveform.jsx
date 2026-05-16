import { useEffect, useRef, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import WaveSurfer from 'wavesurfer.js'

export default function Waveform({ audioUrl, isPlaying, mediaElement }) {
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const { isRecording } = useAppStore()

  const barHeights = useMemo(
    () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 28) + 8),
    []
  )

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return
    
    wsRef.current?.destroy()
    wsRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(0,212,255,0.3)',
      progressColor: 'rgba(168,85,247,0.8)',
      cursorColor: 'rgba(168,85,247,0.5)',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 4,
      height: 48,
      normalize: true,
      interact: false,
      media: mediaElement, // Sync with the actual audio element
    })

    const fullUrl = audioUrl.startsWith('http') ? audioUrl : `${window.location.origin}${audioUrl}`
    wsRef.current.load(fullUrl)
    
    wsRef.current.on('error', (e) => console.warn('WaveSurfer:', e))

    return () => { 
      wsRef.current?.destroy()
      wsRef.current = null 
    }
  }, [audioUrl, mediaElement])

  if (isRecording) {
    return (
      <div className="flex items-center justify-center gap-[3px] h-12 w-full">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-[3px] bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
            style={{ height: `${h}px`, animation: `pulse ${0.4 + (i % 6) * 0.08}s ease-in-out infinite alternate` }}
          />
        ))}
      </div>
    )
  }

  return <div ref={containerRef} className="w-full min-w-[200px]" />
}
