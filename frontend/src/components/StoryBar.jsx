import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext"; // Added useSocket

const StoryBar = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const socket = useSocket();
  const [feed, setFeed] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/stories/feed");
      setFeed(data.data.feed);
    } catch (err) {
      console.error("Failed to load stories feed:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Listen for real-time new stories
  useEffect(() => {
    if (!socket) return;

    const handleNewStory = () => {
      load(); // Reload feed to format grouped stories cleanly
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
      await load();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const ownEntry = feed.find((f) => f.isOwn);
  const otherEntries = feed.filter((f) => !f.isOwn);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => (ownEntry ? navigate(`/stories/${ownEntry.owner.username}`) : fileInputRef.current.click())}
          disabled={uploading}
          className={`relative h-16 w-16 shrink-0 rounded-full p-0.5 disabled:opacity-50 ${
            ownEntry ? "bg-gradient-to-tr from-yellow-400 to-pink-500" : "bg-gray-200"
          }`}
        >
          <img
            src={ownEntry?.owner.avatar?.url || "https://placehold.co/64x64?text=?"}
            alt="Your story"
            className="h-full w-full rounded-full border-2 border-white object-cover"
          />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-white">
            +
          </span>
        </button>
        <span className="text-xs text-gray-500">{uploading ? "Uploading..." : "Your story"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {otherEntries.map((entry) => (
        <button
          key={entry.owner.id}
          onClick={() => navigate(`/stories/${entry.owner.username}`)}
          className="flex shrink-0 flex-col items-center gap-1"
        >
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-0.5">
            <img
              src={entry.owner.avatar?.url || "https://placehold.co/64x64?text=?"}
              alt={entry.owner.username}
              className="h-full w-full rounded-full border-2 border-white object-cover"
            />
          </div>
          <span className="max-w-[64px] truncate text-xs text-gray-500">@{entry.owner.username}</span>
        </button>
      ))}
    </div>
  );
};

export default StoryBar;