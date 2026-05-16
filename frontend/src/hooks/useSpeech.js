import { useRef, useCallback, useState } from 'react'
import { useAppStore } from '../store/useAppStore'

const SILENCE_THRESHOLD = 10   // amplitude below this = silence (0-255)
const SILENCE_DURATION = 2000  // ms of silence before auto-stop

export function useSpeech() {
  const recognition = useRef(null)
  const { setRecording, addToast } = useAppStore()
  const [liveText, setLiveText] = useState('')
  const liveTextRef = useRef('')

  // Silence detection refs
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef = useRef(null)
  const onAutoStopRef = useRef(null)  // callback to call when silence detected

  const _startSilenceDetection = useCallback((stream, onSilence) => {
    onAutoStopRef.current = onSilence

    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    analyserRef.current = audioCtxRef.current.createAnalyser()
    analyserRef.current.fftSize = 512

    const source = audioCtxRef.current.createMediaStreamSource(stream)
    source.connect(analyserRef.current)

    const data = new Uint8Array(analyserRef.current.frequencyBinCount)

    const check = () => {
      analyserRef.current.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length

      if (avg < SILENCE_THRESHOLD) {
        // Silence detected — start/continue timer
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            onAutoStopRef.current?.()
          }, SILENCE_DURATION)
        }
      } else {
        // Voice detected — reset timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }
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

  const start = useCallback((onAutoStop) => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        addToast({ type: 'error', message: 'Speech Recognition not supported. Use Google Chrome.' })
        return reject(new Error('Not supported'))
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          streamRef.current = stream

          try { recognition.current = new SpeechRecognition() }
          catch (e) { return reject(e) }

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
            // Start silence detection — auto-stop after 2s silence
            _startSilenceDetection(stream, () => {
              onAutoStop?.()
            })
            resolve()
          }

          recognition.current.onend = () => setRecording(false)

          try { recognition.current.start() }
          catch (e) { reject(e) }
        })
        .catch(() => {
          addToast({ type: 'error', message: 'Microphone access denied.' })
          reject(new Error('Mic denied'))
        })
    })
  }, [setRecording, addToast, _startSilenceDetection, _stopSilenceDetection])

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      _stopSilenceDetection()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const text = liveTextRef.current
      setLiveText('')
      liveTextRef.current = ''
      try { recognition.current?.stop() } catch {}
      setRecording(false)
      resolve(text)
    })
  }, [setRecording, _stopSilenceDetection])

  return { start, stop, liveText }
}
