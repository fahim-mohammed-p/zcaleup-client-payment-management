import axios from 'axios'

const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const cleanBaseURL = rawBaseURL.replace(/\/+$/, '')

const api = axios.create({
  baseURL: cleanBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh/`, {
            refresh: refreshToken
          })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        } catch (refreshErr) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshErr)
        }
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
