import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";

const FeedPost = ({ post }) => {
  const navigate = useNavigate();
  const [mediaIndex, setMediaIndex] = useState(0);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByViewer);
  const [liking, setLiking] = useState(false);

  // Likes Modal state
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesUsers, setLikesUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const socket = useSocket();
  const media = post.media?.[mediaIndex];
  const postId = String(post.id || post._id);

  useEffect(() => {
    setLikesCount(post.likesCount);
    setIsLiked(post.isLikedByViewer);
    setCommentsCount(post.commentsCount || 0);
  }, [post.likesCount, post.isLikedByViewer, post.commentsCount]);

  useEffect(() => {
    if (!socket || !postId) return;

    const handleRealtimeLike = (data) => {
      if (data.likesCount !== undefined) {
        setLikesCount(data.likesCount);
      }
    };

    const handleRealtimeComment = (data) => {
      if (data.commentsCount !== undefined) {
        setCommentsCount(data.commentsCount);
      }
    };

    socket.on(`post:${postId}:like`, handleRealtimeLike);
    socket.on(`post:${postId}:comment`, handleRealtimeComment);

    return () => {
      socket.off(`post:${postId}:like`, handleRealtimeLike);
      socket.off(`post:${postId}:comment`, handleRealtimeComment);
    };
  }, [socket, postId]);

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

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
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    } finally {
      setLiking(false);
    }
  };

  const openLikesModal = async () => {
    setShowLikesModal(true);
    setLoadingLikes(true);
    try {
      const { data } = await api.get(`/posts/${postId}/likes`);
      setLikesUsers(data?.data?.users || []);
    } catch (err) {
      console.error("Failed to load post likes", err);
      setLikesUsers([]);
    } finally {
      setLoadingLikes(false);
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
        <div className="mb-1 flex items-center gap-2">
          {/* Heart toggle button */}
          <button
            onClick={toggleLike}
            disabled={liking}
            className={`text-lg transition disabled:opacity-50 ${
              isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {isLiked ? "♥" : "♡"}
          </button>

          {/* Clickable Likes count list trigger */}
          <button
            onClick={openLikesModal}
            className="text-sm font-medium text-gray-800 hover:underline cursor-pointer"
          >
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </button>
        </div>

        {post.caption && <p className="text-sm text-gray-700">{post.caption}</p>}

        <Link to={`/posts/${postId}`} className="mt-1 inline-block text-xs text-gray-400 hover:underline">
          View all {commentsCount} comments
        </Link>
      </div>

      {/* Modal for Likes List */}
      {showLikesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base">Likes</h3>
              <button
                onClick={() => setShowLikesModal(false)}
                className="text-gray-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {loadingLikes ? (
              <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
            ) : likesUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No likes yet.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-3">
                {likesUsers.map((u) => (
                  <div
                    key={u._id || u.id}
                    onClick={() => {
                      setShowLikesModal(false);
                      navigate(`/u/${u.username}`);
                    }}
                    className="flex items-center gap-3 p-1 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <img
                      src={u.avatar?.url || u.avatar || "https://placehold.co/40x40?text=?"}
                      alt={u.username}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">@{u.username}</p>
                      {u.fullName && <p className="text-xs text-gray-500">{u.fullName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedPost;