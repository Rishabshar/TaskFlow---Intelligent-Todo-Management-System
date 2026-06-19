import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
            <p className="text-slate-400">Create your account and get started today</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  👤
                </span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900 border ${validationErrors.name ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  disabled={loading}
                />
              </div>
              {validationErrors.name && <p className="mt-1 text-xs text-red-500">{validationErrors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  ✉️
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-900 border ${validationErrors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  disabled={loading}
                />
              </div>
              {validationErrors.email && <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-slate-900 border ${validationErrors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  🔒
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-slate-900 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  disabled={loading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{validationErrors.confirmPassword}</p>}
            </div>

            {/* General Server Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Terms Checkbox */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                    type="checkbox"
                    id="terms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-700"
                    disabled={loading}
                />
              </div>
              <div className="ml-3 text-sm">
                <label 
                    htmlFor="terms" 
                    className={`font-medium ${validationErrors.acceptTerms ? 'text-red-500' : 'text-slate-400'}`}
                >
                    I agree to the <span className="text-indigo-400">Terms & Conditions</span>
                </label>
                {validationErrors.acceptTerms && <p className="mt-1 text-xs text-red-500">{validationErrors.acceptTerms}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit" 
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              disabled={loading || isFormInvalid} 
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>

            {/* Login Link */}
            <p className="text-center text-slate-400 text-sm">
              Already have an account? <Link to="/signin" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">Sign in</Link>
            </p>
          </form>

          {/* Success Message */}
          {submitted && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
              Account created successfully! 🎉 Redirecting to signin...
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-slate-900/50 text-center border-t border-slate-700">
          <p className="text-xs text-slate-500">
            We respect your privacy. Your data is secure with us.
          </p>
        </div>
      </div>
    </div>
  );
}