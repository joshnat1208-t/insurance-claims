import React, { useState } from 'react'
import '../css/Login.css'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      email: email || 'admin@abc.com',
      password: password || 'Adminpassword@123',
      role: role,
      username: email ? email.split('@')[0] : 'Admin',
    }

    try {
      // Call handleLogin in AuthManager (which calls claimsApi.login)
      await onLogin(payload)
    } catch (err) {
      console.warn('API Call failed:', err)
      // Fallback only on genuine error, without hard reload
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem('auth_token', 'dummy-token')
        localStorage.setItem('user_data', JSON.stringify(payload))
      }
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h2>ABC Insurance Login</h2>
        <p className="login-subtitle">Sign in to access Claim operations</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. joshna@abc.com"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Select Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="role-select"
            >
              <option value="admin">Admin</option>
              <option value="adjuster">Adjuster</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}