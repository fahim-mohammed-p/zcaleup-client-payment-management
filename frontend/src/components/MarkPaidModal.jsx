import { useState, useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export const MarkPaidModal = ({ isOpen, payment, onConfirm, onCancel, loading }) => {
  const [paidDate, setPaidDate] = useState('')
  const [transactionReference, setTransactionReference] = useState('')

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setPaidDate(today)
      setTransactionReference('')
    }
  }, [isOpen])

  if (!isOpen || !payment) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      paid_date: paidDate,
      transaction_reference: transactionReference
    })
  }

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>
              Record Payment
            </h5>
          </div>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="p-3 mb-3 rounded-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Client:</span>
            <span className="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{payment.client_name}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Project:</span>
            <span className="text-dark" style={{ fontSize: '0.85rem' }}>{payment.project_name}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Amount Due:</span>
            <span className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>₹{Number(payment.amount).toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
              Payment Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className="form-control"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>
              Transaction Reference <span className="text-muted fw-normal">(Optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. UTR-98765432, Bank Transfer, Cheque #102"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light px-3" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-3 d-flex align-items-center gap-1.5" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Recording...' : 'Mark as Paid'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
