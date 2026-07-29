import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";

const FeedPost = ({ post }) => {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(post.isLikedByViewer);
  const [liking, setLiking] = useState(false);

  const socket = useSocket();
  const media = post.media?.[mediaIndex];
  const postId = String(post.id || post._id);

  // Sync state when props change
  useEffect(() => {
    setLikesCount(post.likesCount);
    setIsLiked(post.isLikedByViewer);
  }, [post.likesCount, post.isLikedByViewer]);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket || !postId) return;

    const eventName = `post:${postId}:like`;

    const handleRealtimeLike = (data) => {
      console.log("🔔 Real-time like event received:", data);
      if (data.likesCount !== undefined) {
        setLikesCount(data.likesCount);
      }
    };

    socket.on(eventName, handleRealtimeLike);

    return () => {
      socket.off(eventName, handleRealtimeLike);
    };
  }, [socket, postId]);

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const { data } = prevLiked
        ? await api.delete(`/posts/${postId}/like`)
        : await api.post(`/posts/${postId}/like`);

      if (data?.data) {
        setLikesCount(data.data.likesCount);
        setIsLiked(data.data.isLikedByViewer);
      }
    } catch (err) {
      // Revert if API request fails
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <Link to={`/u/${post.owner?.username}`} className="flex items-center gap-2">
          <img
            src={post.owner?.avatar?.url || "https://placehold.co/32x32?text=?"}
            alt={post.owner?.username || "user"}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="text-sm font-medium">@{post.owner?.username}</span>
        </Link>
      </div>

      <Link to={`/posts/${postId}`} className="relative block bg-black">
        {media?.resourceType === "video" ? (
          <video src={media.url} className="max-h-[500px] w-full object-contain" muted />
        ) : (
          <img src={media?.url} alt="" className="max-h-[500px] w-full object-contain" />
        )}

        {post.media?.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {post.media.map((_, i) => (
              <span
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setMediaIndex(i);
                }}
                className={`h-1.5 w-1.5 rounded-full ${i === mediaIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="px-4 py-3">
        <button
          onClick={toggleLike}
          disabled={liking}
          className={`mb-1 flex items-center gap-1.5 text-sm font-medium transition disabled:opacity-50 ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>{isLiked ? "♥" : "♡"}</span>
          <span>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </span>
        </button>

        {post.caption && <p className="text-sm text-gray-700">{post.caption}</p>}

        <Link to={`/posts/${postId}`} className="mt-1 inline-block text-xs text-gray-400 hover:underline">
          View all {post.commentsCount || 0} comments
        </Link>
      </div>
    </div>
  );
};

export default FeedPost;