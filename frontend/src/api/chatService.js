import api from './axios'

export const chatService = {
  sendMessage: async (message, history = []) => {
    const res = await api.post('/api/chat/', { message, history })
    return res.data
  }
}
