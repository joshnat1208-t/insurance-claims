import { buildClaims, createDocumentSnapshot, formatBytes, RISK_LEVELS, STATUSES } from './claimsData'

describe('claimsData', () => {
  it('builds deterministic claims with sequential ids and cycled attributes', () => {
    const claims = buildClaims(4, 3)

    expect(claims).toHaveLength(4)
    expect(claims[0]).toMatchObject({
      id: 1003,
      claimant: 'Claimant 4',
      policy: 'POL-1003',
      status: STATUSES[3],
      riskLevel: RISK_LEVELS[3],
      assignee: 'M. Patel',
    })
    expect(claims[1].riskScore).toBe(78)
  })

  it('formats bytes across thresholds', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(5 * 1024)).toBe('5 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe('3.0 GB')
  })

  it('creates a document snapshot with page metadata and critical status handling', () => {
    const criticalSnapshot = createDocumentSnapshot({ id: 1004, claimant: 'Alex Doe', riskLevel: 'Critical' })
    const standardSnapshot = createDocumentSnapshot({ id: 1001, claimant: 'Jamie Doe', riskLevel: 'Low' })

    expect(criticalSnapshot.title).toBe('Alex Doe packet')
    expect(criticalSnapshot.status).toBe('Needs review')
    expect(criticalSnapshot.pages[0]).toMatchObject({
      id: 1,
      label: 'Page 1',
      comments: ['Needs policy confirmation'],
    })
    expect(standardSnapshot.status).toBe('Ready')
    expect(standardSnapshot.history).toEqual([
      'Imported from SFTP queue',
      'OCR completed',
      'Layout analysis ready',
    ])
  })
})