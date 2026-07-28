import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Edit2, Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      const data = res.data?.comments || res.data?.data || res.data || [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { text: newComment });
      const created = res.data?.comment || res.data?.data || res.data;
      setComments((prev) => [created, ...prev]);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeToggle = async (commentId, isLiked) => {
    try {
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            const likesArr = c.likes || [];
            const updatedLikes = isLiked
              ? likesArr.filter((id) => id !== user?._id)
              : [...likesArr, user?._id];
            return { ...c, likes: updatedLikes, isLikedByViewer: !isLiked };
          }
          return c;
        })
      );

      if (isLiked) {
        await api.delete(`/comments/${commentId}/like`);
      } else {
        await api.post(`/comments/${commentId}/like`);
      }
    } catch (err) {
      fetchComments(); // Rollback on error
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, { text: editText });
      const updated = res.data?.comment || res.data?.data || res.data;

      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, text: updated.text || editText } : c))
      );
      setEditingCommentId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold mb-3">Comments ({comments.length})</h3>

      {/* Comment Input */}
      <form onSubmit={handleCreateComment} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="bg-brand text-white px-3 py-1.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-2">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const author = comment.author || comment.user || {};
            const isOwner = user?._id === author._id || user?.username === author.username;
            const isLiked = comment.isLikedByViewer || comment.likes?.includes(user?._id);

            return (
              <div key={comment._id} className="flex gap-3 items-start text-xs group">
                <Link to={`/u/${author.username}`}>
                  <img
                    src={author.avatar?.url || author.avatar || 'https://placehold.co/32x32?text=?'}
                    alt={author.username}
                    className="w-7 h-7 rounded-full object-cover border"
                  />
                </Link>

                <div className="flex-1">
                  {editingCommentId === comment._id ? (
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="border px-2 py-1 rounded text-xs flex-1"
                      />
                      <button
                        onClick={() => handleSaveEdit(comment._id)}
                        className="text-blue-600 font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCommentId(null)}
                        className="text-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p>
                        <Link to={`/u/${author.username}`} className="font-semibold mr-1.5">
                          @{author.username}
                        </Link>
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span>{comment.likes?.length || 0} likes</span>
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="hover:underline flex items-center gap-0.5"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="hover:underline text-red-500 flex items-center gap-0.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleLikeToggle(comment._id, isLiked)}
                  className="mt-1"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}