import { useState } from 'react'
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  X,
  CreditCard,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react'

export const ClientDetailModal = ({ isOpen, client, onClose, onMarkPaidClick }) => {
  const [activeTab, setActiveTab] = useState('overview')

  if (!isOpen || !client) return null

  const totalAmount = Number(client.total_project_amount || 0)
  const paidAmount = Number(client.paid_amount || 0)
  const remainingBalance = Number(client.remaining_balance || 0)
  const progressPercent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0

  const allPayments = []
  if (client.projects) {
    client.projects.forEach((prj) => {
      if (prj.payments) {
        prj.payments.forEach((p) => {
          allPayments.push({
            ...p,
            project_name: prj.project_name
          })
        })
      }
    })
  }

  const upcomingPayments = allPayments.filter((p) => p.effective_status === 'PENDING')
  const overduePayments = allPayments.filter((p) => p.effective_status === 'OVERDUE')
  const paidPayments = allPayments.filter((p) => p.effective_status === 'PAID')

  return (
    <div className="modal-backdrop-custom" onClick={onClose}>
      <div className="modal-dialog-custom modal-dialog-lg-custom" onClick={(e) => e.stopPropagation()}>
        <div className="p-3.5 px-4 border-bottom d-flex align-items-center justify-content-between bg-white">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#fff7ed',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title fw-bold mb-0 text-dark">{client.name}</h5>
                <span
                  className={
                    client.payment_status === 'Paid'
                      ? 'badge-paid'
                      : client.payment_status === 'Overdue'
                      ? 'badge-overdue'
                      : 'badge-pending'
                  }
                >
                  {client.payment_status}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                {client.company_name || 'Independent Client'} • Added on{' '}
                {new Date(client.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button className="btn btn-sm btn-link text-muted p-1" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="px-4 border-bottom bg-white">
          <ul className="nav nav-tabs border-0" style={{ gap: '1.5rem' }}>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-1 py-3 fw-semibold ${
                  activeTab === 'overview' ? 'text-primary border-bottom border-primary border-2 active' : 'text-muted'
                }`}
                style={{ background: 'none', fontSize: '0.875rem' }}
                onClick={() => setActiveTab('overview')}
              >
                Overview & Projects
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 px-1 py-3 fw-semibold ${
                  activeTab === 'payments' ? 'text-primary border-bottom border-primary border-2 active' : 'text-muted'
                }`}
                style={{ background: 'none', fontSize: '0.875rem' }}
                onClick={() => setActiveTab('payments')}
              >
                Payment Schedule ({allPayments.length})
              </button>
            </li>
          </ul>
        </div>

        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)', backgroundColor: '#f8fafc' }}>
          {activeTab === 'overview' ? (
            <div className="d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="card p-3 h-100 bg-white">
                    <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      TOTAL PROJECT VALUE
                    </div>
                    <div className="h4 fw-bold text-dark mb-0">₹{totalAmount.toLocaleString()}</div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {client.projects?.length || 0} Project(s)
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card p-3 h-100 bg-white">
                    <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      AMOUNT RECEIVED
                    </div>
                    <div className="h4 fw-bold text-success mb-0">₹{paidAmount.toLocaleString()}</div>
                    <div className="mt-2 progress" style={{ height: 6 }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${progressPercent}%` }}
                        aria-valuenow={progressPercent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card p-3 h-100 bg-white">
                    <div className="text-muted mb-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      OUTSTANDING BALANCE
                    </div>
                    <div className="h4 fw-bold text-danger mb-0">₹{remainingBalance.toLocaleString()}</div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {remainingBalance === 0 ? 'Fully Settled' : `${100 - progressPercent}% remaining`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-3 bg-white">
                <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: '0.9rem' }}>
                  Contact Information
                </h6>
                <div className="row g-3">
                  <div className="col-md-6 d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.85rem' }}>
                    <Mail size={16} className="text-primary flex-shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="col-md-6 d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.85rem' }}>
                    <Phone size={16} className="text-primary flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  {client.company_name && (
                    <div className="col-md-6 d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.85rem' }}>
                      <Building size={16} className="text-primary flex-shrink-0" />
                      <span>{client.company_name}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="col-md-6 d-flex align-items-center gap-2 text-secondary" style={{ fontSize: '0.85rem' }}>
                      <MapPin size={16} className="text-primary flex-shrink-0" />
                      <span>{client.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-3 bg-white">
                <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: '0.9rem' }}>
                  Assigned Projects
                </h6>
                {client.projects && client.projects.length > 0 ? (
                  <div className="d-flex flex-column gap-2.5">
                    {client.projects.map((prj) => (
                      <div
                        key={prj.id}
                        className="p-3 rounded-3 border"
                        style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                            {prj.project_name}
                          </div>
                          <span
                            className={
                              prj.status === 'Paid'
                                ? 'badge-paid'
                                : prj.status === 'Overdue'
                                ? 'badge-overdue'
                                : 'badge-pending'
                            }
                          >
                            {prj.status}
                          </span>
                        </div>
                        {prj.description && (
                          <div className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                            {prj.description}
                          </div>
                        )}
                        <div className="d-flex flex-wrap gap-3 pt-2 border-top text-secondary" style={{ fontSize: '0.8rem' }}>
                          <div>
                            <span className="text-muted">Type: </span>
                            <span className="fw-semibold text-dark">
                              {prj.payment_type === 'FULL' ? 'Full Payment' : `Installments (${prj.installment_count})`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted">Total: </span>
                            <span className="fw-bold text-dark">₹{Number(prj.total_amount).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted">Paid: </span>
                            <span className="fw-semibold text-success">₹{Number(prj.paid_amount).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted">Balance: </span>
                            <span className="fw-semibold text-danger">₹{Number(prj.remaining_amount).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                    No projects assigned yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div className="card bg-white p-0 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Paid Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPayments.length > 0 ? (
                        allPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="fw-semibold text-dark">{p.project_name}</td>
                            <td className="fw-bold">₹{Number(p.amount).toLocaleString()}</td>
                            <td>
                              <span className="d-flex align-items-center gap-1.5 text-secondary">
                                <Calendar size={14} className="text-muted" />
                                {p.due_date}
                              </span>
                            </td>
                            <td>
                              {p.paid_date ? (
                                <span className="text-success fw-medium">{p.paid_date}</span>
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
                            <td>
                              {p.effective_status !== 'PAID' && onMarkPaidClick ? (
                                <button
                                  className="btn btn-sm btn-outline-primary py-0.5 px-2"
                                  style={{ fontSize: '0.75rem' }}
                                  onClick={() => onMarkPaidClick(p)}
                                >
                                  Mark Paid
                                </button>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {p.transaction_reference || 'Completed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">
                            No payment records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
