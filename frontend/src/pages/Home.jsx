import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Welcome, {user?.username}</h1>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-sm font-medium text-brand hover:underline">
            Edit profile
          </Link>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Log out
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Feed will render here once Posts (Step 8) and Feed (Step 13) are built.
      </p>
    </div>
  );
};

export default Home;
