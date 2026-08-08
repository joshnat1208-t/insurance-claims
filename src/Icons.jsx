import React from 'react'

export default function Icons() {
  return (
    <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <symbol id="icon-edit" viewBox="0 0 24 24">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#1650ae" />
        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#1650ae" />
      </symbol>
      <symbol id="icon-delete" viewBox="0 0 24 24">
        <path d="M3 6h18" stroke="#b74242" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#b74242" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 11v6M14 11v6" stroke="#b74242" strokeWidth="1.5" strokeLinecap="round" />
      </symbol>
      <symbol id="icon-assign" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="#1650ae" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M6 20c0-2.21 3.58-4 6-4s6 1.79 6 4" stroke="#1650ae" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </symbol>
    </svg>
  )
}
