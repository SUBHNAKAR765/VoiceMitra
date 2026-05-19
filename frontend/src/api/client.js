import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  config.headers['X-Client-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
  config.headers['X-Client-Time'] = new Date().toISOString()
  return config
})

export const sendVoiceQuery = (audioBlob) => {
  const ext = audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
  const form = new FormData()
  form.append('audio', audioBlob, `recording.${ext}`)
  return api.post('/voice-query', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const sendTextQuery = (text) => api.post('/text-query', { text })
export const fetchHistory = () => api.get('/history')
export const clearHistory = () => api.delete('/history')
export const checkHealth = () => axios.get('/health')
export const transcribeYoutube = (url) => api.post('/youtube/transcribe', { url })
export const login = (username, password) => api.post('/login', { username, password })
export const register = (userData) => api.post('/register', userData)
