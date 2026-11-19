import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/auth/user/')
      setUser(res.data)
    } catch {
      setUser(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchUserProfile()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username, password) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    const res = await axios.post(`${baseURL}/api/auth/login/`, { username, password })
    const { access, refresh } = res.data

    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    setToken(access)

    const profileRes = await axios.get(`${baseURL}/api/auth/user/`, {
      headers: { Authorization: `Bearer ${access}` }
    })
    setUser(profileRes.data)
    return profileRes.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
