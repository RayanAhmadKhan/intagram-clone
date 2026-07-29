import { useEffect, useState } from "react";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";

// status: "following" | "requested" | "not_following"
const FollowButton = ({ userId, initialStatus, onChange }) => {
  const socket = useSocket();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // Keep in sync if the parent re-fetches and passes a new initialStatus
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Live: if the profile currently on screen accepts/rejects our pending
  // request from another tab/device, this button updates without a refresh.
  useEffect(() => {
    if (!socket) return;

    const handleAccepted = (payload) => {
      if (payload.by?.id === userId) {
        setStatus("following");
        onChange?.("following");
      }
    };
    const handleRejected = (payload) => {
      if (payload.by?.id === userId) {
        setStatus("not_following");
        onChange?.("not_following");
      }
    };

    socket.on("follow:accepted", handleAccepted);
    socket.on("follow:rejected", handleRejected);
    return () => {
      socket.off("follow:accepted", handleAccepted);
      socket.off("follow:rejected", handleRejected);
    };
  }, [socket, userId, onChange]);

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
