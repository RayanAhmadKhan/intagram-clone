import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function StoryViewPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStories();
  }, [username]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stories/user/${username}`);
      setStories(res.data?.data?.stories || []);
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    setDeleting(true);
    try {
      await api.delete(`/stories/${storyId}`);
      
      const updatedStories = stories.filter((s) => s.id !== storyId);
      if (updatedStories.length === 0) {
        navigate("/");
      } else {
        setStories(updatedStories);
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete story");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Loading story...
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white gap-4">
        <p>No active stories for @{username}</p>
        <button
          onClick={() => navigate("/")}
          className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  // Robust check for ownership
  const isMyStory =
    currentStory?.isOwnStory ||
    currentStory?.owner?.id === user?._id ||
    currentStory?.owner?.id === user?.id ||
    user?.username?.toLowerCase() === username?.toLowerCase();

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-black">
      {/* Top Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <img
            src={currentStory.owner?.avatar?.url || currentStory.owner?.avatar || "https://placehold.co/32x32"}
            className="h-8 w-8 rounded-full border border-white/40 object-cover"
            alt={currentStory.owner?.username}
          />
          <span className="font-semibold text-sm">@{currentStory.owner?.username}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* DELETE BUTTON: Rendered ONLY if the viewer owns this story */}
          {isMyStory && (
            <button
              onClick={() => handleDeleteStory(currentStory.id)}
              disabled={deleting}
              className="p-1.5 rounded-full hover:bg-white/20 text-red-400 hover:text-red-500 transition disabled:opacity-50"
              title="Delete Story"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          {/* Close viewer */}
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-h-[85vh] max-w-[400px] w-full flex justify-center items-center">
        {currentStory.media?.resourceType === "video" ? (
          <video src={currentStory.media.url} autoPlay className="max-h-[80vh] object-contain rounded-lg" />
        ) : (
          <img src={currentStory.media.url} alt="Story" className="max-h-[80vh] object-contain rounded-lg" />
        )}
      </div>

      {/* Prev / Next controls */}
      {currentIndex > 0 && (
        <button
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full text-xl"
        >
          ‹
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full text-xl"
        >
          ›
        </button>
      )}
    </div>
  );
}