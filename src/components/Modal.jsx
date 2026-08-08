import React from 'react'

export default function Modal({ title, onClose, footer, note, children }) {
	return (
		<div className="modal-backdrop" role="dialog" aria-modal="true">
			<div className="modal">
				<div className="modal-header">
					<h3>{title}</h3>
					<button type="button" className="ghost" onClick={onClose}>Close</button>
				</div>
				<div className="modal-body">{children}</div>
				{footer ? <div className="modal-footer">{footer}</div> : null}
				{note ? <div className="modal-note">{note}</div> : null}
			</div>
		</div>
	)
}
