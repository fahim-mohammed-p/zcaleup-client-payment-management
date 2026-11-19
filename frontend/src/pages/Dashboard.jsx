import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Briefcase,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react'
import { dashboardService } from '../api/dashboardService'
import { paymentService } from '../api/paymentService'
import { MarkPaidModal } from '../components/MarkPaidModal'

export const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await dashboardService.getSummary()
      setData(res)
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleMarkPaidConfirm = async (payload) => {
    if (!selectedPayment) return
    setActionLoading(true)
    try {
      await paymentService.markPaymentPaid(selectedPayment.id, payload)
      setSelectedPayment(null)
      fetchDashboardData()
    } catch (err) {
      alert('Failed to mark payment as paid.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const metrics = data?.metrics || {}
  const statusOverview = data?.status_overview || {}

  const summaryCards = [
    {
      title: 'Total Clients',
      value: metrics.total_clients ?? 0,
      icon: Users,
      bgColor: '#fff7ed',
      color: '#ea580c',
      onClick: () => navigate('/clients')
    },
    {
      title: 'Total Projects',
      value: metrics.total_projects ?? 0,
      icon: Briefcase,
      bgColor: '#f0f9ff',
      color: '#0284c7',
      onClick: () => navigate('/clients')
    },
    {
      title: 'Total Project Value',
      value: `₹${Number(metrics.total_project_value || 0).toLocaleString()}`,
      icon: IndianRupee,
      bgColor: '#faf5ff',
      color: '#9333ea',
      onClick: () => navigate('/payments')
    },
    {
      title: 'Amount Received',
      value: `₹${Number(metrics.total_amount_received || 0).toLocaleString()}`,
      icon: CheckCircle,
      bgColor: '#ecfdf5',
      color: '#059669',
      onClick: () => navigate('/payments?status=PAID')
    },
    {
      title: 'Pending Amount',
      value: `₹${Number(metrics.total_pending_amount || 0).toLocaleString()}`,
      icon: Clock,
      bgColor: '#fffbeb',
      color: '#d97706',
      onClick: () => navigate('/payments?status=PENDING')
    },
    {
      title: 'Overdue Payments',
      value: metrics.overdue_payments_count ?? 0,
      subValue: `₹${Number(metrics.total_overdue_amount || 0).toLocaleString()}`,
      icon: AlertTriangle,
      bgColor: '#fef2f2',
      color: '#dc2626',
      isOverdue: true,
      onClick: () => navigate('/payments?status=OVERDUE')
    },
    {
      title: 'Installment Clients',
      value: metrics.installment_clients_count ?? 0,
      icon: Layers,
      bgColor: '#f1f5f9',
      color: '#475569',
      onClick: () => navigate('/clients')
    }
  ]

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Financial Overview</h2>
          <p className="text-muted small mb-0">Real-time metrics, payment tracking, and scheduled collections</p>
        </div>
        <button
          className="btn btn-light btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm text-primary' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-0" style={{ fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="row g-3">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className={idx < 4 ? 'col-12 col-sm-6 col-xl-3' : 'col-12 col-sm-6 col-xl-4'}>
              <div
                className="card p-3.5 h-100 summary-card bg-white"
                onClick={card.onClick}
                style={card.isOverdue && card.value > 0 ? { borderColor: '#fecaca', backgroundColor: '#fffbfb' } : {}}
              >
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {card.title}
                  </span>
                  <div className="summary-icon-box" style={{ backgroundColor: card.bgColor, color: card.color }}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2">
                  <div className="h3 fw-bold text-dark mb-0">{card.value}</div>
                  <ArrowUpRight size={16} className="text-muted ms-auto" />
                </div>
                {card.subValue && (
                  <div className="text-danger mt-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
                    Outstanding: {card.subValue}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h3 className="h6 fw-bold text-dark mb-0">Payment Status Overview</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Breakdown of collected, pending, and overdue capital</span>
          </div>
        </div>

        <div className="progress mb-3" style={{ height: 12, borderRadius: 6 }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${statusOverview.paid?.percentage || 0}%` }}
            title={`Paid: ${statusOverview.paid?.percentage || 0}%`}
          />
          <div
            className="progress-bar bg-warning"
            role="progressbar"
            style={{ width: `${statusOverview.pending?.percentage || 0}%` }}
            title={`Pending: ${statusOverview.pending?.percentage || 0}%`}
          />
          <div
            className="progress-bar bg-danger"
            role="progressbar"
            style={{ width: `${statusOverview.overdue?.percentage || 0}%` }}
            title={`Overdue: ${statusOverview.overdue?.percentage || 0}%`}
          />
        </div>

        <div className="row g-3 text-center">
          <div className="col-4">
            <div className="p-2 rounded-3" style={{ backgroundColor: '#ecfdf5' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-success fw-bold" style={{ fontSize: '0.85rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                Paid ({statusOverview.paid?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.95rem' }}>
                ₹{Number(statusOverview.paid?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.paid?.count || 0} payments</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-2 rounded-3" style={{ backgroundColor: '#fffbeb' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-warning fw-bold" style={{ fontSize: '0.85rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                Pending ({statusOverview.pending?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.95rem' }}>
                ₹{Number(statusOverview.pending?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.pending?.count || 0} payments</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-2 rounded-3" style={{ backgroundColor: '#fef2f2' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-danger fw-bold" style={{ fontSize: '0.85rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                Overdue ({statusOverview.overdue?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark mt-1" style={{ fontSize: '0.95rem' }}>
                ₹{Number(statusOverview.overdue?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.overdue?.count || 0} payments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h3 className="h6 fw-bold text-dark mb-0">Overdue Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.8rem' }}
                onClick={() => navigate('/payments?status=OVERDUE')}
              >
                View All
              </button>
            </div>

            {data?.overdue_payments?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.overdue_payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between"
                    style={{ borderColor: '#fecaca', backgroundColor: '#fffafa' }}
                  >
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                        {p.client_name}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {p.project_name} • Due: <span className="text-danger fw-medium">{p.due_date}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary py-0.5 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setSelectedPayment(p)}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">No overdue payments. All clients are up to date!</div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card p-3 bg-white h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <div className="d-flex align-items-center gap-2">
                <Clock size={18} className="text-warning" />
                <h3 className="h6 fw-bold text-dark mb-0">Upcoming Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.8rem' }}
                onClick={() => navigate('/payments?status=PENDING')}
              >
                View All
              </button>
            </div>

            {data?.upcoming_payments?.length > 0 ? (
              <div className="d-flex flex-column gap-2">
                {data.upcoming_payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
                        {p.client_name}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {p.project_name} • Due: <span className="text-dark fw-medium">{p.due_date}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary py-0.5 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setSelectedPayment(p)}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">No pending payments due in the next 30 days.</div>
            )}
          </div>
        </div>

        <div className="col-12">
          <div className="card p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 px-1">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle size={18} className="text-success" />
                <h3 className="h6 fw-bold text-dark mb-0">Recent Completed Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.8rem' }}
                onClick={() => navigate('/payments?status=PAID')}
              >
                View All
              </button>
            </div>

            {data?.recent_payments?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Project</th>
                      <th>Amount</th>
                      <th>Paid Date</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold text-dark">{p.client_name}</td>
                        <td>{p.project_name}</td>
                        <td className="fw-bold text-success">₹{Number(p.amount).toLocaleString()}</td>
                        <td>{p.paid_date}</td>
                        <td className="text-muted">{p.transaction_reference || 'Direct Deposit'}</td>
                        <td>
                          <span className="badge-paid">Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">No payment records completed yet.</div>
            )}
          </div>
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
