// src/components/Topbar.js
import React, { useState, useRef, useEffect } from 'react'
import '../css/Topbar.css';

export default function Topbar({
  role,
  setRole,
  permissions,
  roleOptions,
  user,
  onLogout,
  onOpenCreateUser,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Explicit role determination from user object or role prop
  const activeRole = String(user?.role || role || '').toLowerCase().trim()
  const isAdmin = activeRole === 'admin'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>ABC Insurance</h1>
      </div>

      <div className="topbar-actions">
        {/* Profile Dropdown Container */}
        <div className="profile-menu-container" ref={dropdownRef}>
          <button
            type="button"
            className={`profile-trigger ${isAdmin ? 'admin-trigger' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-label="User profile menu"
          >
            <span className="profile-name">{role || 'User'}</span>
            <span className="dropdown-chevron">▾</span>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="profile-dropdown-menu">

              {/* Strict Admin check: Hidden for adjuster, reviewer, or any non-admin */}
              {isAdmin && typeof onOpenCreateUser === 'function' && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false)
                    onOpenCreateUser()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Create User
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  className="dropdown-item logout-item"
                  onClick={() => {
                    setDropdownOpen(false)
                    onLogout()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}