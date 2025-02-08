import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { FaDiscord, FaUpload } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { API_BASE_URL, API_URL } from "../config";
import { useAuth } from "../context/AuthContext";

const Registration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    discord_id: "",
    display_name: "",
    bio: "",
    email: "",
    birth_date: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "South Korea",
    "Brazil", // Add more countries as needed
  ];

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const response = await axios.get("/auth/discord/callback", {
            baseURL: API_URL,
            params: { code },
          });

          console.log("Discord callback response:", response.data);

          if (response.data.success) {
            setFormData((prev) => ({
              ...prev,
              discord_id: response.data.user.discord_id,
              display_name: response.data.user.username,
              email: response.data.user.email,
            }));
          }
        } catch (error) {
          console.error("Discord auth error:", error.response?.data);

          if (error.response?.data?.isRegistered) {
            setError(
              <div className="text-center">
                <p className="text-red-400">{error.response.data.message}</p>
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 underline mt-4 inline-block"
                >
                  Click here to login with Discord
                </Link>
              </div>
            );
          } else {
            setError("Failed to authenticate with Discord");
          }
        }
      }
    };

    handleDiscordCallback();
  }, [location]);

  const handleRegister = () => {
    const DISCORD_CLIENT_ID = "1336295664551727146";
    const redirectUri = "https://lfg-app-two.vercel.app/register/callback";
    const scope = "identify email";

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(scope)}`;

    window.location.href = discordAuthUrl;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();

      // Add all form fields to FormData
      formDataToSend.append("discord_id", formData.discord_id);
      formDataToSend.append("display_name", formData.display_name);
      formDataToSend.append("bio", formData.bio || "");
      formDataToSend.append("email", formData.email);
      formDataToSend.append("birth_date", formData.birth_date);
      formDataToSend.append("country", formData.country);

      // Add profile picture if exists
      if (formData.profilePicture) {
        formDataToSend.append("profilePicture", formData.profilePicture);
      }

      console.log("Registration form data:", formData);
      console.log(
        "Sending registration data:",
        Object.fromEntries(formDataToSend)
      );

      const response = await axios.post(`${API_URL}/register`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration response:", response.data);

      if (response.data.success) {
        console.log("Registration successful:", response.data);
        // Make sure we're passing the correct data to login
        const userData = {
          id: response.data.userId,
          discord_id: formData.discord_id,
          displayName: formData.display_name,
        };
        console.log("Logging in with:", userData);
        login(userData);
        navigate("/");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Register for LFG Finder
          </h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-gray-400 hover:text-white"
          >
            Back to Home
          </button>
        </div>

        {!formData.discord_id && (
          <div className="text-center">
            <button
              onClick={handleRegister}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#5865F2] hover:bg-[#4752C4] transition duration-300"
            >
              <FaDiscord className="mr-2" />
              Continue with Discord
            </button>
          </div>
        )}

        {formData.discord_id && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Display Name *
              </label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Bio (Optional)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                maxLength={300}
                rows={3}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-400 mt-1">
                {formData.bio.length}/300 characters
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Birth Date *
              </label>
              <DatePicker
                selected={
                  formData.birth_date ? new Date(formData.birth_date) : null
                }
                onChange={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    birth_date: date ? date.toISOString().split("T")[0] : "",
                  }))
                }
                maxDate={new Date()}
                showYearDropdown
                dropdownMode="select"
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Country/Region *
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Profile Picture (Optional)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <FaUpload className="mr-2" />
                  Upload Photo
                </button>
                {previewImage && (
                  <div className="h-16 w-16 rounded-full overflow-hidden">
                    <img
                      src={previewImage}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Registration
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Registration;
