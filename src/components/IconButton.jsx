import React from 'react'

function IconButton({ icon, onClick, disabled, title, ariaLabel, dataId }) {
  return (
    <button
      type="button"
      className={`icon-button icon-only`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      data-id={dataId}
    >
      <svg width="16" height="16" aria-hidden>
        <use href={`#icon-${icon}`} />
      </svg>
    </button>
  )
}

export default React.memo(IconButton)
