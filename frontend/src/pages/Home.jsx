import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react"; // <-- Added missing import
import { useAuth } from "../contexts/AuthContext";
import StoryBar from "../components/StoryBar";
import Feed from "../components/Feed";
import NotificationBell from "../components/NotificationBell";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lookupUsername, setLookupUsername] = useState("");

  const goToProfile = (e) => {
    e.preventDefault();
    if (lookupUsername.trim()) navigate(`/u/${lookupUsername.trim()}`);
  };

  return (
    <div className="relative mx-auto max-w-md p-6">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-xl font-bold">Welcome, {user?.username}</h1>
        <div className="flex flex-wrap items-center gap-4">
          <NotificationBell />
          <Link to="/requests" className="text-sm font-medium text-brand hover:underline">
            Requests
          </Link>
          <Link to="/profile" className="text-sm font-medium text-brand hover:underline">
            Edit profile
          </Link>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Log out
          </button>
        </div>
      </div>

      <div className="mt-4">
        <StoryBar />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/create-post"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
        >
          + Create post
        </Link>
        <Link
          to={`/u/${user?.username}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          My profile
        </Link>
      </div>

      {/* User Search */}
      <form onSubmit={goToProfile} className="mt-6 flex gap-2">
        <input
          value={lookupUsername}
          onChange={(e) => setLookupUsername(e.target.value)}
          placeholder="Go to username..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-light"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
        >
          Go
        </button>
      </form>

      <div className="mt-6">
        <Feed />
      </div>

      {/* Direct Messages Floating Button */}
      <Link
        to="/messages"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-white shadow-lg transition-all hover:bg-brand-light active:scale-95"
        title="Open Direct Messages"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm font-semibold">Messages</span>
      </Link>
    </div>
  );
};

export default Home;