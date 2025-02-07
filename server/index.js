require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const fetch = require("node-fetch");

const discordAuthRoutes = require("./discordAuth"); // Import the discordAuth module

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://app.feargamingproductions.com", "http://localhost:3000"],
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

// Database setup
const db = new sqlite3.Database("./lfg.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

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

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS lfg_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_type TEXT NOT NULL,
      region TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'open',
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(discord_id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT UNIQUE,
      display_name TEXT NOT NULL,
      bio TEXT,
      email TEXT UNIQUE NOT NULL,
      birth_date DATE,
      country TEXT,
      profile_picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Use the discordAuth routes
app.use(discordAuthRoutes);

// Routes
app.get("/api/posts", (req, res) => {
  db.all(
    `SELECT 
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
    ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.post("/api/posts", (req, res) => {
  const { game_type, region, game_mode, user_id } = req.body;

  // Log the incoming data for debugging
  console.log("Creating post with data:", {
    game_type,
    region,
    game_mode,
    user_id,
  });

  db.run(
    "INSERT INTO lfg_posts (game_type, region, game_mode, user_id) VALUES (?, ?, ?, ?)",
    [game_type, region, game_mode, user_id],
    function (err) {
      if (err) {
        console.error("Error inserting post:", err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
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
        db.run(
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
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    };

    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE discord_id = ?",
        [discord_id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (existingUser) {
      // Update existing user
      await new Promise((resolve, reject) => {
        db.run(
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
          ],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });

      res.json({
        success: true,
        message: "User information updated successfully.",
        userId: existingUser.id,
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
app.delete("/api/reset-db", (req, res) => {
  try {
    // Delete all records from lfg_posts
    db.run("DELETE FROM lfg_posts", [], (err) => {
      if (err) {
        console.error("Error deleting lfg_posts:", err);
        return res.status(500).json({ error: "Failed to delete lfg_posts" });
      }
    });

    // Delete all records from users
    db.run("DELETE FROM users", [], (err) => {
      if (err) {
        console.error("Error deleting users:", err);
        return res.status(500).json({ error: "Failed to delete users" });
      }
    });

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
    await db.run(
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
    console.error("Update error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update user information." });
  }
});

// Get user by discord_id endpoint
app.get("/api/users/:discord_id", (req, res) => {
  const { discord_id } = req.params;
  console.log("Fetching user with discord_id:", discord_id);

  db.get(
    "SELECT id, discord_id, display_name, email, bio, country, birth_date FROM users WHERE discord_id = ?",
    [discord_id],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log("User not found for discord_id:", discord_id);
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Found user data:", row);
      res.json(row);
    }
  );
});

// Add this new endpoint to get posts by user_id
app.get("/api/posts/user/:user_id", (req, res) => {
  const { user_id } = req.params;

  db.all(
    `SELECT 
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
    [user_id],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Add this new endpoint to check user profile completion
app.get("/api/users/:discord_id/profile-check", (req, res) => {
  const { discord_id } = req.params;

  db.get(
    `SELECT 
      CASE 
        WHEN birth_date IS NULL OR birth_date = '' OR
             country IS NULL OR country = ''
        THEN false
        ELSE true
      END as is_profile_complete,
      birth_date,
      country
    FROM users 
    WHERE discord_id = ?`,
    [discord_id],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }

      const response = {
        is_profile_complete: row.is_profile_complete === 1,
        missing_fields: {
          birth_date: !row.birth_date,
          country: !row.country,
        },
      };

      console.log("Profile check for user:", discord_id, response);
      res.json(response);
    }
  );
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
app.delete("/api/posts/:post_id", (req, res) => {
  const { post_id } = req.params;
  const { user_id } = req.query; // For security check

  db.run(
    "DELETE FROM lfg_posts WHERE id = ? AND user_id = ?",
    [post_id, user_id],
    function (err) {
      if (err) {
        console.error("Error deleting post:", err);
        return res.status(500).json({ error: "Failed to delete post" });
      }
      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: "Post not found or unauthorized" });
      }
      res.json({ success: true, message: "Post deleted successfully" });
    }
  );
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
