import api from './axios'

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/api/dashboard/summary/')
    return res.data
  }
}
