import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signin.css";

const API_URL = "http://localhost:5000";

export default function Signin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    setError("");

    // Frontend validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signin failed");
        setLoading(false);
        return;
      }

      // Success - Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSubmitted(true);
      setFormData({ email: "", password: "" });

      // Redirect to todo page after 1.5 seconds
      setTimeout(() => {
        navigate("/todo");
      }, 1500);
    } catch (error) {
      setError("Server error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      {/* Animated background elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="signin-wrapper">
        {/* Card Container */}
        <div className="signin-card">
          {/* Header */}
          <div className="signin-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="signin-form">
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
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  disabled={loading}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Remember Me & Forgot Password */}
            <div className="signin-options">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="remember"
                  className="checkbox-input"
                  disabled={loading}
                />
                <label htmlFor="remember" className="checkbox-label">
                  Remember me
                </label>
              </div>

              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Show forgot password modal or navigate
                  const email = prompt("Enter your email:");
                  if (email) {
                    fetch("http://localhost:5000/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    })
                      .then((res) => res.json())
                      .then((data) => alert(data.message));
                  }
                }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In →"}
            </button>

            {/* Signup Link */}
            <p className="signup-link">
              Don't have an account? <Link to="/signup">Create one</Link>
            </p>
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="success-message">
              Signed in successfully! 🎉 Redirecting...
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="footer-text">Your login is secure and encrypted.</p>
      </div>
    </div>
  );
}
