import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Signup.css';

// Base URL for the backend API
const API_URL = 'http://localhost:5000';

// Regex for basic email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Regex for strong password: at least 8 characters, one uppercase, one lowercase, one number, one special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Signup() {
  const navigate = useNavigate();
  
  // State for visibility of password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // New: State for Terms & Conditions checkbox
    acceptTerms: false, 
  });

  // State for general server/submission error
  const [error, setError] = useState('');
  // State for specific field errors during frontend validation
  const [validationErrors, setValidationErrors] = useState({});
  // State for loading/submission status
  const [loading, setLoading] = useState(false);
  // State for successful submission (to show success message)
  const [submitted, setSubmitted] = useState(false);

  // --- Input Change Handler ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox change specifically
    if (type === 'checkbox') {
        setFormData({
            ...formData,
            [name]: checked
        });
    } else {
        setFormData({
            ...formData,
            [name]: value
        });
    }

    // Clear the specific validation error when the user starts typing/changing
    if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear general server error
    if (error) {
        setError('');
    }
  };

  // --- Frontend Validation Logic ---
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Name Validation
    if (!formData.name.trim()) {
        errors.name = 'Full Name is required.';
        isValid = false;
    }

    // Email Validation
    if (!formData.email.trim()) {
        errors.email = 'Email is required.';
        isValid = false;
    } else if (!EMAIL_REGEX.test(formData.email)) {
        errors.email = 'Invalid email format.';
        isValid = false;
    }

    // Password Validation
    if (!formData.password) {
        errors.password = 'Password is required.';
        isValid = false;
    } else if (!PASSWORD_REGEX.test(formData.password)) {
        errors.password = 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.';
        isValid = false;
    }

    // Confirm Password Validation
    if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirm Password is required.';
        isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
        isValid = false;
    }
    
    // Terms & Conditions Validation
    if (!formData.acceptTerms) {
        errors.acceptTerms = 'You must agree to the Terms & Conditions.';
        isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };
  
  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // 1. Run frontend validation
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    setError('');
    setLoading(true);

    try {
      // 2. Call backend API
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Note: Backend typically expects `username` and `email` to be unique.
          username: formData.name, 
          email: formData.email,
          password: formData.password,
          // Sending confirmPassword to backend is usually redundant, but included for completeness if the backend uses it for final check
          confirmPassword: formData.confirmPassword 
        })
      });

      const data = await response.json();

      // 3. Handle server response
      if (!response.ok) {
        // Handle specific backend error messages (e.g., email already exists)
        setError(data.message || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      // 4. Success handling
      setSubmitted(true);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
      
      // Redirect to signin after 2 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 2000);

    } catch (err) {
      // 5. Handle network or server connection errors
      setError('A connection error occurred. Please check your network.');
      setLoading(false);
    }
  };

  // Determine if the submit button should be disabled for reasons other than 'loading'
  const isFormInvalid = 
    !!validationErrors.name ||
    !!validationErrors.email ||
    !!validationErrors.password ||
    !!validationErrors.confirmPassword ||
    !!validationErrors.acceptTerms ||
    !formData.acceptTerms;


  return (
    <div className="signup-container">
      {/* Animated background elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="signup-wrapper">
        {/* Card Container */}
        <div className="signup-card">
          
          {/* Header */}
          <div className="signup-header">
            <h1>Join Us</h1>
            <p>Create your account and get started today</p>
          </div>

          {/* Form */}
          <form className="signup-form" onSubmit={handleSubmit}>
            
            {/* Name Field */}
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
                  disabled={loading}
                />
              </div>
              {validationErrors.name && <p className="field-error">{validationErrors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                  disabled={loading}
                />
              </div>
              {validationErrors.email && <p className="field-error">{validationErrors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && <p className="field-error">{validationErrors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password"
                  disabled={loading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && <p className="field-error">{validationErrors.confirmPassword}</p>}
            </div>

            {/* General Server Error Message */}
            {error && (
              <div className="error-message">
                **Error:** {error}
              </div>
            )}

            {/* Terms Checkbox */}
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="terms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="checkbox-input"
                disabled={loading}
              />
              <label 
                htmlFor="terms" 
                className={`checkbox-label ${validationErrors.acceptTerms ? 'label-error' : ''}`}
              >
                I agree to the <span className="highlight">Terms & Conditions</span>
              </label>
              {validationErrors.acceptTerms && <p className="field-error checkbox-error">{validationErrors.acceptTerms}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit" // Changed to type="submit" for better form handling
              className="submit-btn"
              // Disable button if loading or if any field has a validation error
              disabled={loading || isFormInvalid} 
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>

            {/* Login Link */}
            <p className="login-link">
              Already have an account? <Link to="/signin">Sign in</Link>
            </p>
          </form>

          {/* Success Message */}
          {submitted && (
            <div className="success-message">
              Account created successfully! 🎉 Redirecting to signin...
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="footer-text">
          We respect your privacy. Your data is secure with us.
        </p>
      </div>
    </div>
  );
}