import { useLocation } from 'react-router-dom'
import { Menu, LogOut, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const getPageTitle = (path) => {
    if (path === '/') return 'Dashboard Overview'
    if (path.startsWith('/clients')) return 'Client Management'
    if (path.startsWith('/add-client')) return 'Add New Client & Project'
    if (path.startsWith('/payments')) return 'Payment Records & Tracking'
    return 'Management Portal'
  }

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-light d-lg-none d-flex align-items-center justify-content-center p-2"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="h5 mb-0 fw-bold text-dark">{getPageTitle(location.pathname)}</h1>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#fed7aa',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon size={18} />}
          </div>
          <div className="d-none d-sm-block text-start" style={{ lineHeight: 1.2 }}>
            <div className="fw-semibold text-dark" style={{ fontSize: '0.875rem' }}>
              {user?.username || 'Administrator'}
            </div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.email || 'admin@example.com'}
            </div>
          </div>
        </div>

        <button
          className="btn btn-light btn-sm d-flex align-items-center gap-1.5 px-2.5 py-1.5 text-danger"
          onClick={logout}
          title="Sign out of system"
        >
          <LogOut size={16} />
          <span className="d-none d-md-inline" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            Logout
          </span>
        </button>
      </div>
    </header>
  )
}
