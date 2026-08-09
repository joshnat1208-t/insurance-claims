// src/components/UserCreateModal.js
import React, { useState } from 'react'
import '../css/UserCreateModal.css'

export default function UserCreateModal({ isOpen, onClose, onCreateUser, roleOptions }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'adjuster',
    password: '',
    confirmPassword: '',
  })
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error message when user starts typing again
    if (errorMessage) setErrorMessage('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.')
      return
    }

    if (onCreateUser) {
      onCreateUser({
        username: formData.username,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      })
    }

    // Reset state & close
    setFormData({
      username: '',
      email: '',
      role: 'adjuster',
      password: '',
      confirmPassword: '',
    })
    setErrorMessage('')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-card-header">
          <div>
            <span className="modal-badge">User Management</span>
            <h2>Create New User</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errorMessage && (
            <div className="modal-error-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorMessage}
            </div>
          )}

          <div className="form-grid">
            <div className="form-row">
              <label htmlFor="username">Full Name</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="e.g. Jane Doe"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="e.g. jane@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row full-width">
              <label htmlFor="role">Assign Role</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange}>
                {roleOptions && roleOptions.length > 0 ? (
                  roleOptions.map(([key, details]) => (
                    <option key={key} value={key}>
                      {details.label || key}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="adjuster">Claims Adjuster</option>
                    <option value="reviewer">Medical Reviewer</option>
                    <option value="admin">Administrator</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="confirmPassword">Re-enter Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="modal-card-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}