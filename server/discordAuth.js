const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const querystring = require("querystring");

const DISCORD_CLIENT_ID = "1336295664551727146";
const DISCORD_CLIENT_SECRET = "IH8_2rT7dZeWOq6TtiKcJ39RzuvAPjX1";

// Handle login callback
router.get("/api/auth/discord/login", async (req, res) => {
  try {
    const { code } = req.query;
    console.log("Received code:", code);

    const DISCORD_REDIRECT_URI = "http://localhost:3000/login/callback";
    console.log("Using redirect URI:", DISCORD_REDIRECT_URI);

    // Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: "identify",
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const token = await tokenResponse.json();
    console.log("Token response:", token);

    // if (!token.access_token) {
    //   throw new Error("Failed to get access token from Discord");
    // }

    // Get user data with the token
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user data from Discord");
    }

    const userData = await userResponse.json();
    console.log("Discord user data:", userData);

    // Check if user exists in database
    const db = new sqlite3.Database("./lfg.db");
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE discord_id = ?",
        [userData.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    console.log("Existing user:", existingUser);

    if (!existingUser) {
      // If user doesn't exist, create a new user
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO users (
            discord_id, 
            display_name, 
            email
          ) VALUES (?, ?, ?)`,
          [String(userData.id), userData.username, userData.email],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }

    // Send user data back to client
    res.json({
      success: true,
      user: {
        discord_id: String(userData.id),
        username: userData.username || "",
        email: userData.email || "",
      },
    });
  } catch (error) {
    console.error("Discord auth error:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
});

module.exports = router;
