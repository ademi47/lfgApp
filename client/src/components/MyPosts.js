import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_URL } from "../config";

const MyPosts = () => {
  const { user } = useAuth();
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyPosts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/posts/user/${user.discord_id}`
      );
      setMyPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching my posts:", error);
      setLoading(false);
      setError("Failed to fetch posts");
    }
  };

  useEffect(() => {
    if (user?.discord_id) {
      fetchMyPosts();
    }
  }, [user]);

  const handleDeletePost = async (postId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/posts/${postId}?user_id=${user.discord_id}`
      );

      if (response.data.success) {
        // Remove the deleted post from state
        setMyPosts(myPosts.filter((post) => post.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6">
        My LFG Posts
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-500">
          {error}
        </div>
      )}

      {myPosts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-lg">
            You haven't created any LFG posts yet.
          </p>
          <p className="text-gray-500 mt-2">
            Create one to start finding gaming partners!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {myPosts.map((post) => (
            <div
              key={post.id}
              className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  {post.game_type}
                </h3>
                <span className="px-3 py-1 bg-purple-500 bg-opacity-20 text-purple-400 rounded-full text-sm">
                  {post.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Region:</span>
                    <span className="text-white font-medium">
                      {post.region}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Mode:</span>
                    <span className="text-white font-medium">
                      {post.game_mode}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white font-medium">
                      {new Date(post.created_at.replace(" ", "T"))
                        .toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                        .replace(",", "")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                >
                  Delete Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPosts;
