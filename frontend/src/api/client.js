import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
})

// Anexa o token JWT salvo no login em toda requisição autenticada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moviehub:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
