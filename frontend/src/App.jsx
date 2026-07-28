import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import CreatePost from './pages/CreatePost';
import SinglePost from './pages/SinglePost';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-post" element={<CreatePost />} />
      <Route path="/posts/:id" element={<SinglePost />} />
      <Route path="/u/:username" element={<UserProfile />} />
    </Routes>
  );
}