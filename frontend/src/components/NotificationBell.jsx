import { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";

const labelFor = (n) => {
  switch (n.type) {
    case "like":
      return `@${n.sender} liked your post.`;
    case "comment":
      return `@${n.sender} commented on your post.`;
    case "follow":
      return `@${n.sender} started following you.`;
    case "follow_request":
      return `@${n.sender} requested to follow you.`;
    case "follow_accepted":
      return `@${n.sender} accepted your follow request.`;
    default:
      return n.message || n.text || "New activity";
  }
};

const NotificationBell = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload) => {
      setNotifications((prev) => [
        { id: payload.id || `${Date.now()}-${Math.random()}`, read: false, ...payload },
        ...prev,
      ]);
    };

    socket.on("notification:new", handleNotification);
    socket.on("notification:received", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("notification:received", handleNotification);
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!open) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="relative text-sm font-medium text-brand hover:underline">
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                  {labelFor(n)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;