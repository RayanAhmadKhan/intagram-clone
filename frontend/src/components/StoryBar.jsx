import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";

const StoryBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const socket = useSocket();
  const [feed, setFeed] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadFeed = async () => {
    try {
      const { data } = await api.get("/stories/feed");
      setFeed(data?.data?.feed || []);
    } catch (err) {
      console.error("Failed to load stories feed:", err);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [user?._id]); // Re-fetch feed whenever active auth user changes

  useEffect(() => {
    if (!socket) return;

    const handleNewStory = () => {
      loadFeed();
    };

    socket.on("story:new", handleNewStory);
    return () => socket.off("story:new", handleNewStory);
  }, [socket]);

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("media", file);
      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadFeed();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload story");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Identify own stories vs other users' stories
  const ownEntry = feed.find((f) => f.isOwn);
  const otherEntries = feed.filter((f) => !f.isOwn);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 border-b mb-4">
      {/* 1. CURRENT USER STORY / ADD STORY */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="relative">
          <button
            onClick={() => {
              if (ownEntry && ownEntry.stories && ownEntry.stories.length > 0) {
                // Guaranteed navigation to logged-in user's story page
                const targetUsername = user?.username || ownEntry?.owner?.username;
                if (targetUsername) {
                  navigate(`/stories/${targetUsername}`);
                }
              } else {
                fileInputRef.current?.click();
              }
            }}
            disabled={uploading}
            className={`h-16 w-16 rounded-full p-0.5 border-2 ${
              ownEntry && ownEntry.stories?.length > 0
                ? "border-pink-500 hover:scale-105 transition-transform"
                : "border-gray-200"
            }`}
          >
            <img
              src={
                user?.avatar?.url ||
                user?.avatar ||
                "https://placehold.co/64x64?text=Me"
              }
              alt="Your story"
              className="h-full w-full rounded-full object-cover"
            />
          </button>

          {/* Plus button to upload anytime */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white transition"
            title="Add Story"
          >
            +
          </button>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          {uploading ? "Uploading..." : "Your story"}
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* 2. FOLLOWED USERS' STORIES */}
      {otherEntries.map((entry) => (
        <button
          key={entry.owner.id || entry.owner.username}
          onClick={() => navigate(`/stories/${entry.owner.username}`)}
          className="flex shrink-0 flex-col items-center gap-1 hover:opacity-90 transition"
        >
          <div className="h-16 w-16 rounded-full p-0.5 border-2 border-pink-500">
            <img
              src={
                entry.owner.avatar?.url ||
                entry.owner.avatar ||
                "https://placehold.co/64x64?text=?"
              }
              alt={entry.owner.username}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <span className="max-w-[64px] truncate text-xs text-gray-600 font-medium">
            @{entry.owner.username}
          </span>
        </button>
      ))}
    </div>
  );
};

export default StoryBar;