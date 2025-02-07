import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_URL } from "../config";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState("");

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const fetchUserDisplayName = async () => {
      if (user && user.discord_id) {
        console.log("Attempting to fetch display name for:", user.discord_id);
        try {
          const response = await axios.get(
            `${API_URL}/users/${user.discord_id}`
          );
          console.log("API Response:", response.data);

          if (response.data && response.data.display_name) {
            console.log("Setting display name to:", response.data.display_name);
            setDisplayName(response.data.display_name);
          } else {
            console.log("No display_name found in response:", response.data);
          }
        } catch (error) {
          console.error(
            "Failed to fetch user display name:",
            error.response || error
          );
        }
      } else {
        console.log("No user or discord_id available. User object:", user);
      }
    };

    fetchUserDisplayName();
  }, [user]);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (user && user.discord_id) {
        try {
          const response = await axios.get(
            `${API_URL}/users/${user.discord_id}/profile-check`
          );

          if (!response.data.is_profile_complete) {
            // Show a message or redirect to update profile
            console.log(
              "Profile incomplete. Missing fields:",
              response.data.missing_fields
            );
            // You could show a message to the user here
            // Or redirect them to the update page
            navigate("/update");
          }
        } catch (error) {
          console.error("Error checking user profile:", error);
        }
      }
    };

    checkUserProfile();
  }, [user]);

  const handleUpdateClick = () => {
    navigate("/update");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            LFG Finder
          </h1>
          {user ? (
            <div>
              <p className="text-gray-200 mt-2">
                Welcome,{" "}
                <span className="text-purple-400">
                  {displayName || "Loading..."}
                </span>
                !
              </p>
              <div className="flex justify-center space-x-4 mb-4 mt-4">
                {!isHomePage && (
                  <Link
                    to="/"
                    className="text-white bg-green-500 hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Home
                  </Link>
                )}
                <button
                  onClick={handleUpdateClick}
                  className="text-white bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Update My Info
                </button>
                <Link
                  to="/my-posts"
                  className="text-white bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  My Posts
                </Link>
                {isHomePage && (
                  <button
                    onClick={() => {
                      logout();
                      window.location.reload();
                    }}
                    className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 mt-2">
                Find your perfect gaming squad
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
