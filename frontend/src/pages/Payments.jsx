import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { paymentService } from '../api/paymentService'
import { MarkPaidModal } from '../components/MarkPaidModal'

export const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status')?.toUpperCase() || 'ALL'

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      const data = await paymentService.getPayments(params)
      setPayments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const urlStatus = searchParams.get('status')?.toUpperCase()
    if (urlStatus && ['PAID', 'PENDING', 'OVERDUE'].includes(urlStatus)) {
      setStatusFilter(urlStatus)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments()
    }, 200)
    return () => clearTimeout(timer)
  }, [statusFilter, searchTerm])

  const handleStatusChange = (status) => {
    setStatusFilter(status)
    if (status === 'ALL') {
      searchParams.delete('status')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ status })
    }
  }

  const handleMarkPaidConfirm = async (payload) => {
    if (!selectedPayment) return
    setActionLoading(true)
    try {
      await paymentService.markPaymentPaid(selectedPayment.id, payload)
      setSelectedPayment(null)
      fetchPayments()
    } catch (err) {
      alert('Failed to update payment status.')
    } finally {
      setActionLoading(false)
    }
  }

  const statusCounts = payments.reduce(
    (acc, p) => {
      const st = p.effective_status
      if (st === 'PAID') acc.paid++
      else if (st === 'OVERDUE') acc.overdue++
      else acc.pending++
      return acc
    },
    { paid: 0, pending: 0, overdue: 0 }
  )

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Payments Ledger</h2>
          <p className="text-muted small mb-0">Track all installment schedules, completed collections, and overdue accounts</p>
        </div>
        <button
          className="btn btn-light btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
          onClick={fetchPayments}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm text-primary' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card p-3 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by client, project, or transaction ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-5 ms-auto">
            <div className="d-flex align-items-center justify-content-md-end gap-1">
              <span className="text-muted me-1 small d-flex align-items-center gap-1">
                <Filter size={14} /> Status:
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Overdue', value: 'OVERDUE' },
                { label: 'Paid', value: 'PAID' }
              ].map((tab) => (
                <button
                  key={tab.value}
                  className={`btn btn-sm ${
                    statusFilter === tab.value ? 'btn-primary' : 'btn-light'
                  } py-1 px-2.5`}
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => handleStatusChange(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>Status</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    <span className="text-muted small">Loading payment records...</span>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="fw-semibold text-dark">{p.client_name}</div>
                      {p.company_name && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {p.company_name}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-secondary">{p.project_name}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">₹{Number(p.amount).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="d-flex align-items-center gap-1.5 text-secondary">
                        <Calendar size={14} className="text-muted" />
                        {p.due_date}
                      </span>
                    </td>
                    <td>
                      {p.paid_date ? (
                        <div>
                          <div className="text-success fw-medium" style={{ fontSize: '0.85rem' }}>
                            {p.paid_date}
                          </div>
                          {p.transaction_reference && (
                            <div className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                              Ref: {p.transaction_reference}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          p.effective_status === 'PAID'
                            ? 'badge-paid'
                            : p.effective_status === 'OVERDUE'
                            ? 'badge-overdue'
                            : 'badge-pending'
                        }
                      >
                        {p.effective_status}
                      </span>
                    </td>
                    <td className="text-end">
                      {p.effective_status !== 'PAID' ? (
                        <button
                          className="btn btn-sm btn-outline-primary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setSelectedPayment(p)}
                        >
                          <CheckCircle2 size={14} />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="badge bg-light text-muted border py-1 px-2" style={{ fontSize: '0.75rem' }}>
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <CreditCard size={36} className="text-muted mb-2 d-block mx-auto opacity-50" />
                    <div>No payment records found for this filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MarkPaidModal
        isOpen={!!selectedPayment}
        payment={selectedPayment}
        onConfirm={handleMarkPaidConfirm}
        onCancel={() => setSelectedPayment(null)}
        loading={actionLoading}
      />
    </div>
  )
}
