import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  BriefcaseBusiness,
  X
} from 'lucide-react'

export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/add-client', label: 'Add Client', icon: UserPlus },
    { to: '/payments', label: 'Payments', icon: CreditCard }
  ]

  return (
    <>
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 999 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="sidebar-brand-icon">
              <BriefcaseBusiness size={20} />
            </div>
            <div>
              <div className="sidebar-brand-name">Zcaleup</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1 }}>Client & Payments</div>
            </div>
          </div>
          <button
            className="btn btn-sm btn-link text-muted d-lg-none p-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-top mt-auto" style={{ backgroundColor: '#fafafa' }}>
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                width: 8,
                height: 8,
                backgroundColor: '#10b981',
                borderRadius: '50%',
                display: 'inline-block'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>System Operational</span>
          </div>
        </div>
      </aside>
    </>
  )
}
