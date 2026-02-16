import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, Home } from 'lucide-react'

const RegisterPage = ({ onGoToLogin, onRegister }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('basic')

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate registration
    setTimeout(() => {
      setLoading(false)
      if (onRegister) {
        onRegister()
      }
    }, 1000)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>🐕</div>
          <h1 style={styles.title}>Bark Buddy</h1>
          <p style={styles.subtitle}>Create Account</p>
        </div>

        {/* User Type Selection */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabButton,
              ...(userType === 'basic' ? styles.tabButtonActive : {})
            }}
            onClick={() => setUserType('basic')}
          >
            <User size={16} style={{ marginRight: '8px' }} />
            Basic User
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(userType === 'shelter' ? styles.tabButtonActive : {})
            }}
            onClick={() => setUserType('shelter')}
          >
            <Home size={16} style={{ marginRight: '8px' }} />
            Shelter
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={20} style={styles.inputIcon} />
              <input
                type="email"
                style={styles.input}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={20} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                style={styles.input}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.showPasswordButton}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {userType === 'basic' && (
            <div style={styles.inputGroup}>
              <label>Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={20} style={styles.inputIcon} />
                <input
                  type="text"
                  style={styles.input}
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {userType === 'shelter' && (
            <div style={styles.inputGroup}>
              <label>Shelter Name</label>
              <div style={styles.inputWrapper}>
                <Home size={20} style={styles.inputIcon} />
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Happy Tails Rescue"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div style={styles.footer}>
          <p>
            Already have an account?{' '}
            <button onClick={onGoToLogin} style={styles.linkButton}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Reuse the same styles from LoginPage
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F5F1E3',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#6B8E23',
    margin: '0 auto 10px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333333',
    margin: '0 0 5px 0',
    fontFamily: 'Raleway, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#555B6E',
    margin: 0
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '4px',
    marginBottom: '24px',
    border: '1px solid rgba(107, 142, 35, 0.2)'
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#555B6E',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabButtonActive: {
    backgroundColor: '#6B8E23',
    color: 'white',
    boxShadow: '0 4px 12px rgba(107, 142, 35, 0.2)'
  },
  form: {
    marginBottom: '24px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  inputWrapper: {
    position: 'relative'
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#555B6E'
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid rgba(107, 142, 35, 0.2)',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none'
  },
  showPasswordButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#555B6E',
    cursor: 'pointer'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#6B8E23',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  footer: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#555B6E'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#6B8E23',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
}

export default RegisterPage