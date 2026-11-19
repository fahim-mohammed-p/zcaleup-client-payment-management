import { useState, useEffect } from 'react'
import { User, X, Check } from 'lucide-react'

export const EditClientModal = ({ isOpen, client, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        company_name: client.company_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      })
      setError('')
    }
  }, [client, isOpen])

  if (!isOpen || !client) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Name, email, and phone are required.')
      return
    }
    setError('')
    onSave(client.id, formData)
  }

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={20} />
            </div>
            <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>
              Edit Client
            </h5>
          </div>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                Client Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                className="form-control"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                Office / Billing Address
              </label>
              <textarea
                name="address"
                className="form-control"
                rows="2"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light px-3" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-3 d-flex align-items-center gap-1.5" disabled={loading}>
              <Check size={16} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
