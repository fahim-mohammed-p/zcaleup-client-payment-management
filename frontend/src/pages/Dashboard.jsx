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
    } catch {
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
    } catch {
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
    <div className="d-flex flex-column gap-3.5">
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
        <div>
          <h2 className="h5 fw-bold text-dark mb-0">Financial Overview</h2>
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
        <div className="alert alert-danger py-2 px-3 mb-0" style={{ fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div
              key={idx}
              className="card summary-card p-3 bg-white d-flex flex-column justify-content-between"
              onClick={card.onClick}
              style={card.isOverdue && card.value > 0 ? { borderColor: '#fecaca', backgroundColor: '#fffafa' } : {}}
            >
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <span className="text-muted fw-semibold text-truncate" style={{ fontSize: '0.76rem', letterSpacing: '0.02em' }}>
                  {card.title}
                </span>
                <div className="summary-icon-box flex-shrink-0" style={{ backgroundColor: card.bgColor, color: card.color }}>
                  <Icon size={17} />
                </div>
              </div>
              <div className="mt-auto">
                <div className="d-flex align-items-baseline justify-content-between gap-1">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '1.35rem', lineHeight: 1.2 }}>
                    {card.value}
                  </div>
                  <ArrowUpRight size={16} className="text-muted flex-shrink-0" />
                </div>
                {card.subValue && (
                  <div className="text-danger fw-semibold text-truncate mt-0.5" style={{ fontSize: '0.72rem', lineHeight: 1 }}>
                    Due: {card.subValue}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-3 p-sm-3.5 bg-white">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-1 mb-2">
          <div>
            <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Payment Status Overview</h3>
            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Breakdown of collected, pending, and overdue capital</p>
          </div>
        </div>

        <div className="progress my-2.5" style={{ height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', width: '100%' }}>
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

        <div className="row g-2.5 text-center mt-0.5">
          <div className="col-12 col-md-4">
            <div className="p-2.5 rounded-3 d-flex flex-column align-items-center justify-content-center h-100" style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-success fw-semibold" style={{ fontSize: '0.78rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                Paid ({statusOverview.paid?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark my-1" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                ₹{Number(statusOverview.paid?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.paid?.count || 0} payments</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-2.5 rounded-3 d-flex flex-column align-items-center justify-content-center h-100" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-warning fw-semibold" style={{ fontSize: '0.78rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0 }} />
                Pending ({statusOverview.pending?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark my-1" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                ₹{Number(statusOverview.pending?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.pending?.count || 0} payments</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-2.5 rounded-3 d-flex flex-column align-items-center justify-content-center h-100" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
              <div className="d-flex align-items-center justify-content-center gap-1.5 text-danger fw-semibold" style={{ fontSize: '0.78rem' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444', flexShrink: 0 }} />
                Overdue ({statusOverview.overdue?.percentage || 0}%)
              </div>
              <div className="fw-bold text-dark my-1" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>
                ₹{Number(statusOverview.overdue?.amount || 0).toLocaleString()}
              </div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{statusOverview.overdue?.count || 0} payments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card p-3 p-sm-3.5 bg-white h-100 d-flex flex-column overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-2.5">
              <div className="d-flex align-items-center gap-2">
                <AlertTriangle size={17} className="text-danger flex-shrink-0" />
                <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Overdue Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.78rem' }}
                onClick={() => navigate('/payments?status=OVERDUE')}
              >
                View All
              </button>
            </div>

            <div className="d-flex flex-column gap-2 flex-grow-1">
              {data?.overdue_payments?.length > 0 ? (
                data.overdue_payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-3 border d-flex flex-wrap flex-sm-nowrap align-items-center justify-content-between gap-2"
                    style={{ borderColor: '#fecaca', backgroundColor: '#fffafa' }}
                  >
                    <div className="min-w-0" style={{ flex: '1 1 170px' }}>
                      <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>
                        {p.client_name}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.74rem' }}>
                        {p.project_name} <span className="mx-1">•</span> Due: <span className="text-danger fw-semibold">{p.due_date}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-2 flex-shrink-0 ms-auto">
                      <div className="fw-bold text-dark text-nowrap text-end" style={{ fontSize: '0.88rem' }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary py-1 px-2.5 text-nowrap"
                        style={{ fontSize: '0.75rem', lineHeight: 1.25 }}
                        onClick={() => setSelectedPayment(p)}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-center p-4 my-auto text-muted flex-grow-1" style={{ minHeight: '130px' }}>
                  <CheckCircle size={28} className="text-success mb-1.5 opacity-75" />
                  <div className="small fw-semibold text-dark">All payments are up to date!</div>
                  <div style={{ fontSize: '0.75rem' }}>No overdue accounts found.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card p-3 p-sm-3.5 bg-white h-100 d-flex flex-column overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-2.5">
              <div className="d-flex align-items-center gap-2">
                <Clock size={17} className="text-warning flex-shrink-0" />
                <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Upcoming Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.78rem' }}
                onClick={() => navigate('/payments?status=PENDING')}
              >
                View All
              </button>
            </div>

            <div className="d-flex flex-column gap-2 flex-grow-1">
              {data?.upcoming_payments?.length > 0 ? (
                data.upcoming_payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-3 border d-flex flex-wrap flex-sm-nowrap align-items-center justify-content-between gap-2"
                    style={{ borderColor: '#e2e8f0', backgroundColor: '#ffffff' }}
                  >
                    <div className="min-w-0" style={{ flex: '1 1 170px' }}>
                      <div className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.84rem' }}>
                        {p.client_name}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: '0.74rem' }}>
                        {p.project_name} <span className="mx-1">•</span> Due: <span className="text-dark fw-medium">{p.due_date}</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-2 flex-shrink-0 ms-auto">
                      <div className="fw-bold text-dark text-nowrap text-end" style={{ fontSize: '0.88rem' }}>
                        ₹{Number(p.amount).toLocaleString()}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary py-1 px-2.5 text-nowrap"
                        style={{ fontSize: '0.75rem', lineHeight: 1.25 }}
                        onClick={() => setSelectedPayment(p)}
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-center p-4 my-auto text-muted flex-grow-1" style={{ minHeight: '130px' }}>
                  <Clock size={28} className="text-muted mb-1.5 opacity-50" />
                  <div className="small fw-semibold text-dark">No upcoming payments</div>
                  <div style={{ fontSize: '0.75rem' }}>No payments due in the next 30 days.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card p-3 p-sm-3.5 bg-white overflow-hidden">
            <div className="d-flex align-items-center justify-content-between mb-2.5">
              <div className="d-flex align-items-center gap-2">
                <CheckCircle size={17} className="text-success flex-shrink-0" />
                <h3 className="fw-bold text-dark mb-0" style={{ fontSize: '0.95rem' }}>Recent Completed Payments</h3>
              </div>
              <button
                className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-semibold"
                style={{ fontSize: '0.78rem' }}
                onClick={() => navigate('/payments?status=PAID')}
              >
                View All
              </button>
            </div>

            {data?.recent_payments?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover table-compact align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '150px' }}>Client</th>
                      <th style={{ minWidth: '170px' }}>Project</th>
                      <th className="text-end" style={{ minWidth: '110px' }}>Amount</th>
                      <th style={{ minWidth: '110px' }}>Paid Date</th>
                      <th style={{ minWidth: '140px' }}>Reference</th>
                      <th className="text-center" style={{ minWidth: '90px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-semibold text-dark text-nowrap">{p.client_name}</td>
                        <td className="text-secondary text-nowrap">{p.project_name}</td>
                        <td className="fw-bold text-success text-end text-nowrap">₹{Number(p.amount).toLocaleString()}</td>
                        <td className="text-nowrap">{p.paid_date}</td>
                        <td className="text-muted text-nowrap font-monospace" style={{ fontSize: '0.78rem' }}>
                          {p.transaction_reference || 'Direct Deposit'}
                        </td>
                        <td className="text-center text-nowrap">
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
