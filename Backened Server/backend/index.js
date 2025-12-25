



// ============================================
// PRODUCTION-READY AUTH WITH MYSQL DATABASE
// ============================================

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import sequelize from "./config/database.js";
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

app.use(express.json());

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
// SIGNUP ENDPOINT
// ============================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user in database
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isActive: true,
      lastLogin: null
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
// SIGNIN ENDPOINT
// ============================================

app.post("/api/auth/signin", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user in database
    const user = await User.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
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
// REFRESH TOKEN ENDPOINT
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
// GET USER PROFILE (Protected Route)
// ============================================

app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
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
// TODO ENDPOINTS
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
// LOGOUT ENDPOINT
// ============================================

app.post("/api/auth/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ============================================
// DATABASE SYNC & START SERVER
// ============================================

const PORT = 5000;

// Sync database and start server
sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📁 Database: todo_app_db`);
      console.log(`🔌 MySQL Connected`);
    });
  })
  .catch(err => {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  });