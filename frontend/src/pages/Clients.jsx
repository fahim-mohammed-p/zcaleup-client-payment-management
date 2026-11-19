import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Phone,
  Mail,
  Building,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { clientService } from '../api/clientService'
import { paymentService } from '../api/paymentService'
import { ClientDetailModal } from '../components/ClientDetailModal'
import { EditClientModal } from '../components/EditClientModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { MarkPaidModal } from '../components/MarkPaidModal'

export const Clients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientToEdit, setClientToEdit] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [paymentToMark, setPaymentToMark] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()

  const fetchClients = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (statusFilter !== 'ALL') params.status = statusFilter
      const res = await clientService.getClients(params)
      setClients(res)

      if (selectedClient) {
        const updated = res.find((c) => c.id === selectedClient.id)
        if (updated) setSelectedClient(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients()
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const handleEditSave = async (id, formData) => {
    setActionLoading(true)
    try {
      await clientService.updateClient(id, formData)
      setClientToEdit(null)
      fetchClients()
    } catch (err) {
      alert('Failed to update client details.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return
    setActionLoading(true)
    try {
      await clientService.deleteClient(clientToDelete.id)
      setClientToDelete(null)
      if (selectedClient?.id === clientToDelete.id) setSelectedClient(null)
      fetchClients()
    } catch (err) {
      alert('Failed to delete client.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkPaidConfirm = async (payload) => {
    if (!paymentToMark) return
    setActionLoading(true)
    try {
      await paymentService.markPaymentPaid(paymentToMark.id, payload)
      setPaymentToMark(null)
      fetchClients()
    } catch (err) {
      alert('Failed to mark payment as paid.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h2 className="h4 fw-bold text-dark mb-0">Client Directory</h2>
          <p className="text-muted small mb-0">Manage customer accounts, assigned projects, and billing records</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-light btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
            onClick={fetchClients}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm text-primary' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 px-3 py-1.5"
            onClick={() => navigate('/add-client')}
          >
            <UserPlus size={16} />
            <span>Add Client</span>
          </button>
        </div>
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
                placeholder="Search by client name, company, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-4 ms-auto">
            <div className="d-flex align-items-center justify-content-md-end gap-1">
              <span className="text-muted me-1 small d-flex align-items-center gap-1">
                <Filter size={14} /> Filter:
              </span>
              {['ALL', 'Paid', 'Pending', 'Overdue'].map((st) => (
                <button
                  key={st}
                  className={`btn btn-sm ${
                    statusFilter === st ? 'btn-primary' : 'btn-light'
                  } py-1 px-2.5`}
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
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
                <th>Company</th>
                <th>Contact</th>
                <th>Projects</th>
                <th>Total Value</th>
                <th>Payment Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && clients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    <span className="text-muted small">Loading client records...</span>
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedClient(c)}>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: '#fff7ed',
                            color: '#ea580c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{c.name}</div>
                          <div className="text-muted d-block d-md-none" style={{ fontSize: '0.75rem' }}>
                            {c.company_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.company_name ? (
                        <span className="text-secondary fw-medium">{c.company_name}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                        <div className="text-dark">{c.email}</div>
                        <div className="text-muted">{c.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                        {c.projects_count} project{c.projects_count === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">₹{Number(c.total_project_amount).toLocaleString()}</div>
                      {Number(c.remaining_balance) > 0 && (
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Bal: ₹{Number(c.remaining_balance).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          c.payment_status === 'Paid'
                            ? 'badge-paid'
                            : c.payment_status === 'Overdue'
                            ? 'badge-overdue'
                            : 'badge-pending'
                        }
                      >
                        {c.payment_status}
                      </span>
                    </td>
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          className="btn btn-sm btn-light p-1.5 text-secondary"
                          title="View Details"
                          onClick={() => setSelectedClient(c)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-light p-1.5 text-secondary"
                          title="Edit Client"
                          onClick={() => setClientToEdit(c)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-light p-1.5 text-danger"
                          title="Delete Client"
                          onClick={() => setClientToDelete(c)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <FolderOpen size={36} className="text-muted mb-2 d-block mx-auto opacity-50" />
                    <div>No clients found matching your query.</div>
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={() => navigate('/add-client')}
                    >
                      Add New Client
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailModal
        isOpen={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onMarkPaidClick={(p) => setPaymentToMark(p)}
      />

      <EditClientModal
        isOpen={!!clientToEdit}
        client={clientToEdit}
        onSave={handleEditSave}
        onCancel={() => setClientToEdit(null)}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!clientToDelete}
        title="Delete Client"
        message={`Are you sure you want to permanently delete "${clientToDelete?.name}"? All associated projects and payment records will also be deleted.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setClientToDelete(null)}
        confirmText={actionLoading ? 'Deleting...' : 'Delete Client'}
        isDanger={true}
      />

      <MarkPaidModal
        isOpen={!!paymentToMark}
        payment={paymentToMark}
        onConfirm={handleMarkPaidConfirm}
        onCancel={() => setPaymentToMark(null)}
        loading={actionLoading}
      />
    </div>
  )
}
