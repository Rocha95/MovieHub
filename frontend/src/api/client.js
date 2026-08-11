import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const TOKEN_KEY = 'moviehub:token'

const api = axios.create({
  baseURL: API_URL,
})

// 1. Interceptor de REQUISIÇÃO: Anexa o token JWT em cada chamada
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 2. Interceptor de RESPOSTA: Trata o erro 401 globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpa a chave correta 'moviehub:token'
      localStorage.removeItem(TOKEN_KEY)

      // Redireciona para /entrar apenas se ainda não estiver na página de auth
      if (!window.location.pathname.startsWith('/entrar')) {
        window.location.href = '/entrar'
      }
    }
    return Promise.reject(error)
  }
)

export default api