import api from './axios'

export const clientService = {
  getClients: async (params = {}) => {
    const res = await api.get('/api/clients/', { params })
    return res.data
  },
  getClient: async (id) => {
    const res = await api.get(`/api/clients/${id}/`)
    return res.data
  },
  createClient: async (data) => {
    const res = await api.post('/api/clients/', data)
    return res.data
  },
  updateClient: async (id, data) => {
    const res = await api.put(`/api/clients/${id}/`, data)
    return res.data
  },
  deleteClient: async (id) => {
    const res = await api.delete(`/api/clients/${id}/`)
    return res.data
  }
}
