import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";
import DiscordLogin from "./DiscordLogin";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({
    game_type: "",
    region: "",
    game_mode: "",
    divisions: [],
    age_range: "Any",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 4; // Adjust this number as needed
  const [showWarning, setShowWarning] = useState(false);
  const [missingFields, setMissingFields] = useState(null);

  const divisions = [
    "One Above All",
    "Celestial",
    "Eternity",
    "Grand Master",
    "Diamond",
    "Platinum",
    "Gold",
    "Silver",
    "Bronze",
  ];

  const ageRanges = ["Any", "Under 18", "18 - 24", "25 - 34", "35+"];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/posts`);
        setPosts(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (
        (name === "game_type" && value !== "Marvel Rivals") ||
        (name === "game_mode" &&
          prev.game_mode === "Rank" &&
          value !== "Rank") ||
        (name === "game_mode" && prev.game_mode !== "Rank" && value === "Rank")
      ) {
        return {
          ...prev,
          [name]: value,
          divisions: [],
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleDivisionChange = (division) => {
    setFormData((prev) => ({
      ...prev,
      divisions: prev.divisions.includes(division)
        ? prev.divisions.filter((d) => d !== division)
        : [...prev.divisions, division],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Check profile completion first
      const profileCheck = await axios.get(
        `${API_URL}/users/${user.discord_id}/profile-check`
      );

      if (!profileCheck.data.is_profile_complete) {
        setShowWarning(true);
        setMissingFields(profileCheck.data.missing_fields);
        return;
      }

      // Get user's display name first
      const userResponse = await axios.get(
        `${API_URL}/users/${user.discord_id}`
      );
      const displayName = userResponse.data.display_name;

      // Create the post in your database
      const postData = {
        ...formData,
        user_id: user.discord_id,
      };

      // If it's Marvel Rivals Ranked, include the divisions in game_mode
      if (
        formData.game_type === "Marvel Rivals" &&
        formData.game_mode === "Rank"
      ) {
        postData.game_mode = `Rank - ${formData.divisions.join(" / ")}`;
      }

      const response = await axios.post(`${API_URL}/posts`, postData);

      // Send LFG message to Discord with age range
      await axios.post(`${API_URL}/send-lfg`, {
        discord_id: user.discord_id,
        game: formData.game_type,
        mode: postData.game_mode,
        region: formData.region,
        age_range: formData.age_range,
      });

      // Reset form and fetch updated posts
      setFormData({
        game_type: "",
        region: "",
        game_mode: "",
        divisions: [],
        age_range: "Any",
      });
      const updatedPosts = await axios.get(`${API_URL}/posts`);
      setPosts(updatedPosts.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
      {user ? (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            Create LFG Post
          </h2>

          {showWarning && (
            <div className="mb-6 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded">
              <p className="text-yellow-500 mb-2">
                Please update your profile before creating a post.
              </p>
              {missingFields && (
                <p className="text-yellow-400 text-sm">
                  Missing information:{" "}
                  {Object.entries(missingFields)
                    .filter(([_, isMissing]) => isMissing)
                    .map(([field]) => field.replace("_", " "))
                    .join(", ")}
                </p>
              )}
              <button
                onClick={() => navigate("/update")}
                className="mt-2 text-yellow-400 hover:text-yellow-300 underline"
              >
                Go to Update Profile
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Game Type
              </label>
              <select
                name="game_type"
                value={formData.game_type}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Game Type</option>
                <option value="The Finals">The Finals</option>
                <option value="Marvel Rivals">Marvel Rivals</option>
                <option value="Valorant">Valorant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Region
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Region</option>
                <option value="NA">NA</option>
                <option value="EU">EU</option>
                <option value="Asia">Asia</option>
                <option value="OCE">OCE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Game Mode
              </label>
              <select
                name="game_mode"
                value={formData.game_mode}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Game Mode</option>
                <option value="Quick Match">Quick Match</option>
                <option value="Rank">Rank</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Age Range
              </label>
              <select
                name="age_range"
                value={formData.age_range}
                onChange={handleInputChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {ageRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>

            {formData.game_type === "Marvel Rivals" &&
              formData.game_mode === "Rank" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Competitive Divisions (Select Range)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {divisions.map((division) => (
                      <label
                        key={division}
                        className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
                          formData.divisions.includes(division)
                            ? "bg-purple-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.divisions.includes(division)}
                          onChange={() => handleDivisionChange(division)}
                        />
                        <span className="ml-2">{division}</span>
                      </label>
                    ))}
                  </div>
                  {formData.divisions.length > 0 && (
                    <p className="mt-2 text-sm text-gray-400">
                      Selected range: {formData.divisions.join(" / ")}
                    </p>
                  )}
                </div>
              )}

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Create LFG Post
            </button>
          </form>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
            Active LFG Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPosts.length === 0 ? (
              <p className="text-gray-400">
                No active posts. Be the first to create one!
              </p>
            ) : (
              currentPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors"
                >
                  <h3 className="text-purple-400 font-semibold text-xl mb-2">
                    {post.game_type}
                  </h3>
                  <div className="text-gray-300">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">Region:</span>
                      <span>{post.region}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-400">Mode:</span>
                      <span className="ml-2">{post.game_mode}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-400">Player:</span>
                      <span className="ml-2">{post.player_name}</span>
                    </div>
                    <div className="mt-1 text-gray-400">
                      <span className="text-gray-400">Created:</span>
                      <span className="ml-2">
                        {post.created_at
                          ? new Date(post.created_at.replace(" ", "T"))
                              .toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                              .replace(",", "")
                          : "Invalid Date"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <DiscordLogin />
      )}
    </div>
  );
};

export default Home;
