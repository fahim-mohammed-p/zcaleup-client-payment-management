import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Login = () => {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('adminpassword123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Invalid username or password. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#fed7aa 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="card border-0 shadow-sm p-4 p-sm-5" style={{ width: '100%', maxWidth: 440, borderRadius: 16 }}>
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(249, 115, 22, 0.25)'
            }}
          >
            <BriefcaseBusiness size={28} />
          </div>
          <h2 className="h4 fw-bold text-dark mb-1">Welcome to Zcaleup</h2>
          <p className="text-muted small mb-0">Sign in to your client and payment dashboard</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
            <AlertCircle size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Username</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <User size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-control border-start-0 ps-0"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center">
          <span className="text-muted small">Default Admin Credentials: </span>
          <code className="text-dark bg-light px-2 py-1 rounded small">admin / adminpassword123</code>
        </div>
      </div>
    </div>
  )
}
