/**
 * Decodes standard Base64URL encoded JWT sections
 */
const base64UrlDecode = (str) => {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    return atob(base64)
  } catch (e) {
    return null
  }
}

/**
 * Base64URL Encoder Helper
 */
const base64UrlEncode = (str) => {
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/**
 * Validates JWT token structure and checks expiration & issuance claims
 * @param {string} token - The JWT string to validate
 * @returns {object} { isValid: boolean, payload: object|null, error: string|null }
 */
export const validateJwtToken = (token) => {
  if (!token || typeof token !== 'string') {
    return { isValid: false, payload: null, error: 'Token is required' }
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return { isValid: false, payload: null, error: 'Invalid token structure' }
  }

  const [, payloadB64] = parts

  // Decode Payload
  const decodedPayload = base64UrlDecode(payloadB64)
  if (!decodedPayload) {
    return { isValid: false, payload: null, error: 'Failed to decode token payload' }
  }

  try {
    const payload = JSON.parse(decodedPayload)
    const nowInSeconds = Math.floor(Date.now() / 1000)

    // Expiration check
    if (payload.exp && payload.exp < nowInSeconds) {
      return { isValid: false, payload, error: 'Token has expired' }
    }

    // Issued At (iat) sanity check
    if (payload.iat && payload.iat > nowInSeconds) {
      return { isValid: false, payload, error: 'Token issued in the future' }
    }

    return { isValid: true, payload, error: null }
  } catch (err) {
    return { isValid: false, payload: null, error: 'Malformed JSON payload' }
  }
}

/**
 * Generates a mock JWT Token (Header.Payload.Signature)
 * @param {object} user - User payload containing id, email, username, role
 * @param {number} expiresInSeconds - Token duration in seconds (default: 3600 / 1 hour)
 * @returns {string} Encoded JWT token string
 */
export const generateMockJWT = (user, expiresInSeconds = 3600) => {
  // 1. Header
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  // 2. Payload with Standard Claims (iat, exp, sub)
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    iat: now,                          // Issued At timestamp
    exp: now + expiresInSeconds,       // Expiration timestamp
  }

  // 3. Encode Header and Payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  // 4. Create Mock Signature
  const mockSignature = base64UrlEncode(`mock_signature_${user.id}_${now}`)

  // 5. Combine into standard JWT format: Header.Payload.Signature
  return `${encodedHeader}.${encodedPayload}.${mockSignature}`
}