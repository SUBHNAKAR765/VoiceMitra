import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
const IDLE_PORTRAIT = '/avatar.png'

// Reads amplitude 0–1 from an AnalyserNode
function getAmplitude(analyser, dataArr) {
  analyser.getByteFrequencyData(dataArr)
  const sum = dataArr.reduce((a, b) => a + b, 0)
  return sum / (dataArr.length * 255)
}

export default function AvatarPlayer({
  isLoading, isPlaying, isRecording, mediaElement
}) {
  const animFrameRef    = useRef(null)
  const audioCtxRef     = useRef(null)
  const analyserRef     = useRef(null)
  const sourceNodeRef   = useRef(null)

  const [amplitude,  setAmplitude]    = useState(0)   // 0–1 real-time
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true)
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // ── Audio analyser for lip-sync / waveform glow ────────────────────────────
  const connectAnalyser = useCallback((el) => {
    if (!el || el._isAnalyserConnected) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (!analyserRef.current) {
        analyserRef.current = audioCtxRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.connect(audioCtxRef.current.destination)
      }
      try { sourceNodeRef.current?.disconnect() } catch {}
      
      sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(el)
      sourceNodeRef.current.connect(analyserRef.current)
      el._isAnalyserConnected = true
    } catch (e) {
      // Element may already be connected — ignore
    }
  }, [])

  useEffect(() => {
    if (mediaElement) {
      connectAnalyser(mediaElement)
    }
  }, [mediaElement, connectAnalyser])

  useEffect(() => {
    if (isPlaying && mediaElement) {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
      const data = new Uint8Array(analyserRef.current?.frequencyBinCount || 128)
      const tick = () => {
        if (!analyserRef.current) return
        const amp = getAmplitude(analyserRef.current, data)
        setAmplitude(amp)
        animFrameRef.current = requestAnimationFrame(tick)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(animFrameRef.current)
      setAmplitude(0)
    }
    return () => { cancelAnimationFrame(animFrameRef.current) }
  }, [isPlaying, mediaElement])

  const videoContainerRef = useRef(null)
  useEffect(() => {
    if (mediaElement && mediaElement.tagName === 'VIDEO' && videoContainerRef.current) {
      const container = videoContainerRef.current;
      container.innerHTML = '';
      container.appendChild(mediaElement);
      mediaElement.style.width = '100%';
      mediaElement.style.height = '100%';
      mediaElement.style.objectFit = 'cover';
    }
  }, [mediaElement])

  // ── State ─────────────────────────────────────────────────────────────────
  const state = isRecording ? 'listening'
    : isLoading             ? 'thinking'
    : isPlaying             ? 'speaking'
    : 'idle'

  const ring = {
    idle:      ['rgba(6,182,212,0.25)',  'rgba(6,182,212,0.55)'],
    listening: ['rgba(239,68,68,0.4)',   'rgba(239,68,68,0.8)'],
    thinking:  ['rgba(168,85,247,0.35)', 'rgba(168,85,247,0.75)'],
    speaking:  ['rgba(34,197,94,0.4)',   'rgba(34,197,94,0.8)'],
  }
  const badge = {
    idle:      'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    listening: 'bg-red-500/10 border-red-500/30 text-red-300',
    thinking:  'bg-purple-500/10 border-purple-500/30 text-purple-300',
    speaking:  'bg-green-500/10 border-green-500/30 text-green-300',
  }
  const label = { idle: 'Ready', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking' }

  // Amplitude-driven glow intensity
  const glowSize = state === 'speaking' ? 20 + amplitude * 60 : state === 'idle' ? 22 : 35

  return (
    <div className="flex flex-col items-center gap-5 select-none">

      {/* ── Outer glow + pulse rings ───────────────────────────────────── */}
      <div className="relative flex items-center justify-center">

        {/* Dynamic glow ring */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 224, height: 224 }}
          animate={{
            boxShadow: [
              `0 0 ${glowSize}px ${ring[state][0]}`,
              `0 0 ${glowSize * 2}px ${ring[state][1]}`,
              `0 0 ${glowSize}px ${ring[state][0]}`,
            ],
          }}
          transition={{ duration: state === 'speaking' ? 0.3 + (1 - amplitude) * 0.5 : state === 'idle' ? 3 : 1.2, repeat: Infinity }}
        />

        {/* Listening pulse rings */}
        <AnimatePresence>
          {state === 'listening' && [1, 2, 3].map((i) => (
            <motion.div key={i} className="absolute rounded-full border border-red-500/25 pointer-events-none"
              initial={{ width: 204, height: 204, opacity: 0.9 }}
              animate={{ width: 204 + i * 44, height: 204 + i * 44, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.45, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Speaking amplitude rings */}
        <AnimatePresence>
          {state === 'speaking' && amplitude > 0.1 && [1, 2].map((i) => (
            <motion.div key={i} className="absolute rounded-full border border-green-500/20 pointer-events-none"
              initial={{ width: 204, height: 204, opacity: 0.6 }}
              animate={{ width: 204 + amplitude * 60 + i * 20, height: 204 + amplitude * 60 + i * 20, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </AnimatePresence>

        {/* ── Avatar circle ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-full shadow-2xl"
          style={{
            width: 204, height: 204,
            border: `3px solid ${ring[state][0]}`,
            transition: 'border-color 0.5s ease',
          }}
        >
          {/* Video Avatar Canvas */}
          <div className="absolute inset-0 w-full h-full" style={{ filter: state === 'thinking' ? 'brightness(0.6)' : 'brightness(1)', transition: 'filter 0.4s' }}>
            {mediaElement && mediaElement.tagName === 'VIDEO' ? (
              <div ref={videoContainerRef} className="w-full h-full" />
            ) : (
              <img src={IDLE_PORTRAIT} alt="Avatar" className="w-full h-full object-cover object-top" />
            )}
          </div>

          {/* Thinking overlay */}
          <AnimatePresence>
            {state === 'thinking' && (
              <motion.div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'rgba(168,85,247,0.9)' }}
                      animate={{ y: [0, -10, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.18 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Listening mic indicator */}
          <AnimatePresence>
            {state === 'listening' && (
              <motion.div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-red-300"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
                  animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  REC
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Name + State badge ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-white/80 tracking-wide">VoiceMitra AI</p>
        <motion.div key={state} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm ${badge[state]}`}>
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: ring[state][1] }}
            animate={state !== 'idle' ? { scale: [1, 1.8, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.9, repeat: Infinity }} />
          {label[state]}
        </motion.div>
      </div>

      {/* ── Live amplitude visualizer bars (speaking only) ────────────────── */}
      <AnimatePresence>
        {state === 'speaking' && (
          <motion.div className="flex items-center justify-center gap-[3px] h-8 w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const phase = (i / 20) * Math.PI * 2
              const h = 4 + amplitude * 28 * (0.4 + 0.6 * Math.abs(Math.sin(phase + Date.now() / 200)))
              return (
                <motion.div key={i}
                  className="rounded-full"
                  style={{
                    width: 3,
                    background: `hsl(${160 + amplitude * 60},80%,60%)`,
                  }}
                  animate={{ height: Math.max(4, h) }}
                  transition={{ duration: 0.08, ease: 'linear' }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
