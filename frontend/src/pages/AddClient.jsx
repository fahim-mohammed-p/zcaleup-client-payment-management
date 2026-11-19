import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Building,
  Briefcase,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ListOrdered
} from 'lucide-react'
import { clientService } from '../api/clientService'

export const AddClient = () => {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    project_name: '',
    project_description: '',
    project_start_date: today,
    total_amount: '',
    payment_type: 'INSTALLMENTS',
    installment_count: 3,
    first_payment_due_date: today,
    payment_interval: 'monthly'
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const schedulePreview = useMemo(() => {
    const total = parseFloat(formData.total_amount)
    if (isNaN(total) || total <= 0) return []

    const firstDate = formData.first_payment_due_date ? new Date(formData.first_payment_due_date) : new Date()

    if (formData.payment_type === 'FULL') {
      return [
        {
          index: 1,
          label: 'Full Payment',
          dueDate: firstDate.toISOString().split('T')[0],
          amount: total.toFixed(2)
        }
      ]
    }

    const count = Math.max(1, parseInt(formData.installment_count) || 1)
    const baseAmount = Number((total / count).toFixed(2))
    let accumulated = 0
    const list = []

    for (let i = 0; i < count; i++) {
      const d = new Date(firstDate)
      if (formData.payment_interval === 'monthly') {
        d.setMonth(d.getMonth() + i)
      }

      let currentAmount = baseAmount
      if (i === count - 1) {
        currentAmount = Number((total - accumulated).toFixed(2))
      } else {
        accumulated += currentAmount
      }

      list.push({
        index: i + 1,
        label: `Installment #${i + 1}`,
        dueDate: d.toISOString().split('T')[0],
        amount: currentAmount.toFixed(2)
      })
    }
    return list
  }, [
    formData.total_amount,
    formData.payment_type,
    formData.installment_count,
    formData.first_payment_due_date,
    formData.payment_interval
  ])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Client name is required.'
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.'
    if (!formData.project_name.trim()) newErrors.project_name = 'Project name is required.'
    if (!formData.project_start_date) newErrors.project_start_date = 'Start date is required.'

    const total = parseFloat(formData.total_amount)
    if (isNaN(total) || total <= 0) {
      newErrors.total_amount = 'Total amount must be greater than zero.'
    }

    if (formData.payment_type === 'INSTALLMENTS') {
      const count = parseInt(formData.installment_count)
      if (isNaN(count) || count < 2) {
        newErrors.installment_count = 'Installments count must be at least 2.'
      }
    }

    if (!formData.first_payment_due_date) {
      newErrors.first_payment_due_date = 'First payment due date is required.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        project_name: formData.project_name.trim(),
        project_description: formData.project_description.trim(),
        project_start_date: formData.project_start_date,
        total_amount: parseFloat(formData.total_amount).toFixed(2),
        payment_type: formData.payment_type,
        installment_count: formData.payment_type === 'FULL' ? 1 : parseInt(formData.installment_count),
        first_payment_due_date: formData.first_payment_due_date,
        payment_interval: formData.payment_interval
      }

      await clientService.createClient(payload)
      navigate('/clients')
    } catch (err) {
      const backendErr = err.response?.data
      if (typeof backendErr === 'object') {
        const errorStrings = Object.entries(backendErr).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
        setServerError(errorStrings.join(' | '))
      } else {
        setServerError('Failed to save client. Please check your network connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column gap-4" style={{ maxWidth: 900 }}>
      <div>
        <h2 className="h4 fw-bold text-dark mb-0">Create Client &amp; Project Schedule</h2>
        <p className="text-muted small mb-0">
          Enter client details, project scope, and configure full or installment billing terms
        </p>
      </div>

      {serverError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-0" style={{ fontSize: '0.85rem' }}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <div>{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
        <div className="card p-4 bg-white">
          <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={18} />
            </div>
            <h3 className="h6 fw-bold text-dark mb-0">1. Client Information</h3>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Client Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="name"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Company Name <span className="text-muted fw-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="company_name"
                className="form-control"
                placeholder="e.g. Apex Global Corp"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="client@company.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Phone Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold text-dark">Office / Billing Address</label>
              <textarea
                name="address"
                className="form-control"
                rows="2"
                placeholder="Street address, city, state, postal code"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="card p-4 bg-white">
          <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#f0f9ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Briefcase size={18} />
            </div>
            <h3 className="h6 fw-bold text-dark mb-0">2. Project Information</h3>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label small fw-semibold text-dark">
                Project Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="project_name"
                className={`form-control ${errors.project_name ? 'is-invalid' : ''}`}
                placeholder="e.g. Cloud Infrastructure Setup & CI/CD"
                value={formData.project_name}
                onChange={handleChange}
              />
              {errors.project_name && <div className="invalid-feedback">{errors.project_name}</div>}
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-dark">
                Project Start Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="project_start_date"
                className={`form-control ${errors.project_start_date ? 'is-invalid' : ''}`}
                value={formData.project_start_date}
                onChange={handleChange}
              />
              {errors.project_start_date && <div className="invalid-feedback">{errors.project_start_date}</div>}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold text-dark">
                Project Description <span className="text-muted fw-normal">(Optional)</span>
              </label>
              <textarea
                name="project_description"
                className="form-control"
                rows="2"
                placeholder="Key deliverables, timeline, milestones"
                value={formData.project_description}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="card p-4 bg-white">
          <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CreditCard size={18} />
            </div>
            <h3 className="h6 fw-bold text-dark mb-0">3. Payment Information &amp; Schedule Terms</h3>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">
                Total Project Amount (₹) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  name="total_amount"
                  className={`form-control ${errors.total_amount ? 'is-invalid' : ''}`}
                  placeholder="e.g. 50000"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
                {errors.total_amount && <div className="invalid-feedback">{errors.total_amount}</div>}
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-dark">Payment Type</label>
              <div className="d-flex gap-3 mt-1">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment_type"
                    id="paymentTypeInstallments"
                    value="INSTALLMENTS"
                    checked={formData.payment_type === 'INSTALLMENTS'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small fw-medium" htmlFor="paymentTypeInstallments">
                    Installment Payments
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="payment_type"
                    id="paymentTypeFull"
                    value="FULL"
                    checked={formData.payment_type === 'FULL'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small fw-medium" htmlFor="paymentTypeFull">
                    Full Payment
                  </label>
                </div>
              </div>
            </div>

            {formData.payment_type === 'INSTALLMENTS' && (
              <>
                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-semibold text-dark">
                    Number of Installments <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="36"
                    name="installment_count"
                    className={`form-control ${errors.installment_count ? 'is-invalid' : ''}`}
                    value={formData.installment_count}
                    onChange={handleChange}
                  />
                  {errors.installment_count && <div className="invalid-feedback">{errors.installment_count}</div>}
                </div>

                <div className="col-12 col-sm-6 col-md-4">
                  <label className="form-label small fw-semibold text-dark">Payment Interval</label>
                  <select
                    name="payment_interval"
                    className="form-select"
                    value={formData.payment_interval}
                    onChange={handleChange}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="custom">Same Due Date (Custom)</option>
                  </select>
                </div>
              </>
            )}

            <div className={`col-12 ${formData.payment_type === 'INSTALLMENTS' ? 'col-md-4' : 'col-md-6'}`}>
              <label className="form-label small fw-semibold text-dark">
                First Payment Due Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="first_payment_due_date"
                className={`form-control ${errors.first_payment_due_date ? 'is-invalid' : ''}`}
                value={formData.first_payment_due_date}
                onChange={handleChange}
              />
              {errors.first_payment_due_date && (
                <div className="invalid-feedback">{errors.first_payment_due_date}</div>
              )}
            </div>
          </div>

          {schedulePreview.length > 0 && (
            <div className="p-3 rounded-3 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <ListOrdered size={16} className="text-primary" />
                  <span className="fw-bold text-dark small">Payment Schedule Review</span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {schedulePreview.length} payment record(s) to be created
                </span>
              </div>

              <div className="table-responsive bg-white rounded-2 border">
                <table className="table table-sm mb-0">
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th className="py-2 px-3 small">Schedule #</th>
                      <th className="py-2 px-3 small">Scheduled Due Date</th>
                      <th className="py-2 px-3 small text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedulePreview.map((item) => (
                      <tr key={item.index}>
                        <td className="py-2 px-3 small fw-medium text-dark">{item.label}</td>
                        <td className="py-2 px-3 small text-secondary">{item.dueDate}</td>
                        <td className="py-2 px-3 small text-end fw-bold text-dark">
                          ₹{Number(item.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#fff7ed' }}>
                      <td colSpan="2" className="py-2 px-3 small fw-bold text-dark">
                        Total Scheduled Value:
                      </td>
                      <td className="py-2 px-3 small text-end fw-bold text-primary">
                        ₹
                        {schedulePreview
                          .reduce((sum, item) => sum + parseFloat(item.amount), 0)
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-end gap-3">
          <button
            type="button"
            className="btn btn-light px-4"
            onClick={() => navigate('/clients')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary px-4 d-flex align-items-center gap-2"
            disabled={loading}
          >
            <span>{loading ? 'Creating Client & Schedule...' : 'Save Client & Schedule'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}
