import { useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:8000'
const TOKEN_KEY = 'sovereignid-token'

function decodeToken(token) {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

function useAuthState() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')

  const claims = useMemo(() => decodeToken(token), [token])
  const user = claims
    ? {
        username: claims.sub,
        role: claims.role,
        clearance: claims.clearance,
      }
    : null

  const saveToken = (newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setToken('')
    }
  }

  return { token, user, saveToken }
}

function fetchWithToken(url, token, options = {}) {
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}

function ProtectedRoute({ children, adminOnly = false, user }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'HQ_Admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function LoginPage({ onLogin, loginError, setLoginError }) {
  const [form, setForm] = useState({ username: 'field_worker', password: 'user123' })
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setLoginError('')

    try {
      const response = await fetchWithToken('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      onLogin(data.access_token)
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-block">
          <span className="eyebrow">SovereignID</span>
          <h1>Identity control center</h1>
          <p>Secure access and role enforcement for distributed teams.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </label>

          {loginError && <div className="error-box">{loginError}</div>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="demo-list">
            <strong>Demo users</strong>
            <ul>
              <li>field_worker / user123</li>
              <li>hq_admin / admin123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}

function UserDashboard({ user, token }) {
  const [supplies, setSupplies] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadSupplies = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchWithToken('/field/supplies', token)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Unable to load supplies')
      }

      setSupplies(data.supplies)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="nav-brand">SovereignID</div>
        <nav className="nav-list">
          <NavLink to="/dashboard">Operations</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </aside>

      <main className="dashboard-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>{user.username}</h2>
          </div>
          <button className="secondary-button" onClick={() => window.location.reload()}>
            Refresh session
          </button>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>
          <div className="stat-card">
            <span>Clearance</span>
            <strong>{user.clearance}</strong>
          </div>
          <div className="stat-card">
            <span>Region</span>
            <strong>Field Ops</strong>
          </div>
        </section>

        <section className="content-card">
          <div className="card-header">
            <h3>Field logistics</h3>
            <button className="primary-button" onClick={loadSupplies} disabled={loading}>
              {loading ? 'Loading...' : 'Load supplies'}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <ul className="resource-list">
            {supplies.length === 0 ? (
              <li>No supply data loaded yet</li>
            ) : (
              supplies.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </section>
      </main>
    </div>
  )
}

function AdminDashboard({ user, token }) {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetchWithToken('/admin/diplomatic-logs', token)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Access denied')
      }

      setLogs(data.logs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <aside className="sidebar admin-sidebar">
        <div className="nav-brand">HQ Command</div>
        <nav className="nav-list">
          <NavLink to="/dashboard">Operations</NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </aside>

      <main className="dashboard-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Protected zone</p>
            <h2>{user.username}</h2>
          </div>
          <button className="secondary-button" onClick={() => window.location.reload()}>
            Refresh session
          </button>
        </header>

        <section className="stats-grid admin-grid">
          <div className="stat-card">
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>
          <div className="stat-card">
            <span>Clearance</span>
            <strong>{user.clearance}</strong>
          </div>
          <div className="stat-card">
            <span>Status</span>
            <strong>Live</strong>
          </div>
        </section>

        <section className="content-card">
          <div className="card-header">
            <h3>Diplomatic audit logs</h3>
            <button className="primary-button" onClick={loadLogs} disabled={loading}>
              {loading ? 'Fetching...' : 'Open audit'}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <ul className="resource-list">
            {logs.length === 0 ? (
              <li>No audit records loaded</li>
            ) : (
              logs.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        </section>
      </main>
    </div>
  )
}

function App() {
  const { token, user, saveToken } = useAuthState()
  const [loginError, setLoginError] = useState('')

  const handleLogin = (newToken) => {
    saveToken(newToken)
    setLoginError('')
  }

  const handleLogout = () => {
    saveToken('')
  }

  const MainApp = user ? (
    <div>
      <div className="top-right-actions">
        <span className="session-pill">{user.role}</span>
        <button className="secondary-button" onClick={handleLogout}>Logout</button>
      </div>
      <Routes>
        <Route path="/" element={<Navigate to={user.role === 'HQ_Admin' ? '/admin' : '/dashboard'} replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <UserDashboard user={user} token={token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} adminOnly>
              <AdminDashboard user={user} token={token} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user.role === 'HQ_Admin' ? '/admin' : '/dashboard'} replace />} />
      </Routes>
    </div>
  ) : (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} loginError={loginError} setLoginError={setLoginError} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )

  return <>{MainApp}</>
}

export default App
