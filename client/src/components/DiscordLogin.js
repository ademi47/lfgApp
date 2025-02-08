import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_URL } from "../config";

const DiscordLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const response = await axios.get("/auth/discord/login", {
            baseURL: API_URL,
            params: { code },
          });

          if (response.data.success) {
            console.log("Login response:", response.data);
            await login({
              id: response.data.user.id,
              discord_id: response.data.user.discord_id,
              displayName: response.data.user.username,
            });
            navigate("/");
          }
        } catch (error) {
          console.error("Login error:", error);
          setError(
            error.response?.data?.message || "An error occurred during login"
          );
        }
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  const handleLogin = () => {
    const DISCORD_CLIENT_ID = "1336295664551727146";
    const redirectUri = "https://lfg-app-two.vercel.app/login/callback";
    const scope = "identify email";

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    window.location.href = discordAuthUrl;
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Login with Discord
      </h2>
      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}
      <p className="text-gray-400 mb-4">
        Please log in with Discord to continue.
      </p>
      <button
        onClick={handleLogin}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        Login with Discord
      </button>
    </div>
  );
};

export default DiscordLogin;
