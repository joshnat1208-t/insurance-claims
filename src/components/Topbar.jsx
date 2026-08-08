import React from 'react'

export default function Topbar({ role, setRole, permissions, roleOptions }) {
  return (
    <header className="topbar">
      <div>
        <h1>ABC Insurance</h1>
      </div>
      <div className="topbar-actions">
        <label className="select-pill">
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            {roleOptions.map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}