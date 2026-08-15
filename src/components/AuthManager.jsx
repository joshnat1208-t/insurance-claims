import React, { useEffect, useState } from 'react'
import Login from './Login'
import { ROLE_PERMISSIONS } from '../claimsData'
import { AuthLogin } from '../api/AuthLogin'

export default function AuthManager({
  children,
  user,
  setUser,
  setRole,
  isAuthenticated,
  setIsAuthenticated,
  showToast,
}) {
  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const checkTokenValidation = async () => {
      const token = localStorage.getItem('auth_token')

      if (!token) {
        setIsAuthenticated(false)
        setAuthChecking(false)
        return
      }

      try {
        // Real API call to verify token with backend server
        const payload = await AuthLogin.verifyToken(token)

        setUser((prevUser) => prevUser || {
          id: payload.sub || payload.id,
          email: payload.email,
          username: payload.username || (payload.email ? payload.email.split('@')[0] : 'user'),
          role: payload.role,
        })
        setRole(payload.role || 'admin')
        setIsAuthenticated(true)
      } catch (err) {
        console.warn('JWT Token validation failed or expired:', err.message)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setAuthChecking(false)
      }
    }

    checkTokenValidation()
  }, [setUser, setRole, setIsAuthenticated])

  const handleLogin = async ({ email, password, role: selectedRole }) => {
    try {
      console.log('Attempting API Login call...')
      const response = await AuthLogin.login(email, password, selectedRole)
      
      const userData = response?.user
      const token = response?.token

      if (token) {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_data', JSON.stringify(userData))
        setUser(userData)
        setRole(userData?.role || selectedRole)
        setIsAuthenticated(true)
      } else {
        throw new Error('No authentication token received from backend.')
      }
    } catch (err) {
      console.error('Login error:', err)
      if (typeof showToast === 'function') {
        showToast(`Login failed: ${err.message}`, 'error')
      }
    }
  }

  if (authChecking) {
    return <div className="loading-spinner">Validating session...</div>
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} roleOptions={Object.entries(ROLE_PERMISSIONS)} />
  }

  return children
}