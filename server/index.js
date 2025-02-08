require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const fetch = require("node-fetch");

const discordAuthRoutes = require("./discordAuth"); // Import the discordAuth module

const app = express();
const port = process.env.PORT || 5000;

// Add this at the top to debug
console.log("Current working directory:", process.cwd());
console.log("Loading environment variables...");
console.log({
  DB_HOST: "127.0.0.1", // Hardcoded value
  DB_USER: "u561042160_lfgadmin",
  DB_NAME: "u561042160_lfgapp",
  NODE_ENV: process.env.NODE_ENV,
});

// MySQL connection pool
const pool = mysql
  .createPool({
    host: "127.0.0.1", // Hardcoded value
    user: "u561042160_lfgadmin",
    password: "206#iCf!mk",
    database: "u561042160_lfgapp",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .on("error", (err) => {
    console.error("Pool error:", err);
  });

// Middleware
app.use(
  cors({
    origin: [
      "https://lfg-app-two.vercel.app",
      "http://localhost:3000",
      "https://api.feargamingproductions.com",
    ],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads", "profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create tables
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Create users table first
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        bio TEXT,
        email VARCHAR(255) UNIQUE NOT NULL,
        birth_date DATE,
        country VARCHAR(255),
        profile_picture VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Then create lfg_posts table with foreign key
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lfg_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_type VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        game_mode VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'open',
        user_id VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(discord_id)
      )
    `);

    connection.release();
    console.log("Database tables created successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "./uploads/profiles",
  filename: function (req, file, cb) {
    cb(null, "profile-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Use the discordAuth routes
app.use(discordAuthRoutes);

// Routes
app.get("/api/posts", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.game_type, 
        p.region, 
        p.game_mode, 
        p.created_at,
        p.status,
        p.user_id,
        u.display_name as player_name
      FROM lfg_posts p
      LEFT JOIN users u ON p.user_id = u.discord_id
      WHERE p.status = "open" 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/posts", async (req, res) => {
  const { game_type, region, game_mode, user_id } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO lfg_posts (game_type, region, game_mode, user_id) VALUES (?, ?, ?, ?)",
      [game_type, region, game_mode, user_id]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: error.message });
  }
});

// Registration endpoint
app.post("/api/register", upload.single("profilePicture"), async (req, res) => {
  try {
    console.log("Received registration request body:", req.body);

    const { discord_id, display_name, bio, email, birth_date, country } =
      req.body;

    // Validate required fields
    if (!display_name) {
      throw new Error("Display name is required");
    }
    if (!birth_date) {
      throw new Error("Birth date is required");
    }

    const profile_picture = req.file ? req.file.filename : null;

    // Use Promise wrapper for better async handling
    const insertUser = () => {
      return new Promise((resolve, reject) => {
        pool.query(
          `INSERT INTO users (
            discord_id, display_name, bio, email, 
            birth_date, country, profile_picture
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            discord_id || null,
            display_name,
            bio || "",
            email,
            birth_date,
            country,
            profile_picture,
          ],
          function (err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result.insertId);
            }
          }
        );
      });
    };

    // Check if user exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE discord_id = ?",
      [discord_id]
    );

    if (existingUser.length > 0) {
      // Update existing user
      await pool.query(
        `UPDATE users SET 
          display_name = ?, 
          bio = ?, 
          email = ?, 
          birth_date = ?, 
          country = ?, 
          profile_picture = ? 
        WHERE discord_id = ?`,
        [
          display_name,
          bio || "",
          email,
          birth_date,
          country,
          profile_picture,
          discord_id,
        ]
      );

      res.json({
        success: true,
        message: "User information updated successfully.",
        userId: existingUser[0].id,
      });
    } else {
      // Insert new user
      const userId = await insertUser();
      console.log("New user created with ID:", userId);

      res.json({
        success: true,
        message: "Registration successful",
        userId: userId,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed",
      message: error.message,
    });
  }
});

// Delete all records from tables
app.delete("/api/reset-db", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Delete all records from lfg_posts
    await connection.query("DELETE FROM lfg_posts");

    // Delete all records from users
    await connection.query("DELETE FROM users");

    connection.release();
    res.json({ message: "All records deleted successfully" });
  } catch (error) {
    console.error("Database reset error:", error);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

app.post("/api/update", async (req, res) => {
  const { discord_id, display_name, bio, email, birth_date, country } =
    req.body;
  try {
    await pool.query(
      `UPDATE users SET 
        display_name = ?, 
        bio = ?, 
        email = ?, 
        birth_date = ?, 
        country = ? 
      WHERE discord_id = ?`,
      [display_name, bio || "", email, birth_date, country, discord_id]
    );
    res.json({
      success: true,
      message: "User information updated successfully.",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user information." });
  }
});

// Get user by discord_id endpoint
app.get("/api/users/:discord_id", async (req, res) => {
  const { discord_id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, discord_id, display_name, email, bio, country, birth_date FROM users WHERE discord_id = ?",
      [discord_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this new endpoint to get posts by user_id
app.get("/api/posts/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        p.id, 
        p.game_type, 
        p.region, 
        p.game_mode, 
        p.created_at,
        p.status,
        p.user_id,
        u.display_name as player_name
      FROM lfg_posts p
      LEFT JOIN users u ON p.user_id = u.discord_id
      WHERE p.user_id = ? AND p.status = "open" 
      ORDER BY p.created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the profile check endpoint
app.get("/api/users/:discord_id/profile-check", async (req, res) => {
  const { discord_id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        CASE 
          WHEN birth_date IS NULL OR birth_date < '1900-01-01' OR
               country IS NULL OR country = ''
          THEN false
          ELSE true
        END as is_profile_complete,
        CASE 
          WHEN birth_date IS NULL OR birth_date < '1900-01-01' THEN NULL 
          ELSE DATE_FORMAT(birth_date, '%Y-%m-%d')
        END as birth_date,
        country
      FROM users 
      WHERE discord_id = ?`,
      [discord_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const response = {
      is_profile_complete: rows[0].is_profile_complete === 1,
      missing_fields: {
        birth_date: !rows[0].birth_date,
        country: !rows[0].country,
      },
    };

    console.log("Profile check for user:", discord_id, response);
    res.json(response);
  } catch (error) {
    console.error("Error fetching profile check:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this new endpoint to send LFG messages
app.post("/api/send-lfg", async (req, res) => {
  try {
    const { discord_id, game, mode, region, age_range } = req.body;
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    // Create a formatted embed message
    const embed = {
      title: "🎮 New LFG Request!",
      color: 0x9b59b6, // Purple color
      description:
        `<@${discord_id}> is looking for a group!\n\n` +
        `**Game:** ${game}\n` +
        `**Mode:** ${mode}\n` +
        `**Region:** ${region}\n` +
        `**Age Preference:** ${age_range}\n\n` +
        `*React with ✅ if you want to join or DM the user!*`,
      timestamp: new Date().toISOString(),
      footer: {
        text: "LFG Finder Bot",
      },
    };

    // Send to Discord webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `Hey Gamers! <@${discord_id}> is looking for teammates!`,
        embeds: [embed],
        allowed_mentions: {
          users: [discord_id],
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message to Discord");
    }

    res.json({ success: true, message: "LFG message sent to Discord" });
  } catch (error) {
    console.error("Error sending LFG message:", error);
    res.status(500).json({ error: "Failed to send LFG message" });
  }
});

// Add delete post endpoint
app.delete("/api/posts/:post_id", async (req, res) => {
  const { post_id } = req.params;
  const { user_id } = req.query;
  try {
    const [result] = await pool.query(
      "DELETE FROM lfg_posts WHERE id = ? AND user_id = ?",
      [post_id, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
