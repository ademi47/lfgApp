import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";

const CreatePostForm = () => {
  const { user } = useAuth();
  const [gameType, setGameType] = useState("");
  const [region, setRegion] = useState("");
  const [gameMode, setGameMode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Creating post with user_id:", user.discord_id); // Check if user_id is available

    try {
      const response = await axios.post(`${API_URL}/posts`, {
        game_type: gameType,
        region,
        game_mode: gameMode,
        user_id: user.discord_id, // Pass the discord_id as user_id
      });

      console.log("Post created successfully:", response.data);
      // Handle success (e.g., show a success message or redirect)
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields for game_type, region, game_mode */}
      <button type="submit">Create Post</button>
    </form>
  );
};

export default CreatePostForm;
