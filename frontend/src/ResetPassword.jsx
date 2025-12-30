import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
//import "./Signin.css"; // Reuse your existing styles

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage("✅ Password reset successfully! Redirecting...");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Server error");
    }
    setLoading(false);
  };

  return (
    <div className="signin-container">
      <div className="signin-wrapper">
        <div className="signin-card">
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
          
          <form onSubmit={handleSubmit} className="signin-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                minLength={6}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>
            
            {message && <div className={`message ${loading ? '' : 'error-message'}`}>{message}</div>}
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password →"}
            </button>
          </form>
          
          <p className="signup-link">
            Back to <a href="/signin">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
}
