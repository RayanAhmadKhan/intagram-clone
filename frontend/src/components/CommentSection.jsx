import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Edit2, Send, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Reply threads state: { [commentId]: { open: boolean, replies: [], loading: boolean, input: string } }
  const [replyThreads, setReplyThreads] = useState({});

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data?.data?.comments || []);
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
      const created = res.data?.data?.comment;

      if (created) {
        setComments((prev) => [...prev, created]);
      }
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId, isLiked, isReply = false, parentId = null) => {
    const updateTarget = (item) => {
      const current = item.likesCount || 0;
      return {
        ...item,
        likesCount: isLiked ? Math.max(0, current - 1) : current + 1,
        isLikedByViewer: !isLiked,
      };
    };

    if (isReply && parentId) {
      setReplyThreads((prev) => ({
        ...prev,
        [parentId]: {
          ...prev[parentId],
          replies: (prev[parentId]?.replies || []).map((r) => (r.id === commentId ? updateTarget(r) : r)),
        },
      }));
    } else {
      setComments((prev) => prev.map((c) => (c.id === commentId ? updateTarget(c) : c)));
    }

    try {
      if (isLiked) {
        await api.delete(`/comments/${commentId}/like`);
      } else {
        await api.post(`/comments/${commentId}/like`);
      }
    } catch (err) {
      fetchComments();
    }
  };

  const handleSaveEdit = async (id, isReply = false, parentId = null) => {
    if (!editText.trim()) return;
    try {
      const res = await api.put(`/comments/${id}`, { text: editText });
      const updated = res.data?.data?.comment;

      if (isReply && parentId) {
        setReplyThreads((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            replies: (prev[parentId]?.replies || []).map((r) =>
              r.id === id ? { ...r, text: updated?.text || editText } : r
            ),
          },
        }));
      } else {
        setComments((prev) => prev.map((c) => (c.id === id ? { ...c, text: updated?.text || editText } : c)));
      }
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to edit');
    }
  };

  const handleDelete = async (id, isReply = false, parentId = null) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await api.delete(`/comments/${id}`);
      const deletedCount = res.data?.data?.deletedCount || 1;

      if (isReply && parentId) {
        setReplyThreads((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            replies: (prev[parentId]?.replies || []).filter((r) => r.id !== id),
          },
        }));
        // Decrement top-level parent's reply counter
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, repliesCount: Math.max(0, (c.repliesCount || 1) - 1) } : c))
        );
      } else {
        // Parent deletion removes parent + all replies from state
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Reply Toggle & Expand
  const toggleReplyThread = async (commentId) => {
    const thread = replyThreads[commentId] || { open: false, replies: [], loading: false, input: '' };

    if (!thread.open && thread.replies.length === 0) {
      setReplyThreads((prev) => ({
        ...prev,
        [commentId]: { ...thread, open: true, loading: true },
      }));

      try {
        const res = await api.get(`/comments/${commentId}/replies`);
        const fetched = res.data?.data?.replies || [];
        setReplyThreads((prev) => ({
          ...prev,
          [commentId]: { open: true, replies: fetched, loading: false, input: '' },
        }));
      } catch (err) {
        console.error('Failed to load replies:', err);
      }
    } else {
      setReplyThreads((prev) => ({
        ...prev,
        [commentId]: { ...thread, open: !thread.open },
      }));
    }
  };

  const handlePostReply = async (parentId) => {
    const thread = replyThreads[parentId];
    const text = thread?.input?.trim();
    if (!text) return;

    try {
      const res = await api.post(`/comments/${parentId}/replies`, { text });
      const newReply = res.data?.data?.reply;

      if (newReply) {
        setReplyThreads((prev) => ({
          ...prev,
          [parentId]: {
            ...prev[parentId],
            replies: [...(prev[parentId]?.replies || []), newReply],
            input: '',
          },
        }));
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, repliesCount: (c.repliesCount || 0) + 1 } : c))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reply');
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h3 className="text-sm font-semibold mb-3">Comments ({comments.length})</h3>

      {/* Main Comment Input */}
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
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-2">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const thread = replyThreads[comment.id] || { open: false, replies: [], loading: false, input: '' };

            return (
              <div key={comment.id} className="text-xs">
                {/* Parent Comment */}
                <div className="flex gap-2.5 items-start group">
                  <Link to={`/u/${comment.author.username}`}>
                    <img
                      src={comment.author.avatar?.url || comment.author.avatar || 'https://placehold.co/32x32?text=?'}
                      alt={comment.author.username}
                      className="w-7 h-7 rounded-full object-cover border"
                    />
                  </Link>

                  <div className="flex-1">
                    {editingId === comment.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="border px-2 py-1 rounded text-xs flex-1"
                        />
                        <button onClick={() => handleSaveEdit(comment.id)} className="text-blue-600 font-semibold">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p>
                          <Link to={`/u/${comment.author.username}`} className="font-semibold mr-1.5">
                            @{comment.author.username}
                          </Link>
                          {comment.text}
                        </p>

                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          <span>{comment.likesCount || 0} likes</span>
                          <button
                            onClick={() => toggleReplyThread(comment.id)}
                            className="hover:underline font-medium text-gray-500"
                          >
                            Reply
                          </button>
                          {comment.isOwnComment && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditText(comment.text);
                                }}
                                className="hover:underline flex items-center gap-0.5"
                              >
                                <Edit2 className="w-2.5 h-2.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(comment.id)}
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
                    onClick={() => handleToggleLike(comment.id, comment.isLikedByViewer)}
                    className="mt-1 text-gray-400 hover:text-red-500"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        comment.isLikedByViewer ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Reply Toggle Link */}
                <div className="ml-9 mt-1">
                  <button
                    onClick={() => toggleReplyThread(comment.id)}
                    className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
                  >
                    {thread.open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {thread.open
                      ? `Hide ${comment.repliesCount || 0} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`
                      : `View ${comment.repliesCount || 0} ${comment.repliesCount === 1 ? 'reply' : 'replies'}`}
                  </button>
                </div>

                {/* Collapsible Thread Container */}
                {thread.open && (
                  <div className="ml-9 mt-2 pl-2 border-l-2 border-gray-100 space-y-3">
                    {/* Reply Form */}
                    <div className="flex gap-2 items-center my-2">
                      <CornerDownRight className="w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        value={thread.input || ''}
                        onChange={(e) =>
                          setReplyThreads((prev) => ({
                            ...prev,
                            [comment.id]: { ...prev[comment.id], input: e.target.value },
                          }))
                        }
                        placeholder="Write a reply..."
                        className="flex-1 border rounded px-2 py-1 text-xs outline-none"
                      />
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={!thread.input?.trim()}
                        className="text-xs text-blue-600 font-semibold disabled:opacity-40"
                      >
                        Reply
                      </button>
                    </div>

                    {/* Replies */}
                    {thread.loading ? (
                      <p className="text-[10px] text-gray-400">Loading replies...</p>
                    ) : (
                      thread.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2 items-start group">
                          <Link to={`/u/${reply.author.username}`}>
                            <img
                              src={reply.author.avatar?.url || reply.author.avatar || 'https://placehold.co/24x24?text=?'}
                              alt={reply.author.username}
                              className="w-5 h-5 rounded-full object-cover border"
                            />
                          </Link>

                          <div className="flex-1">
                            {editingId === reply.id ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="border px-2 py-0.5 rounded text-xs flex-1"
                                />
                                <button
                                  onClick={() => handleSaveEdit(reply.id, true, comment.id)}
                                  className="text-blue-600 font-semibold"
                                >
                                  Save
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-gray-500">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p>
                                  <Link to={`/u/${reply.author.username}`} className="font-semibold mr-1.5">
                                    @{reply.author.username}
                                  </Link>
                                  {reply.text}
                                </p>

                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                                  <span>{reply.likesCount || 0} likes</span>
                                  {reply.isOwnComment && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingId(reply.id);
                                          setEditText(reply.text);
                                        }}
                                        className="hover:underline flex items-center gap-0.5"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleDelete(reply.id, true, comment.id)}
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
                            onClick={() => handleToggleLike(reply.id, reply.isLikedByViewer, true, comment.id)}
                            className="mt-0.5 text-gray-400 hover:text-red-500"
                          >
                            <Heart
                              className={`w-3 h-3 ${
                                reply.isLikedByViewer ? 'fill-red-500 text-red-500' : ''
                              }`}
                            />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}