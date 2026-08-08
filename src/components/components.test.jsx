import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ClaimModals from './ClaimModals'
import ClaimsTable from './ClaimsTable'
import IconButton from './IconButton'
import Modal from './Modal'
import SummaryGrid from './SummaryGrid'
import Topbar from './Topbar'
import WorkspacePanel from './WorkspacePanel'
import { createClaims, createWorkspaceDoc } from '../test/fixtures'

describe('component smoke coverage', () => {
  it('renders topbar and updates the selected role', () => {
    const setRole = vi.fn()
    render(
      <Topbar
        role="adjuster"
        setRole={setRole}
        permissions={{ label: 'Adjuster' }}
        roleOptions={[
          ['adjuster', { label: 'Adjuster' }],
          ['reviewer', { label: 'Reviewer' }],
        ]}
      />,
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'reviewer' } })
    expect(setRole).toHaveBeenCalledWith('reviewer')
    expect(screen.getByText('Adjuster • RBAC active')).toBeInTheDocument()
  })

  it('renders the summary grid and formats values', () => {
    render(
      <SummaryGrid
        filteredClaims={createClaims(3)}
        selectedClaim={{ claimant: 'Claimant 1', status: 'Pending' }}
        workspaceDoc={{ totalPages: 19, sizeBytes: 1024 }}
        formatBytes={(value) => `${value} bytes`}
      />,
    )

    expect(screen.getByText('3 / 20,000+')).toBeInTheDocument()
    expect(screen.getByText('Claimant 1')).toBeInTheDocument()
    expect(screen.getByText('1024 bytes')).toBeInTheDocument()
  })

  it('renders summary fallbacks when claim and document data are absent', () => {
    render(
      <SummaryGrid
        filteredClaims={[]}
        selectedClaim={null}
        workspaceDoc={null}
        formatBytes={(value) => `${value} bytes`}
      />,
    )

    expect(screen.getByText('0 / 20,000+')).toBeInTheDocument()
    expect(screen.getByText('No claim')).toBeInTheDocument()
    expect(screen.getByText('N/A')).toBeInTheDocument()
    expect(screen.getByText('0 pages')).toBeInTheDocument()
  })

  it('renders modal shells and icon buttons', () => {
    const onClose = vi.fn()
    const onClick = vi.fn()

    render(
      <>
        <Modal title="Edit claim" onClose={onClose} footer={<div>footer</div>} note="note text">
          <span>body content</span>
        </Modal>
        <IconButton icon="edit" onClick={onClick} ariaLabel="Edit item" title="Edit" />
      </>,
    )

    fireEvent.click(screen.getByText('Close'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit item' }))

    expect(onClose).toHaveBeenCalled()
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText('note text')).toBeInTheDocument()
  })

  it('renders the claims table and forwards row actions', () => {
    const claims = createClaims(3)
    const setSearch = vi.fn()
    const setStatusFilter = vi.fn()
    const handleSort = vi.fn()
    const setSelectedClaimId = vi.fn()
    const setScrollTop = vi.fn()
    const handleEditClick = vi.fn()
    const handleDeleteClick = vi.fn()
    const handleAssignClick = vi.fn()
    const loadMoreClaims = vi.fn()

    render(
      <ClaimsTable
        search=""
        setSearch={setSearch}
        statusFilter="All"
        setStatusFilter={setStatusFilter}
        statuses={['Pending', 'In Review']}
        handleSort={handleSort}
        totalHeight={162}
        spacerTop={0}
        spacerBottom={0}
        visibleClaims={claims}
        selectedClaim={claims[0]}
        setSelectedClaimId={setSelectedClaimId}
        setScrollTop={setScrollTop}
        loadMoreClaims={loadMoreClaims}
        loadedClaimCount={3}
        totalClaims={20}
        permissions={{ canEdit: true, canDelete: true, canAssign: true }}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        handleAssignClick={handleAssignClick}
      />,
    )

    fireEvent.change(screen.getByLabelText('Search claims'), { target: { value: 'claimant' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Pending' } })
    fireEvent.click(screen.getByText('Risk'))
    fireEvent.click(screen.getByText(claims[1].claimant))
    fireEvent.keyDown(screen.getByText(claims[1].claimant).closest('.table-row'), { key: 'Enter' })
    const tableBody = screen.getByRole('button', { name: `Edit ${claims[0].claimant}` }).closest('.table-shell').querySelector('.table-body')
    Object.defineProperty(tableBody, 'scrollHeight', { value: 600, configurable: true })
    Object.defineProperty(tableBody, 'clientHeight', { value: 100, configurable: true })
    fireEvent.scroll(tableBody, { target: { scrollTop: 500 } })
    fireEvent.click(screen.getByRole('button', { name: `Edit ${claims[0].claimant}` }))
    fireEvent.click(screen.getByRole('button', { name: `Delete ${claims[0].claimant}` }))
    fireEvent.click(screen.getByRole('button', { name: `Assign ${claims[0].claimant}` }))

    expect(setSearch).toHaveBeenCalledWith('claimant')
    expect(setStatusFilter).toHaveBeenCalledWith('Pending')
    expect(handleSort).toHaveBeenCalledWith('riskScore')
    expect(setSelectedClaimId).toHaveBeenCalledWith(claims[1].id)
    expect(loadMoreClaims).toHaveBeenCalled()
    expect(handleEditClick).toHaveBeenCalled()
    expect(handleDeleteClick).toHaveBeenCalled()
    expect(handleAssignClick).toHaveBeenCalled()
  })

  it('renders claim modal variations', () => {
    const claims = createClaims(2)
    const setEditDraft = vi.fn()

    const { rerender } = render(
      <ClaimModals
        editModalOpen
        editDraft={{ id: 1, claimant: 'A', policy: 'P', assignee: 'J', status: 'Pending' }}
        closeEditModal={vi.fn()}
        saveEdit={vi.fn()}
        setEditDraft={setEditDraft}
        assignModalOpen={false}
        assignDraft={null}
        closeAssignModal={vi.fn()}
        saveAssign={vi.fn()}
        setAssignDraft={vi.fn()}
        claims={claims}
        splitModalOpen={false}
        setSplitModalOpen={vi.fn()}
        splitSize={2}
        setSplitSize={vi.fn()}
        splitPreview={[]}
        confirmSplit={vi.fn()}
        mergeModalOpen={false}
        setMergeModalOpen={vi.fn()}
        mergePreview={[]}
        mergeSelection={[]}
        toggleMergeSelection={vi.fn()}
        confirmMerge={vi.fn()}
      />,
    )

    expect(screen.getByText('Edit claim')).toBeInTheDocument()

    rerender(
      <ClaimModals
        editModalOpen={false}
        editDraft={null}
        closeEditModal={vi.fn()}
        saveEdit={vi.fn()}
        setEditDraft={vi.fn()}
        assignModalOpen
        assignDraft={{ id: 1, assignee: 'J. Flores' }}
        closeAssignModal={vi.fn()}
        saveAssign={vi.fn()}
        setAssignDraft={vi.fn()}
        claims={claims}
        splitModalOpen
        setSplitModalOpen={vi.fn()}
        splitSize={2}
        setSplitSize={vi.fn()}
        splitPreview={[[1, 2], [3, 4]]}
        confirmSplit={vi.fn()}
        mergeModalOpen
        setMergeModalOpen={vi.fn()}
        mergePreview={[[{ id: 1 }], [{ id: 2 }]]}
        mergeSelection={[0]}
        toggleMergeSelection={vi.fn()}
        confirmMerge={vi.fn()}
      />,
    )

    expect(screen.getByText('Assign claim')).toBeInTheDocument()
    expect(screen.getByText('Split preview')).toBeInTheDocument()
    expect(screen.getByText('Merge preview')).toBeInTheDocument()
  })

  it('fires modal field handlers and merge selection callbacks', () => {
    const closeEditModal = vi.fn()
    const saveEdit = vi.fn()
    const setEditDraft = vi.fn()
    const closeAssignModal = vi.fn()
    const saveAssign = vi.fn()
    const setAssignDraft = vi.fn()
    const setSplitModalOpen = vi.fn()
    const setSplitSize = vi.fn()
    const confirmSplit = vi.fn()
    const setMergeModalOpen = vi.fn()
    const toggleMergeSelection = vi.fn()
    const confirmMerge = vi.fn()

    render(
      <ClaimModals
        editModalOpen
        editDraft={{ id: 1, claimant: 'A', policy: 'P', assignee: 'J', status: 'Pending' }}
        closeEditModal={closeEditModal}
        saveEdit={saveEdit}
        setEditDraft={setEditDraft}
        assignModalOpen
        assignDraft={{ id: 1, assignee: 'J. Flores' }}
        closeAssignModal={closeAssignModal}
        saveAssign={saveAssign}
        setAssignDraft={setAssignDraft}
        claims={createClaims(2)}
        splitModalOpen
        setSplitModalOpen={setSplitModalOpen}
        splitSize={2}
        setSplitSize={setSplitSize}
        splitPreview={[[1], [2]]}
        confirmSplit={confirmSplit}
        mergeModalOpen
        setMergeModalOpen={setMergeModalOpen}
        mergePreview={[[{ id: 1 }], [{ id: 2 }]]}
        mergeSelection={[0]}
        toggleMergeSelection={toggleMergeSelection}
        confirmMerge={confirmMerge}
      />,
    )

    fireEvent.change(screen.getByDisplayValue('A'), { target: { value: 'Alex' } })
    fireEvent.change(screen.getByDisplayValue('P'), { target: { value: 'POL-1' } })
    fireEvent.change(screen.getByDisplayValue('J'), { target: { value: 'Jordan' } })
    fireEvent.change(screen.getByDisplayValue('Pending'), { target: { value: 'Approved' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    fireEvent.change(screen.getByDisplayValue('J. Flores'), { target: { value: 'M. Patel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save assignment' }))
    fireEvent.change(screen.getByDisplayValue(2), { target: { value: '3' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[2])
    fireEvent.click(screen.getByRole('button', { name: 'Confirm split' }))
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    fireEvent.click(screen.getByRole('button', { name: 'Confirm merge' }))

    expect(setEditDraft).toHaveBeenCalled()
    expect(saveEdit).toHaveBeenCalled()
    expect(setAssignDraft).toHaveBeenCalled()
    expect(saveAssign).toHaveBeenCalled()
    expect(setSplitSize).toHaveBeenCalledWith(3)
    expect(setSplitModalOpen).toHaveBeenCalledWith(false)
    expect(confirmSplit).toHaveBeenCalled()
    expect(toggleMergeSelection).toHaveBeenCalledWith(1)
    expect(confirmMerge).toHaveBeenCalled()
  })

  it('renders the workspace panel and triggers key actions', () => {
    const openSplitPreview = vi.fn()
    const openMergePreview = vi.fn()
    const handlePageDelete = vi.fn()
    const openEditModal = vi.fn()
    const openAssignModal = vi.fn()
    const approveSelectedClaim = vi.fn()
    const rejectSelectedClaim = vi.fn()
    const handleOperation = vi.fn()
    const setSelectedPage = vi.fn()
    const setCurrentPackageIndex = vi.fn()
    const setCommentDraft = vi.fn()
    const handleAddComment = vi.fn()
    const workspaceDoc = createWorkspaceDoc({
      packages: [
        [{ id: 1, label: 'Page 1', comments: ['C'] }],
        [{ id: 2, label: 'Page 2', comments: [] }],
      ],
    })

    render(
      <WorkspacePanel
        selectedClaim={{ claimant: 'Claimant 1' }}
        workspaceDoc={workspaceDoc}
        formatBytes={(value) => `${value} bytes`}
        docProgress={100}
        docLoading={false}
        permissions={{ label: 'Admin', canSplit: true, canMerge: true, canDelete: true, canEdit: true, canAssign: true, canReview: true }}
        openSplitPreview={openSplitPreview}
        openMergePreview={openMergePreview}
        canMergeNow
        availablePackageCount={2}
        handlePageDelete={handlePageDelete}
        openEditModal={openEditModal}
        openAssignModal={openAssignModal}
        approveSelectedClaim={approveSelectedClaim}
        rejectSelectedClaim={rejectSelectedClaim}
        lastSplitBackup={{}}
        undoSplit={vi.fn()}
        lastMergeBackup={{}}
        undoMerge={vi.fn()}
        operationState={{ status: 'failed', label: 'split', progress: 50 }}
        cancelOperation={vi.fn()}
        lastError="Boom"
        handleOperation={handleOperation}
        currentPackageIndex={0}
        setCurrentPackageIndex={setCurrentPackageIndex}
        setSelectedPage={setSelectedPage}
        selectedPage={null}
        selectedPageData={null}
        commentDraft="hello"
        setCommentDraft={setCommentDraft}
        handleAddComment={handleAddComment}
        feedback="All good"
      />,
    )

    fireEvent.click(screen.getByText('Split'))
    fireEvent.click(screen.getByText('Merge'))
    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Assign'))
    fireEvent.click(screen.getByText('Pkg 2 (1)'))
    fireEvent.change(screen.getByPlaceholderText('Add a claimant-level comment'), { target: { value: 'updated' } })
    fireEvent.click(screen.getByText('Save comment'))
    fireEvent.click(screen.getByText('Retry'))

    expect(openSplitPreview).toHaveBeenCalled()
    expect(openMergePreview).toHaveBeenCalled()
    expect(handlePageDelete).toHaveBeenCalled()
    expect(openEditModal).toHaveBeenCalled()
    expect(openAssignModal).toHaveBeenCalled()
    expect(setCurrentPackageIndex).toHaveBeenCalledWith(1)
    expect(setSelectedPage).toHaveBeenCalledWith(2)
    expect(setCommentDraft).toHaveBeenCalledWith('updated')
    expect(handleAddComment).toHaveBeenCalled()
    expect(handleOperation).toHaveBeenCalledWith('split')
  })

  it('renders workspace empty states and cancel action for loading scenarios', () => {
    const cancelOperation = vi.fn()

    render(
      <WorkspacePanel
        selectedClaim={null}
        workspaceDoc={createWorkspaceDoc({ pages: [{ id: 1, label: 'Page 1', comments: [] }], packages: undefined, history: [] })}
        formatBytes={(value) => `${value} bytes`}
        docProgress={40}
        docLoading
        permissions={{ canSplit: false, canMerge: false, canAssign: false, canReview: false }}
        openSplitPreview={vi.fn()}
        openMergePreview={vi.fn()}
        canMergeNow={false}
        availablePackageCount={1}
        handlePageDelete={vi.fn()}
        openEditModal={vi.fn()}
        openAssignModal={vi.fn()}
        approveSelectedClaim={vi.fn()}
        rejectSelectedClaim={vi.fn()}
        lastSplitBackup={null}
        undoSplit={vi.fn()}
        lastMergeBackup={null}
        undoMerge={vi.fn()}
        operationState={{ status: 'running', label: 'merge', progress: 25 }}
        cancelOperation={cancelOperation}
        lastError=""
        handleOperation={vi.fn()}
        currentPackageIndex={0}
        setCurrentPackageIndex={vi.fn()}
        setSelectedPage={vi.fn()}
        selectedPage={null}
        selectedPageData={{ comments: [] }}
        commentDraft=""
        setCommentDraft={vi.fn()}
        handleAddComment={vi.fn()}
        feedback="Busy"
      />,
    )

    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
    expect(screen.getByText('Streaming 40%')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(cancelOperation).toHaveBeenCalled()
  })

  it('clears selected page when clicking outside page cards', () => {
    const setSelectedPage = vi.fn()

    render(
      <WorkspacePanel
        selectedClaim={{ claimant: 'Claimant 1' }}
        workspaceDoc={createWorkspaceDoc()}
        formatBytes={(value) => `${value} bytes`}
        docProgress={100}
        docLoading={false}
        permissions={{ label: 'Admin', canSplit: true, canMerge: true, canDelete: true, canEdit: true, canAssign: true, canReview: true }}
        openSplitPreview={vi.fn()}
        openMergePreview={vi.fn()}
        canMergeNow={false}
        availablePackageCount={1}
        handlePageDelete={vi.fn()}
        openEditModal={vi.fn()}
        openAssignModal={vi.fn()}
        approveSelectedClaim={vi.fn()}
        rejectSelectedClaim={vi.fn()}
        lastSplitBackup={null}
        undoSplit={vi.fn()}
        lastMergeBackup={null}
        undoMerge={vi.fn()}
        operationState={{ status: 'idle', label: '', progress: 0 }}
        cancelOperation={vi.fn()}
        lastError=""
        handleOperation={vi.fn()}
        currentPackageIndex={0}
        setCurrentPackageIndex={vi.fn()}
        setSelectedPage={setSelectedPage}
        selectedPage={1}
        selectedPageData={{ comments: [] }}
        commentDraft=""
        setCommentDraft={vi.fn()}
        handleAddComment={vi.fn()}
        feedback="Ready"
      />,
    )

    fireEvent.click(screen.getByRole('heading', { name: 'Comments' }))

    expect(setSelectedPage).toHaveBeenCalledWith(null)
  })

  it('keeps selected page when clicking in the common comment box', () => {
    const setSelectedPage = vi.fn()

    render(
      <WorkspacePanel
        selectedClaim={{ claimant: 'Claimant 1' }}
        workspaceDoc={createWorkspaceDoc()}
        formatBytes={(value) => `${value} bytes`}
        docProgress={100}
        docLoading={false}
        permissions={{ label: 'Admin', canSplit: true, canMerge: true, canDelete: true, canEdit: true, canAssign: true, canReview: true }}
        openSplitPreview={vi.fn()}
        openMergePreview={vi.fn()}
        canMergeNow={false}
        availablePackageCount={1}
        handlePageDelete={vi.fn()}
        openEditModal={vi.fn()}
        openAssignModal={vi.fn()}
        approveSelectedClaim={vi.fn()}
        rejectSelectedClaim={vi.fn()}
        lastSplitBackup={null}
        undoSplit={vi.fn()}
        lastMergeBackup={null}
        undoMerge={vi.fn()}
        operationState={{ status: 'idle', label: '', progress: 0 }}
        cancelOperation={vi.fn()}
        lastError=""
        handleOperation={vi.fn()}
        currentPackageIndex={0}
        setCurrentPackageIndex={vi.fn()}
        setSelectedPage={setSelectedPage}
        selectedPage={1}
        selectedPageData={{ comments: [] }}
        commentDraft=""
        setCommentDraft={vi.fn()}
        handleAddComment={vi.fn()}
        feedback="Ready"
      />,
    )

    fireEvent.click(screen.getByPlaceholderText('Add a page-level comment'))

    expect(setSelectedPage).not.toHaveBeenCalled()
  })

  it('renders only workspace actions allowed for the current role', () => {
    render(
      <WorkspacePanel
        selectedClaim={{ claimant: 'Claimant 1' }}
        workspaceDoc={createWorkspaceDoc()}
        formatBytes={(value) => `${value} bytes`}
        docProgress={100}
        docLoading={false}
        permissions={{ label: 'Reviewer', canSplit: false, canMerge: false, canDelete: false, canEdit: false, canAssign: true, canReview: true }}
        openSplitPreview={vi.fn()}
        openMergePreview={vi.fn()}
        canMergeNow={false}
        availablePackageCount={1}
        handlePageDelete={vi.fn()}
        openEditModal={vi.fn()}
        openAssignModal={vi.fn()}
        approveSelectedClaim={vi.fn()}
        rejectSelectedClaim={vi.fn()}
        lastSplitBackup={null}
        undoSplit={vi.fn()}
        lastMergeBackup={null}
        undoMerge={vi.fn()}
        operationState={{ status: 'idle', label: '', progress: 0 }}
        cancelOperation={vi.fn()}
        lastError=""
        handleOperation={vi.fn()}
        currentPackageIndex={0}
        setCurrentPackageIndex={vi.fn()}
        setSelectedPage={vi.fn()}
        selectedPage={null}
        selectedPageData={{ comments: [] }}
        commentDraft=""
        setCommentDraft={vi.fn()}
        handleAddComment={vi.fn()}
        feedback="Assigned"
      />,
    )

    expect(screen.queryByText('Assign')).not.toBeInTheDocument()
    expect(screen.getByText('Re-assign')).toBeInTheDocument()
    expect(screen.getByText('Approve')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()
    expect(screen.queryByText('Split')).not.toBeInTheDocument()
    expect(screen.queryByText('Merge')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('uses reassignment labels in the modal for reviewer flows', () => {
    render(
      <ClaimModals
        editModalOpen={false}
        editDraft={null}
        closeEditModal={vi.fn()}
        saveEdit={vi.fn()}
        setEditDraft={vi.fn()}
        assignModalOpen
        assignDraft={{ id: 1, assignee: 'J. Flores' }}
        closeAssignModal={vi.fn()}
        saveAssign={vi.fn()}
        setAssignDraft={vi.fn()}
        assignActionLabel="Re-assign"
        claims={createClaims(2)}
        splitModalOpen={false}
        setSplitModalOpen={vi.fn()}
        splitSize={2}
        setSplitSize={vi.fn()}
        splitPreview={[]}
        confirmSplit={vi.fn()}
        mergeModalOpen={false}
        setMergeModalOpen={vi.fn()}
        mergePreview={[]}
        mergeSelection={[]}
        toggleMergeSelection={vi.fn()}
        confirmMerge={vi.fn()}
      />,
    )

    expect(screen.getByText('Re-assign claim')).toBeInTheDocument()
    expect(screen.getByText('Save reassignment')).toBeInTheDocument()
  })
})