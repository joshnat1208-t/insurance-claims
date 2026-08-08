export const ROLE_PERMISSIONS = {
  adjuster: {
    label: 'Adjuster',
    canEdit: true,
    canDelete: false,
    canAssign: true,
    canMerge: true,
    canSplit: true,
    canReview: true,
  },
  reviewer: {
    label: 'Reviewer',
    canEdit: false,
    canDelete: false,
    canAssign: true,
    canMerge: false,
    canSplit: false,
    canReview: true,
  },
  admin: {
    label: 'Admin',
    canEdit: true,
    canDelete: true,
    canAssign: true,
    canMerge: true,
    canSplit: true,
    canReview: true,
  },
}

export const STATUSES = ['Pending', 'In Review', 'Approved', 'Rejected']
export const SOURCES = ['Email Intake', 'SFTP', 'Portal', 'Mobile']
export const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical']

export function buildClaims(count = 20000, startIndex = 0) {
  return Array.from({ length: count }, (_, offset) => {
    const index = startIndex + offset
    return {
      id: 1000 + index,
      claimant: `Claimant ${index + 1}`,
      policy: `POL-${1000 + index}`,
      status: STATUSES[index % STATUSES.length],
      riskLevel: RISK_LEVELS[index % RISK_LEVELS.length],
      riskScore: 55 + ((index * 17) % 45),
      assignee: index % 3 === 0 ? 'M. Patel' : index % 3 === 1 ? 'J. Flores' : 'K. Singh',
    }
  })
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function createDocumentSnapshot(claim) {
  const totalPages = 18 + (claim.id % 9)
  return {
    title: `${claim.claimant} packet`,
    totalPages,
    sizeBytes: 640 * 1024 * 1024 + (claim.id % 5) * 120 * 1024 * 1024,
    status: claim.riskLevel === 'Critical' ? 'Needs review' : 'Ready',
    claimComments: [],
    pages: Array.from({ length: totalPages }, (_, index) => ({
      id: index + 1,
      label: `Page ${index + 1}`,
      comments: index % 5 === 0 ? ['Needs policy confirmation'] : [],
    })),
    history: [
      'Imported from SFTP queue',
      'OCR completed',
      'Layout analysis ready',
    ],
  }
}