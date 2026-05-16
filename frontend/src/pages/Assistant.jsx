import { useSearchParams } from 'react-router-dom'
import { useRef, useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiDeleteBin6Line, RiDownload2Line } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'
import { useSpeech } from '../hooks/useSpeech'
import { sendTextQuery, clearHistory } from '../api/client'
import MicButton from '../components/MicButton'
import PlayPauseButton from '../components/PlayPauseButton'
import ChatPanel from '../components/ChatPanel'
import Waveform from '../components/Waveform'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { messages, addMessage, clearMessages, isRecording, isLoading, setLoading, addToast } = useAppStore()
  const { start, stop, liveText } = useSpeech()
  const chatEndRef = useRef(null)
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, liveText])


  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) {
      const lastAudio = [...messages].reverse().find((m) => m.audio_url)
      if (lastAudio?.audio_url) {
        const audio = new Audio(lastAudio.audio_url)
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
  }, [isPlaying, messages])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setCurrentAudio(null)
    }
    setIsPlaying(false)
  }, [])

  const processText = useCallback(async (text) => {
    stopAudio()
    addMessage({ id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() })
    setLoading(true)
    try {
      const { data } = await sendTextQuery(text)
      addMessage({ id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString(), audio_url: data.audio_url })
      const audio = new Audio(data.audio_url)
      audioRef.current = audio
      setCurrentAudio(audio)
      audio.onplay = () => setIsPlaying(true)
      audio.onpause = () => setIsPlaying(false)
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; setCurrentAudio(null) }
      audio.play().catch(() => {})
      if (data.moderated) addToast({ type: 'error', message: 'Query was flagged by moderation.' })
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.detail || 'Something went wrong. Is the backend running?' })
    } finally {
      setLoading(false)
    }
  }, [addMessage, addToast, setLoading, stopAudio])

  const initialProcessed = useRef(false)

  useEffect(() => {
    const query = searchParams.get('q')
    if (query && !initialProcessed.current) {
      initialProcessed.current = true
      processText(query)
      // Clear the query from the URL without reloading
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, processText])

  const handleMicClick = useCallback(async () => {
    if (isLoading) return
    if (!isRecording) {
      try {
        await start(async () => {
          const finalTranscript = await stop()
          if (!finalTranscript?.trim()) {
            addToast({ type: 'error', message: 'No speech detected. Please try again.' })
            return
          }
          await processText(finalTranscript)
        })
      } catch (e) {}
    } else {
      const finalTranscript = await stop()
      if (!finalTranscript?.trim()) {
        addToast({ type: 'error', message: 'No speech detected. Please try again.' })
        return
      }
      await processText(finalTranscript)
    }
  }, [isRecording, isLoading, start, stop, processText, addToast])

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
      style={{ height: 'calc(100vh - 120px)' }}
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
      <div className="glass p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleClear} disabled={messages.length === 0}
              className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RiDeleteBin6Line />
              <span className="hidden sm:inline">Clear</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownload} disabled={messages.length === 0}
              className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RiDownload2Line />
              <span className="hidden sm:inline">Download</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-8">
            <MicButton onClick={handleMicClick} />
            <PlayPauseButton 
              isPlaying={isPlaying} 
              onClick={togglePlayPause} 
              disabled={isLoading || (!audioRef.current && !lastAudioUrl)} 
            />
          </div>

          <div className="w-28 text-right">
            <p className={`text-xs font-medium transition-colors ${
              isRecording ? 'text-red-400' : isLoading ? 'text-yellow-400' : isPlaying ? 'text-cyan-400' : 'text-gray-500'
            }`}>
              {isRecording ? '● Recording...' : isLoading ? '⟳ Processing...' : isPlaying ? '♫ Playing...' : ''}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
