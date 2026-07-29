import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";

const FollowRequests = () => {
  const socket = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/follow/requests");
      setRequests(data.data.requests);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live: a new incoming request appears without needing a refresh.
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (payload) => {
      setRequests((prev) => {
        if (prev.some((r) => r.id === payload.id)) return prev; // avoid dupes
        return [
          { id: payload.id, requester: payload.requester, createdAt: payload.createdAt },
          ...prev,
        ];
      });
    };

    socket.on("follow:request", handleNewRequest);
    return () => socket.off("follow:request", handleNewRequest);
  }, [socket]);

  const respond = async (requestId, action) => {
    setActingOn(requestId);
    try {
      await api.post(`/follow/requests/${requestId}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Follow requests</h1>
        <Link to="/" className="text-sm text-brand hover:underline">
          Back to home
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {!loading && requests.length === 0 && (
        <p className="text-sm text-gray-500">No pending follow requests.</p>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <img
                src={r.requester.avatar?.url || "https://placehold.co/40x40?text=?"}
                alt={r.requester.username}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium">@{r.requester.username}</p>
                {r.requester.fullName && (
                  <p className="text-xs text-gray-500">{r.requester.fullName}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => respond(r.id, "accept")}
                disabled={actingOn === r.id}
                className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-light disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => respond(r.id, "reject")}
                disabled={actingOn === r.id}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowRequests;
