import { buildClaims } from '../claimsData'

export function createWorkspaceDoc(overrides = {}) {
  return {
    title: 'Claimant 1 packet',
    totalPages: 4,
    sizeBytes: 640 * 1024 * 1024,
    status: 'Ready',
    claimComments: [],
    pages: [
      { id: 1, label: 'Page 1', comments: ['Needs policy confirmation'] },
      { id: 2, label: 'Page 2', comments: [] },
      { id: 3, label: 'Page 3', comments: [] },
      { id: 4, label: 'Page 4', comments: [] },
    ],
    history: ['Imported from SFTP queue', 'OCR completed'],
    ...overrides,
  }
}

export function createClaims(count = 6) {
  return buildClaims(count, 0)
}