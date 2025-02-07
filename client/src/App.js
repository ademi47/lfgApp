import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Update from "./components/Update";
import Home from "./components/Home";
import Layout from "./components/Layout";
import DiscordLogin from "./components/DiscordLogin";
import MyPosts from "./components/MyPosts";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/update" element={<Update />} />
          <Route path="/login" element={<DiscordLogin />} />
          <Route path="/login/callback" element={<DiscordLogin />} />
          <Route path="/my-posts" element={<MyPosts />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
