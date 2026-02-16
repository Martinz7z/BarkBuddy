import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage = ({ onGoToRegister, onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'basic'
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Login successful:', formData);
      if (onLogin) {
        onLogin(formData.email, formData.password, formData.userType);
      }
    } catch (error) {
      setErrors({ submit: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUserTypeChange = (type) => {
    setFormData(prev => ({ ...prev, userType: type }));
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xl">🐕</span>
            </div>
            <h1 className="text-2xl font-heading font-semibold text-text">Bark Buddy</h1>
          </div>
          <h2 className="text-2xl font-heading font-semibold text-text mb-2">
            Welcome Back
          </h2>
          <p className="text-muted text-sm">
            Sign in to your Bark Buddy account
          </p>
        </div>

        {/* User Type Selection */}
        <div className="flex gap-2 mb-6 bg-card rounded-card p-1 shadow-card">
          <button
            type="button"
            onClick={() => handleUserTypeChange('basic')}
            className={`flex-1 py-3 rounded-button transition-all ${
              formData.userType === 'basic'
                ? 'bg-primary text-white shadow-button'
                : 'text-muted hover:text-primary'
            }`}
          >
            Basic User
          </button>
          <button
            type="button"
            onClick={() => handleUserTypeChange('shelter')}
            className={`flex-1 py-3 rounded-button transition-all ${
              formData.userType === 'shelter'
                ? 'bg-primary text-white shadow-button'
                : 'text-muted hover:text-primary'
            }`}
          >
            Shelter
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 bg-white border rounded-input focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.email ? 'border-error' : 'border-border'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-3 bg-white border rounded-input focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.password ? 'border-error' : 'border-border'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              className="text-primary text-sm font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-error/10 border border-error rounded-input">
              <p className="text-error text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-button hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-button"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-muted text-sm">
            Don't have an account?{' '}
            <button
              onClick={onGoToRegister}
              className="text-primary font-medium hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;