import { useSearchParams } from 'react-router-dom'
import { useRef, useEffect, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { RiDeleteBin6Line, RiDownload2Line, RiVolumeDownLine, RiVolumeUpLine, RiSendPlane2Line, RiPlayFill, RiPauseFill } from 'react-icons/ri'
import { useAppStore } from '../store/useAppStore'
import { useSpeech } from '../hooks/useSpeech'
import { sendTextQuery, sendVoiceQuery, clearHistory } from '../api/client'
import MicButton from '../components/MicButton'
import ChatPanel from '../components/ChatPanel'
import AvatarPlayer from '../components/AvatarPlayer'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { messages, addMessage, clearMessages, isRecording, isLoading, setLoading, addToast, volume, setVolume } = useAppStore()
  const { start, stop, liveText } = useSpeech()

  const chatEndRef        = useRef(null)
  const audioRef          = useRef(null)
  const lastRequestIdRef  = useRef(0)
  const micLockRef        = useRef(false)

  const [isPlaying,      setIsPlaying]      = useState(false)
  const [textInput,      setTextInput]      = useState('')

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, liveText])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.currentTime = 0 } catch {}
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => () => stopAudio(), [stopAudio])

  const playAudioAndAvatar = useCallback(async (audioUrl, requestId, videoUrl = null) => {
    stopAudio()

    const playMediaElement = () => {
      const media = videoUrl ? document.createElement('video') : new Audio()
      media.src = videoUrl || audioUrl
      media.volume = volume
      media.crossOrigin = 'anonymous'
      audioRef.current = media
      media.onplay   = () => setIsPlaying(true)
      media.onpause  = () => setIsPlaying(false)
      media.onended  = () => { setIsPlaying(false); audioRef.current = null }
      media.onerror  = () => { setIsPlaying(false); audioRef.current = null }
      media.play().catch(() => {})
    }

    if (requestId === lastRequestIdRef.current) playMediaElement()
  }, [stopAudio, volume])

  const processText = useCallback(async (text) => {
    if (!text?.trim()) return
    stopAudio()
    clearMessages()
    const requestId = ++lastRequestIdRef.current
    addMessage({ id: uid(), role: 'user', content: text, timestamp: new Date().toISOString() })
    setLoading(true)
    try {
      const { data } = await sendTextQuery(text)
      if (requestId !== lastRequestIdRef.current) return
      
      // Display text response instantly & unblock UI
      addMessage({ id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString(), audio_url: data.audio_url, video_url: data.video_url })
      if (requestId === lastRequestIdRef.current) setLoading(false)
      
      await playAudioAndAvatar(data.audio_url, requestId, data.video_url)
      if (data.moderated) addToast({ type: 'error', message: 'Query was flagged by moderation.' })
    } catch (err) {
      if (requestId !== lastRequestIdRef.current) return
      addToast({ type: 'error', message: err.response?.data?.detail || 'Something went wrong. Is the backend running?' })
      if (requestId === lastRequestIdRef.current) setLoading(false)
    }
  }, [addMessage, addToast, setLoading, stopAudio, playAudioAndAvatar, clearMessages])

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) { processText(query); setSearchParams({}, { replace: true }) }
  }, [searchParams, setSearchParams, processText])

  const handleResult = useCallback(async (result) => {
    if (!result) return
    if (result.type === 'text') {
      if (!result.value?.trim()) { addToast({ type: 'error', message: 'No speech detected.' }); return }
      await processText(result.value)
    } else if (result.type === 'blob') {
      if (!result.value) { addToast({ type: 'error', message: 'No audio recorded.' }); return }
      stopAudio()
      clearMessages()
      const requestId = ++lastRequestIdRef.current
      setLoading(true)
      try {
        const { data } = await sendVoiceQuery(result.value)
        if (requestId !== lastRequestIdRef.current) return
        
        // Display transcript & text response instantly & unblock UI
        addMessage({ id: uid(), role: 'user', content: data.transcript, timestamp: new Date().toISOString() })
        addMessage({ id: uid(), role: 'assistant', content: data.response, timestamp: new Date().toISOString(), audio_url: data.audio_url, video_url: data.video_url })
        if (requestId === lastRequestIdRef.current) setLoading(false)
        
        await playAudioAndAvatar(data.audio_url, requestId, data.video_url)
        if (data.moderated) addToast({ type: 'error', message: 'Query was flagged by moderation.' })
      } catch (err) {
        if (requestId !== lastRequestIdRef.current) return
        addToast({ type: 'error', message: err.response?.data?.detail || 'Something went wrong.' })
        if (requestId === lastRequestIdRef.current) setLoading(false)
      }
    }
  }, [processText, stopAudio, addMessage, addToast, setLoading, playAudioAndAvatar, clearMessages])

  const handleMicClick = useCallback(async () => {
    if (isLoading || micLockRef.current) return
    if (!isRecording) {
      micLockRef.current = true; stopAudio()
      try {
        await start(async () => {
          if (micLockRef.current) return
          micLockRef.current = true
          try { const r = await stop(); await handleResult(r) }
          finally { micLockRef.current = false }
        })
      } catch {} finally { micLockRef.current = false }
    } else {
      micLockRef.current = true
      try { const r = await stop(); await handleResult(r) }
      finally { micLockRef.current = false }
    }
  }, [isRecording, isLoading, start, stop, handleResult, stopAudio])

  const handleTextSubmit = useCallback((e) => {
    e?.preventDefault()
    if (!textInput.trim() || isLoading) return
    const t = textInput.trim(); setTextInput(''); processText(t)
  }, [textInput, isLoading, processText])

  const handleClear = async () => {
    stopAudio(); clearMessages()
    try { await clearHistory() } catch {}
    addToast({ type: 'info', message: 'Conversation cleared.' })
  }

  const handleDownload = () => {
    if (!messages.length) return
    const text = messages.map((m) => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = `voicemitra-${Date.now()}.txt`; a.click()
    addToast({ type: 'success', message: 'Transcript downloaded!' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto flex flex-col gap-3"
      style={{ height: 'calc(100dvh - 110px)' }}>

      <div className="flex flex-col md:flex-row gap-3 flex-1 min-h-0">

        {/* Avatar panel */}
        <div className="glass flex flex-col items-center justify-between p-5 md:w-[280px] shrink-0 gap-4">
          <div className="flex-1 flex items-center justify-center relative w-full h-[204px]">
            <AvatarPlayer
              isLoading={isLoading}
              isPlaying={isPlaying}
              isRecording={isRecording}
              mediaElement={audioRef.current}
            />
          </div>

          <div className="w-full flex flex-col items-center gap-4 mt-2">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) audioRef.current.pause()
                  else audioRef.current.play()
                }
              }}
              disabled={!audioRef.current}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-white flex items-center justify-center shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
            >
              {isPlaying ? <RiPauseFill className="text-3xl" /> : <RiPlayFill className="text-3xl ml-1" />}
            </motion.button>

            <div className="w-full flex items-center gap-2">
              <RiVolumeDownLine className="text-gray-500 text-sm shrink-0" />
              <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v }}
                className="flex-1 accent-cyan-400 cursor-pointer h-1" />
              <RiVolumeUpLine className="text-gray-500 text-sm shrink-0" />
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleClear} disabled={messages.length === 0}
              className="flex-1 btn-ghost flex items-center justify-center gap-1 text-xs py-1.5 disabled:opacity-30">
              <RiDeleteBin6Line />Clear
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleDownload} disabled={messages.length === 0}
              className="flex-1 btn-ghost flex items-center justify-center gap-1 text-xs py-1.5 disabled:opacity-30">
              <RiDownload2Line />Save
            </motion.button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="glass flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            <ChatPanel isLoading={isLoading} liveText={liveText} />
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-white/10 p-3">
            <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                placeholder={isRecording ? '🎙️ Listening…' : 'Type a message or use the mic…'}
                disabled={isLoading || isRecording}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50" />
              <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                disabled={!textInput.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <RiSendPlane2Line className="text-lg" />
              </motion.button>
              <MicButton onClick={handleMicClick} />
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
