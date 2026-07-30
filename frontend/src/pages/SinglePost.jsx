import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { getPostByIdApi, likePostApi, unlikePostApi, updatePostApi, deletePostApi } from '../services/postService';
import CommentSection from '../components/CommentSection';
import { useSocket } from '../contexts/SocketContext'; // NEW IMPORT
import { SkeletonPostCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function SinglePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket(); // SOCKET INSTANCE

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid Post ID');
      setLoading(false);
      return;
    }
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Real-time listener for Socket events
  useEffect(() => {
    if (!socket || !id) return;

    const likeEvent = `post:${id}:like`;

    const handleRealtimeLike = (data) => {
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          likesCount: data.likesCount !== undefined ? data.likesCount : prev.likesCount,
        };
      });
    };

    socket.on(likeEvent, handleRealtimeLike);

    return () => {
      socket.off(likeEvent, handleRealtimeLike);
    };
  }, [socket, id]);

  const fetchPost = async () => {
    try {
      const res = await getPostByIdApi(id);
      const postData = res.data?.post || res.post || res.data || res;
      setPost(postData);
      setCaption(postData.caption || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!post) return;

    const previousLikedState = post.isLikedByViewer;
    const previousLikesCount = post.likesCount;

    // Optimistic UI update
    setPost((prev) => ({
      ...prev,
      isLikedByViewer: !previousLikedState,
      likesCount: previousLikedState
        ? Math.max(0, (prev.likesCount || 1) - 1)
        : (prev.likesCount || 0) + 1,
    }));

    try {
      if (previousLikedState) {
        await unlikePostApi(id);
      } else {
        await likePostApi(id);
      }
    } catch (err) {
      // Revert if API request fails
      setPost((prev) => ({
        ...prev,
        isLikedByViewer: previousLikedState,
        likesCount: previousLikesCount,
      }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updatePostApi(id, caption);
      const updatedPost = res.data?.post || res.post || res.data;
      setPost((prev) => ({ ...prev, caption: updatedPost.caption || caption }));
      setIsEditing(false);
      setShowMenu(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update caption');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePostApi(id);
      const ownerUsername = post.owner?.username || post.user?.username;
      if (ownerUsername) {
        navigate(`/u/${ownerUsername}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto my-6">
        <SkeletonPostCard />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-6">
        <EmptyState icon="⚠" title="Couldn't load this post" subtitle={error} />
      </div>
    );
  }
  if (!post) {
    return (
      <div className="max-w-2xl mx-auto my-6">
        <EmptyState icon="○" title="Post not found" />
      </div>
    );
  }

  const owner = post.owner || post.user || {};
  const mediaList = post.media?.length ? post.media : post.mediaUrl ? [{ url: post.mediaUrl, resourceType: 'image' }] : [];

  return (
    <div className="max-w-2xl mx-auto my-6 bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link to={`/u/${owner.username}`} className="flex items-center gap-3">
          <img
            src={owner.avatar?.url || owner.avatar || 'https://placehold.co/40x40?text=?'}
            alt={owner.username || 'user'}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div>
            <p className="font-semibold text-sm">@{owner.username || 'user'}</p>
            {owner.fullName && <p className="text-xs text-gray-500">{owner.fullName}</p>}
          </div>
        </Link>

        {post.isOwnPost && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Display / Carousel */}
      {mediaList.length > 0 && (
        <div className="relative bg-black aspect-square flex items-center justify-center">
          {mediaList[activeMediaIndex]?.resourceType === 'video' ? (
            <video src={mediaList[activeMediaIndex].url} controls className="max-h-full w-full object-contain" />
          ) : (
            <img src={mediaList[activeMediaIndex]?.url} alt="Post content" className="max-h-full w-full object-contain" />
          )}

          {mediaList.length > 1 && (
            <>
              {activeMediaIndex > 0 && (
                <button
                  onClick={() => setActiveMediaIndex((prev) => prev - 1)}
                  className="absolute left-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {activeMediaIndex < mediaList.length - 1 && (
                <button
                  onClick={() => setActiveMediaIndex((prev) => prev + 1)}
                  className="absolute right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Details & Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={handleLikeToggle}>
            <Heart className={`w-7 h-7 ${post.isLikedByViewer ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
        </div>

        <p className="font-semibold text-sm mb-2">{post.likesCount || 0} likes</p>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="mt-2">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows="2"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                Save
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm">
            <span className="font-semibold mr-2">@{owner.username || 'user'}</span>
            {post.caption}
          </p>
        )}

        {/* Comment Section Component */}
        <CommentSection postId={post._id || post.id || id} />
      </div>
    </div>
  );
}