// ============================================
// PRODUCTION-READY AUTH WITH MYSQL DATABASE + PASSWORD RESET
// ============================================
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import crypto from "crypto";
import sequelize from "./config/database.js";
import { Op } from "sequelize";  // ✅ MOVED HERE - AFTER sequelize import
import User from "./models/User.js";
import Todo from "./models/Todo.js";


const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again later"
});

// NEW: Rate limit for forgot password (prevent spam)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per IP per windowMs
  message: "Too many forgot password requests, please try again later"
});

app.use(express.json());

// ============================================
// EMAIL CONFIGURATION (Update with your SMTP details)
// ============================================

const transporter = nodemailer.createTransport({
  // Gmail example (enable 2FA + App Password)
  service: 'gmail',
  auth: {
    user: 'rishab21062002@gmail.com', // ← CHANGE THIS
    pass: 'this vwck ypfa zwdk'     // ← CHANGE THIS (16-char App Password)
  }
  // OR use SendGrid, Mailgun, etc.
  // host: 'smtp.sendgrid.net',
  // auth: { user: 'apikey', pass: 'SG.your-sendgrid-api-key' }
});

// Test email config on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready');
  }
});

const BASE_URL = 'http://localhost:5173'; // Frontend URL

// ============================================
// TOKEN HELPER FUNCTIONS
// ============================================

const JWT_SECRET = "your-super-secret-jwt-key-12345";
const JWT_REFRESH_SECRET = "your-super-secret-refresh-key-12345";

function generateAccessToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

// NEW: Generate secure reset token (1 hour expiry)
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ============================================
// SIGNUP ENDPOINT (unchanged)
// ============================================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isActive: true,
      lastLogin: null,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser.id
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// ============================================
// SIGNIN ENDPOINT (unchanged)
// ============================================
app.post("/api/auth/signin", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      message: "Signed in successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Server error during signin" });
  }
});

// ============================================
// NEW: FORGOT PASSWORD ENDPOINT
// ============================================
app.post("/api/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      // Don't reveal if email exists (security)
      return res.json({ message: "If the email exists, check your inbox for reset instructions" });
    }

    // Generate secure reset token
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    // Save token to user (overwrite previous)
    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry
    });

    // Email template
    const resetUrl = `${BASE_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: '"Todo App" <your-email@gmail.com>',
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>Hello ${user.username},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          <p><small>This link expires in 1 hour.</small></p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: "If the email exists, check your inbox for reset instructions" 
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// NEW: RESET PASSWORD ENDPOINT
// ============================================

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords don't match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    // ✅ PERFECTLY CORRECT NOW:
    const user = await User.findOne({ 
      where: { 
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: Date.now() }  // ← Line 292 - FIXED
      } 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// REFRESH TOKEN ENDPOINT (unchanged)
// ============================================
app.post("/api/auth/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const newAccessToken = generateAccessToken(user.userId);
      res.json({ accessToken: newAccessToken });
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// GET USER PROFILE (unchanged)
// ============================================
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile fetched successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// TODO ENDPOINTS (unchanged)
// ============================================

// CREATE TODO
app.post("/api/todos", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Todo text is required" });
    }

    const todo = await Todo.create({
      text: text.trim(),
      completed: false,
      userId: req.user.userId
    });

    res.status(201).json({
      message: "Todo created successfully",
      todo
    });

  } catch (error) {
    console.error("Create todo error:", error);
    res.status(500).json({ message: "Server error creating todo" });
  }
});

// GET ALL TODOS FOR USER
app.get("/api/todos", authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: "Todos fetched successfully",
      todos
    });

  } catch (error) {
    console.error("Fetch todos error:", error);
    res.status(500).json({ message: "Server error fetching todos" });
  }
});

// UPDATE TODO
app.put("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    const { text, completed } = req.body;
    const todoId = req.params.id;

    const todo = await Todo.findOne({
      where: { id: todoId, userId: req.user.userId }
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    if (text !== undefined) todo.text = text;
    if (completed !== undefined) todo.completed = completed;

    await todo.save();

    res.json({
      message: "Todo updated successfully",
      todo
    });

  } catch (error) {
    console.error("Update todo error:", error);
    res.status(500).json({ message: "Server error updating todo" });
  }
});

// DELETE TODO
app.delete("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    const todoId = req.params.id;

    const todo = await Todo.findOne({
      where: { id: todoId, userId: req.user.userId }
    });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    await todo.destroy();

    res.json({
      message: "Todo deleted successfully"
    });

  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ message: "Server error deleting todo" });
  }
});

// ============================================
// LOGOUT ENDPOINT (unchanged)
// ============================================
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ============================================
// ERROR HANDLING (unchanged)
// ============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ============================================
// DATABASE SYNC & START SERVER
// ============================================

const PORT = 5000;

sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📁 Database: todo_app_db`);
      console.log(`🔌 MySQL Connected`);
      console.log(`📧 Password reset emails enabled`);
    });
  })
  .catch(err => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });
