import { useState } from "react";
import api from "../services/api";

// status: "following" | "requested" | "not_following"
const FollowButton = ({ userId, initialStatus, onChange }) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (status === "not_following") {
        const { data } = await api.post(`/follow/${userId}`);
        setStatus(data.data.status); // "following" or "requested"
        onChange?.(data.data.status);
      } else {
        // "following" -> unfollow, "requested" -> cancel request
        const { data } = await api.delete(`/follow/${userId}`);
        setStatus(data.data.status); // "not_following"
        onChange?.(data.data.status);
      }
    } catch (err) {
      console.error(err.response?.data?.message || "Follow action failed");
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    following: "Unfollow",
    requested: "Requested",
    not_following: "Follow",
  };

  const styles = {
    following: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    requested: "border border-gray-300 text-gray-500 hover:bg-gray-50",
    not_following: "bg-brand text-white hover:bg-brand-light",
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles[status]}`}
    >
      {loading ? "..." : labels[status]}
    </button>
  );
};

export default FollowButton;
