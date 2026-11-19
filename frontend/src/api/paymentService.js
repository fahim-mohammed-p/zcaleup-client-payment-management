import api from './axios'

export const paymentService = {
  getPayments: async (params = {}) => {
    const res = await api.get('/api/payments/', { params })
    return res.data
  },
  getPayment: async (id) => {
    const res = await api.get(`/api/payments/${id}/`)
    return res.data
  },
  markPaymentPaid: async (id, data = {}) => {
    const res = await api.post(`/api/payments/${id}/mark-paid/`, data)
    return res.data
  },
  getUpcomingPayments: async (params = {}) => {
    const res = await api.get('/api/payments/upcoming/', { params })
    return res.data
  },
  getOverduePayments: async (params = {}) => {
    const res = await api.get('/api/payments/overdue/', { params })
    return res.data
  }
}
