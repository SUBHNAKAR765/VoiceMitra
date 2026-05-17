import { useRef, useCallback, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const SILENCE_THRESHOLD = 10
const SILENCE_DURATION = 2000

// True if the browser supports Web Speech API (desktop Chrome / Edge)
const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

export function useSpeech() {
  const recognition = useRef(null)
  const { setRecording, addToast } = useAppStore()
  const [liveText, setLiveText] = useState('')
  const liveTextRef = useRef('')

  // Silence detection
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef = useRef(null)

  // MediaRecorder fallback (mobile)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const _startSilenceDetection = useCallback((stream, onSilence) => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    analyserRef.current = audioCtxRef.current.createAnalyser()
    analyserRef.current.fftSize = 512
    const source = audioCtxRef.current.createMediaStreamSource(stream)
    source.connect(analyserRef.current)
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)

    const check = () => {
      analyserRef.current?.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      if (avg < SILENCE_THRESHOLD) {
        if (!silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(onSilence, SILENCE_DURATION)
      } else {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      animFrameRef.current = requestAnimationFrame(check)
    }
    animFrameRef.current = requestAnimationFrame(check)
  }, [])

  const _stopSilenceDetection = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
    animFrameRef.current = null
    try { audioCtxRef.current?.close() } catch {}
    audioCtxRef.current = null
    analyserRef.current = null
  }, [])

  // ── Web Speech API path (desktop Chrome) ──────────────────────────────────
  const _startWebSpeech = useCallback((stream, onAutoStop) => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      try { recognition.current = new SpeechRecognition() } catch (e) { return reject(e) }

      recognition.current.continuous = true
      recognition.current.interimResults = true
      recognition.current.lang = 'en-US'

      let finalTranscript = ''

      recognition.current.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) finalTranscript += t + ' '
          else interim += t
        }
        const text = (finalTranscript + interim).trim()
        setLiveText(text)
        liveTextRef.current = text
      }

      recognition.current.onerror = (event) => {
        if (event.error === 'not-allowed')
          addToast({ type: 'error', message: 'Microphone access denied.' })
        _stopSilenceDetection()
        setRecording(false)
        setLiveText('')
        reject(event.error)
      }

      recognition.current.onstart = () => {
        setRecording(true)
        setLiveText('')
        liveTextRef.current = ''
        finalTranscript = ''
        _startSilenceDetection(stream, () => onAutoStop?.())
        resolve()
      }

      recognition.current.onend = () => setRecording(false)

      try { recognition.current.start() } catch (e) { reject(e) }
    })
  }, [setRecording, addToast, _startSilenceDetection, _stopSilenceDetection])

  const _stopWebSpeech = useCallback(() => {
    return new Promise((resolve) => {
      _stopSilenceDetection()
      streamRef.current?.getTracks().forEach((t) => t.stop())

      const rec = recognition.current
      if (!rec) {
        const text = liveTextRef.current
        setLiveText(''); liveTextRef.current = ''; setRecording(false)
        return resolve({ type: 'text', value: text })
      }

      rec.onend = () => {
        const text = liveTextRef.current
        setLiveText(''); liveTextRef.current = ''; setRecording(false)
        resolve({ type: 'text', value: text })
      }
      try { rec.stop() } catch {
        const text = liveTextRef.current
        setLiveText(''); liveTextRef.current = ''; setRecording(false)
        resolve({ type: 'text', value: text })
      }
    })
  }, [setRecording, _stopSilenceDetection])

  // ── MediaRecorder path (mobile / Safari) ──────────────────────────────────
  const _startMediaRecorder = useCallback((stream, onAutoStop) => {
    return new Promise((resolve, reject) => {
      chunksRef.current = []

      // Pick a supported MIME type
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg']
        .find((m) => MediaRecorder.isTypeSupported(m)) || ''

      try {
        mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      } catch (e) {
        return reject(e)
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstart = () => {
        setRecording(true)
        setLiveText('🎙️ Recording… tap mic to stop')
        _startSilenceDetection(stream, () => onAutoStop?.())
        resolve()
      }

      mediaRecorderRef.current.onerror = () => {
        _stopSilenceDetection()
        setRecording(false)
        setLiveText('')
        reject(new Error('MediaRecorder error'))
      }

      mediaRecorderRef.current.start(250) // collect chunks every 250ms
    })
  }, [setRecording, _startSilenceDetection, _stopSilenceDetection])

  const _stopMediaRecorder = useCallback(() => {
    return new Promise((resolve) => {
      _stopSilenceDetection()
      streamRef.current?.getTracks().forEach((t) => t.stop())

      const mr = mediaRecorderRef.current
      if (!mr || mr.state === 'inactive') {
        setLiveText(''); setRecording(false)
        return resolve({ type: 'blob', value: null })
      }

      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        chunksRef.current = []
        setLiveText(''); setRecording(false)
        resolve({ type: 'blob', value: blob })
      }

      try { mr.stop() } catch {
        setLiveText(''); setRecording(false)
        resolve({ type: 'blob', value: null })
      }
    })
  }, [setRecording, _stopSilenceDetection])

  // ── Public API ─────────────────────────────────────────────────────────────
  const start = useCallback((onAutoStop) => {
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream
        if (hasSpeechRecognition) {
          return _startWebSpeech(stream, onAutoStop)
        } else {
          return _startMediaRecorder(stream, onAutoStop)
        }
      })
      .catch(() => {
        addToast({ type: 'error', message: 'Microphone access denied.' })
        throw new Error('Mic denied')
      })
  }, [addToast, _startWebSpeech, _startMediaRecorder])

  const stop = useCallback(() => {
    if (hasSpeechRecognition) return _stopWebSpeech()
    return _stopMediaRecorder()
  }, [_stopWebSpeech, _stopMediaRecorder])

  return { start, stop, liveText }
}
