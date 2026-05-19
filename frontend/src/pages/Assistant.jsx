import { useSearchParams } from 'react-router-dom'
import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiDeleteBin6Line, RiDownload2Line, RiVolumeDownLine, RiVolumeUpLine } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'
import { useSpeech } from '../hooks/useSpeech'
import { sendTextQuery, sendVoiceQuery, clearHistory } from '../api/client'
import MicButton from '../components/MicButton'
import PlayPauseButton from '../components/PlayPauseButton'
import ChatPanel from '../components/ChatPanel'
import Waveform from '../components/Waveform'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { messages, addMessage, clearMessages, isRecording, isLoading, setLoading, addToast, volume, setVolume } = useAppStore()
  const { start, stop, liveText } = useSpeech()
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const lastRequestIdRef = useRef(0)
  const micLockRef = useRef(false)

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, liveText])

  // Stop audio on unmount
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (e) {}
      audioRef.current = null
      setCurrentAudio(null)
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [stopAudio])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      const lastAudio = [...messages].reverse().find((m) => m.audio_url)
      if (lastAudio?.audio_url) {
        const audio = new Audio(lastAudio.audio_url)
        audio.volume = volume
        audioRef.current = audio
        setCurrentAudio(audio)
        audio.onplay = () => setIsPlaying(true)
        audio.onpause = () => setIsPlaying(false)
        audio.onended = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
        audio.onerror = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
        audio.play().catch(() => {})
      }
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }, [isPlaying, messages, volume])

  const processText = useCallback(async (text) => {
    stopAudio()
    const requestId = ++lastRequestIdRef.current
    addMessage({ id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() })
    setLoading(true)
    try {
      const { data } = await sendTextQuery(text)
      if (requestId !== lastRequestIdRef.current) return

      addMessage({ id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString(), audio_url: data.audio_url })
      
      stopAudio() // double-check to avoid overlaps
      const audio = new Audio(data.audio_url)
      audio.volume = volume
      audioRef.current = audio
      setCurrentAudio(audio)
      audio.onplay = () => setIsPlaying(true)
      audio.onpause = () => setIsPlaying(false)
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
      audio.play().catch(() => {})
      if (data.moderated) addToast({ type: 'error', message: 'Query was flagged by moderation.' })
    } catch (err) {
      if (requestId !== lastRequestIdRef.current) return
      addToast({ type: 'error', message: err.response?.data?.detail || 'Something went wrong. Is the backend running?' })
    } finally {
      if (requestId === lastRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [addMessage, addToast, setLoading, stopAudio, volume])

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      processText(query)
      // Clear the query from the URL without reloading
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, processText])

  const handleResult = useCallback(async (result) => {
    if (!result) return
    if (result.type === 'text') {
      if (!result.value?.trim()) {
        addToast({ type: 'error', message: 'No speech detected. Please try again.' })
        return
      }
      await processText(result.value)
    } else if (result.type === 'blob') {
      if (!result.value) {
        addToast({ type: 'error', message: 'No audio recorded. Please try again.' })
        return
      }
      stopAudio()
      const requestId = ++lastRequestIdRef.current
      setLoading(true)
      try {
        const { data } = await sendVoiceQuery(result.value)
        if (requestId !== lastRequestIdRef.current) return

        addMessage({ id: uid(), role: 'user', content: data.transcript, timestamp: new Date().toISOString() })
        addMessage({ id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString(), audio_url: data.audio_url })
        
        stopAudio() // double-check to avoid overlaps
        const audio = new Audio(data.audio_url)
        audio.volume = volume
        audioRef.current = audio
        setCurrentAudio(audio)
        audio.onplay = () => setIsPlaying(true)
        audio.onpause = () => setIsPlaying(false)
        audio.onended = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
        audio.onerror = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
        audio.play().catch(() => {})
        if (data.moderated) addToast({ type: 'error', message: 'Query was flagged by moderation.' })
      } catch (err) {
        if (requestId !== lastRequestIdRef.current) return
        addToast({ type: 'error', message: err.response?.data?.detail || 'Something went wrong.' })
      } finally {
        if (requestId === lastRequestIdRef.current) {
          setLoading(false)
        }
      }
    }
  }, [processText, stopAudio, addMessage, addToast, setLoading, volume])

  const handleMicClick = useCallback(async () => {
    if (isLoading || micLockRef.current) return
    if (!isRecording) {
      micLockRef.current = true
      stopAudio()
      try {
        await start(async () => {
          if (micLockRef.current) return
          micLockRef.current = true
          try {
            const result = await stop()
            await handleResult(result)
          } finally {
            micLockRef.current = false
          }
        })
      } catch (e) {
      } finally {
        micLockRef.current = false
      }
    } else {
      micLockRef.current = true
      try {
        const result = await stop()
        await handleResult(result)
      } finally {
        micLockRef.current = false
      }
    }
  }, [isRecording, isLoading, start, stop, handleResult, stopAudio])

  const handleClear = async () => {
    stopAudio()
    clearMessages()
    try { await clearHistory() } catch {}
    addToast({ type: 'info', message: 'Conversation cleared.' })
  }

  const handleDownload = () => {
    if (!messages.length) return
    const text = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voicevora-transcript-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', message: 'Transcript downloaded!' })
  }

  const lastAudioUrl = [...messages].reverse().find((m) => m.audio_url)?.audio_url

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto flex flex-col gap-4"
      style={{ height: 'calc(100dvh - 120px)' }}
    >
      {/* Chat area */}
      <div className="glass flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
        <ChatPanel isLoading={isLoading} liveText={liveText} />
        <div ref={chatEndRef} />
      </div>

      {/* Waveform */}
      <div className="glass px-4 py-3 min-h-[64px] flex items-center justify-center">
        {isRecording || lastAudioUrl
          ? <Waveform audioUrl={isLoading ? null : lastAudioUrl} isPlaying={isPlaying} mediaElement={currentAudio} />
          : <p className="text-gray-600 text-sm">Waveform will appear after your first response</p>
        }
      </div>

      {/* Controls */}
      <div className="glass p-3 md:p-5">
        {/* Row 1: Clear/Download */}
        <div className="flex items-center justify-end gap-2 mb-3">
          <div className="flex gap-1">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleClear} disabled={messages.length === 0}
              className="btn-ghost flex items-center gap-1 text-xs px-2 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RiDeleteBin6Line />
              <span className="hidden sm:inline">Clear</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownload} disabled={messages.length === 0}
              className="btn-ghost flex items-center gap-1 text-xs px-2 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RiDownload2Line />
              <span className="hidden sm:inline">Download</span>
            </motion.button>
          </div>
        </div>

        {/* Row 2: Volume + Mic + Play */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <RiVolumeDownLine className="text-gray-400 text-sm shrink-0" />
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setVolume(v)
                if (audioRef.current) audioRef.current.volume = v
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <RiVolumeUpLine className="text-gray-400 text-sm shrink-0" />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <MicButton onClick={handleMicClick} />
            <PlayPauseButton
              isPlaying={isPlaying}
              onClick={togglePlayPause}
              disabled={isLoading || (!audioRef.current && !lastAudioUrl)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
