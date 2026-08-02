import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";
import { SkeletonRow } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const FollowRequests = () => {
  const socket = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/follow/requests");
      setRequests(data?.data?.requests || data?.requests || []);
    } catch (err) {
      console.error("Failed to load follow requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Live socket listeners: incoming request & request cancelled
  useEffect(() => {
    if (!socket) return;

    // 1. Live: add incoming request
    const handleNewRequest = (payload) => {
      setRequests((prev) => {
        const reqId = payload.id || payload._id;
        if (prev.some((r) => (r.id || r._id) === reqId)) return prev; // avoid dupes
        return [
          {
            id: reqId,
            requester: payload.requester || payload.from || payload,
            createdAt: payload.createdAt || new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    const handleCanceledRequest = (payload) => {
      const canceledRequesterId = payload.requesterId || payload.id || payload._id;
      const canceledRequestId = payload.requestId;

      setRequests((prev) =>
        prev.filter((r) => {
          const reqId = r.id || r._id;
          const reqUserId = r.requester?._id || r.requester?.id || r.requester;

          if (canceledRequestId && reqId === canceledRequestId) return false;
          if (canceledRequesterId && reqUserId === canceledRequesterId) return false;
          return true;
        })
      );
    };

    socket.on("follow:request", handleNewRequest);
    socket.on("follow_request", handleNewRequest);
    socket.on("follow:canceled", handleCanceledRequest);
    socket.on("follow_canceled", handleCanceledRequest);

    return () => {
      socket.off("follow:request", handleNewRequest);
      socket.off("follow_request", handleNewRequest);
      socket.off("follow:canceled", handleCanceledRequest);
      socket.off("follow_canceled", handleCanceledRequest);
    };
  }, [socket]);

  const respond = async (requestId, action) => {
    setActingOn(requestId);
    try {
      await api.post(`/follow/requests/${requestId}/${action}`);
      setRequests((prev) => prev.filter((r) => (r.id || r._id) !== requestId));
    } catch (err) {
      console.error(`Failed to ${action} request`, err);
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

      {loading && (
        <div className="space-y-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}
      {!loading && requests.length === 0 && (
        <EmptyState icon="✓" title="No pending follow requests" />
      )}

      <div className="space-y-3">
        {requests.map((r) => {
          const reqId = r.id || r._id;
          const requester = r.requester || r.from || {};

          return (
            <div
              key={reqId}
              className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={requester.avatar?.url || requester.avatar || "https://placehold.co/40x40?text=?"}
                  alt={requester.username || "user"}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">@{requester.username}</p>
                  {requester.fullName && (
                    <p className="text-xs text-gray-500">{requester.fullName}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => respond(reqId, "accept")}
                  disabled={actingOn === reqId}
                  className="rounded-lg bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-light disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond(reqId, "reject")}
                  disabled={actingOn === reqId}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowRequests;