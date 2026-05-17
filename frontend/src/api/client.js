import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const sendVoiceQuery = (audioBlob) => {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  return api.post('/voice-query', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const sendTextQuery = (text, language = 'en') => api.post('/text-query', { text, language })
export const fetchHistory = () => api.get('/history')
export const clearHistory = () => api.delete('/history')
export const checkHealth = () => axios.get('/health')
export const transcribeYoutube = (url) => api.post('/youtube/transcribe', { url })
export const login = (username, password) => api.post('/login', { username, password })
export const register = (userData) => api.post('/register', userData)
