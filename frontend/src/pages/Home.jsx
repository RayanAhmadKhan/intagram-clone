import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
//import StoryBar from "../components/StoryBar";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lookupUsername, setLookupUsername] = useState("");

  const goToProfile = (e) => {
    e.preventDefault();
    if (lookupUsername.trim()) navigate(`/u/${lookupUsername.trim()}`);
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Welcome, {user?.username}</h1>
        <div className="flex items-center gap-4">
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

      {/* <div className="mt-4">
        <StoryBar />
      </div> */}

      <div className="mt-4 flex gap-3">
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

      {/* Stand-in for user search (that's a bonus feature) — lets you jump to
          any username's profile to test the follow system with a second account */}
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

      <p className="mt-4 text-sm text-gray-500">
        Full feed comes in Step 13 — for now, check posts via a profile page.
      </p>
    </div>
  );
};

export default Home;
