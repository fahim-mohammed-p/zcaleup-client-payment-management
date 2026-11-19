import { AlertTriangle, X } from 'lucide-react'

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', isDanger = true }) => {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop-custom" onClick={onCancel}>
      <div className="modal-dialog-custom p-4" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: isDanger ? '#fee2e2' : '#fef3c7',
                color: isDanger ? '#dc2626' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h5 className="modal-title fw-bold mb-0 text-dark" style={{ fontSize: '1.1rem' }}>
              {title}
            </h5>
          </div>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <p className="text-secondary mb-4" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-light px-3" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} px-3`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
