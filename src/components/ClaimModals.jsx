import React, { memo } from 'react'
import Modal from './Modal'

function ClaimModals({
  editModalOpen,
  editDraft,
  closeEditModal,
  saveEdit,
  setEditDraft,
  assignModalOpen,
  assignDraft,
  closeAssignModal,
  saveAssign,
  setAssignDraft,
  claims,
  splitModalOpen,
  setSplitModalOpen,
  splitSize,
  setSplitSize,
  splitPreview,
  confirmSplit,
  mergeModalOpen,
  setMergeModalOpen,
  mergePreview,
  mergeSelection,
  toggleMergeSelection,
  confirmMerge,
  assignActionLabel = 'Assign',
}) {
  return (
    <>
      {editModalOpen && editDraft ? (
        <Modal
          title="Edit claim"
          onClose={closeEditModal}
          footer={(
            <>
              <button type="button" className="secondary" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="primary" onClick={saveEdit}>Save changes</button>
            </>
          )}
        >
          <label>Claimant</label>
          <input value={editDraft.claimant} onChange={(e) => setEditDraft((d) => ({ ...d, claimant: e.target.value }))} />
          <label>Policy</label>
          <input value={editDraft.policy} onChange={(e) => setEditDraft((d) => ({ ...d, policy: e.target.value }))} />
          <label>Assignee</label>
          <input value={editDraft.assignee} onChange={(e) => setEditDraft((d) => ({ ...d, assignee: e.target.value }))} />
          <label>Status</label>
          <select value={editDraft.status} onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}>
            {['Pending', 'In Review', 'Approved', 'Rejected'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Modal>
      ) : null}

      {assignModalOpen && assignDraft ? (
        <Modal
          title={`${assignActionLabel} claim`}
          onClose={closeAssignModal}
          footer={(
            <>
              <button type="button" className="secondary" onClick={closeAssignModal}>Cancel</button>
              <button type="button" className="primary" onClick={saveAssign}>{assignActionLabel === 'Re-assign' ? 'Save reassignment' : 'Save assignment'}</button>
            </>
          )}
        >
          <label>Assignee</label>
          <select value={assignDraft.assignee} onChange={(e) => setAssignDraft((d) => ({ ...d, assignee: e.target.value }))}>
            {Array.from(new Set(claims.map((c) => c.assignee))).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Modal>
      ) : null}

      {splitModalOpen ? (
        <Modal
          title="Split preview"
          onClose={() => setSplitModalOpen(false)}
          footer={(
            <>
              <button type="button" className="secondary" onClick={() => setSplitModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="primary"
                onClick={confirmSplit}
                disabled={splitPreview.length < 2}
                title={splitPreview.length < 2 ? 'Split would produce a single package' : ''}
              >
                Confirm split
              </button>
            </>
          )}
          note={splitPreview.length < 2 ? 'This split would produce a single document - no structural change will occur.' : ''}
        >
          <label>Pages per document</label>
          <input type="number" min={1} value={splitSize} onChange={(e) => setSplitSize(Number(e.target.value) || 1)} />
          <p>Document will be split into <strong>{splitPreview.length}</strong> Documents.</p>
          <ul className="split-preview-list">
            {splitPreview.map((pkg, idx) => (
              <li key={idx}>Document {idx + 1}: {pkg.length} pages</li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {mergeModalOpen ? (
        <Modal
          title="Merge preview"
          onClose={() => setMergeModalOpen(false)}
          footer={(
            <>
              <button type="button" className="secondary" onClick={() => setMergeModalOpen(false)}>Cancel</button>
              <button type="button" className="primary" onClick={confirmMerge}>Confirm merge</button>
            </>
          )}
        >
          <p>Select two or more documents to merge into a single document.</p>
          <ul className="split-preview-list">
            {mergePreview.map((pkg, idx) => (
              <li key={idx}>
                <label>
                  <input type="checkbox" checked={mergeSelection.includes(idx)} onChange={() => toggleMergeSelection(idx)} />
                  <strong> Document {idx + 1}:</strong> {pkg.length} pages
                </label>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </>
  )
}

export default memo(ClaimModals)