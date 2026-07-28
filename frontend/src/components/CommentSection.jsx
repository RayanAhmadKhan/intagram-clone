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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      // Matches Backend: res.data.data.comments
      const fetchedComments = res.data?.data?.comments || [];
      setComments(Array.isArray(fetchedComments) ? fetchedComments : []);
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
      
      // Matches Backend: res.data.data.comment (serialized object with `id`)
      const createdComment = res.data?.data?.comment;

      if (createdComment) {
        setComments((prev) => [createdComment, ...prev]);
      } else {
        fetchComments(); // Fallback re-fetch if response format varies
      }

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
          const cId = c.id || c._id;
          if (cId === commentId) {
            const currentCount = c.likesCount || 0;
            return {
              ...c,
              likesCount: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
              isLikedByViewer: !isLiked,
            };
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
    const commentId = comment.id || comment._id;
    setEditingCommentId(commentId);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, { text: editText });
      const updated = res.data?.data?.comment;

      setComments((prev) =>
        prev.map((c) => {
          const cId = c.id || c._id;
          if (cId === commentId) {
            return { ...c, text: updated?.text || editText };
          }
          return c;
        })
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
      setComments((prev) => prev.filter((c) => (c.id || c._id) !== commentId));
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
            // Handles both backend serialized `id` and raw MongoDB `_id`
            const commentId = comment.id || comment._id;
            const author = comment.author || {};
            const isOwner = comment.isOwnComment || user?._id === author.id || user?._id === author._id;
            const isLiked = comment.isLikedByViewer;

            return (
              <div key={commentId} className="flex gap-3 items-start text-xs group">
                <Link to={`/u/${author.username}`}>
                  <img
                    src={author.avatar?.url || author.avatar || 'https://placehold.co/32x32?text=?'}
                    alt={author.username || 'User'}
                    className="w-7 h-7 rounded-full object-cover border"
                  />
                </Link>

                <div className="flex-1">
                  {editingCommentId === commentId ? (
                    <div className="flex gap-2 items-center mt-1">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="border px-2 py-1 rounded text-xs flex-1"
                      />
                      <button
                        onClick={() => handleSaveEdit(commentId)}
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
                          @{author.username || 'user'}
                        </Link>
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                        <span>{comment.likesCount ?? comment.likes?.length ?? 0} likes</span>
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="hover:underline flex items-center gap-0.5"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(commentId)}
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
                  onClick={() => handleLikeToggle(commentId, isLiked)}
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