const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  fullName: String,
  username: {
    type: String,
    unique: true
  },
  email: String,
  password: String,
  balance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    default: "customer"
  }
});

const User = mongoose.model("User", userSchema);

// Home Route
app.get("/", (req, res) => {
  res.json({
    bank: "NovaTrust Bank",
    status: "Running",
    message: "Welcome to NovaTrust Bank API"
  });
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const exists = await User.findOne({ username });

    if (exists) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({
      message: "Account created successfully"
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Login
app.post("/login", async (req, res) => {

  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({
      message: "Invalid password"
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET || "secretkey",
    {
      expiresIn: "7d"
    }
  );

  res.json({
    token,
    fullName: user.fullName,
    balance: user.balance
  });

});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
