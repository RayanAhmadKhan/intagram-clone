import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { getUserPostsApi } from "../services/postService";
import FormInput from "../components/FormInput";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(user?.avatar?.url || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (user?.username) {
      getUserPostsApi(user.username)
        .then((res) => {
          const fetchedPosts = res.data?.posts || res.posts || res.data || [];
          setPosts(fetchedPosts);
        })
        .catch((err) => console.error("Could not fetch user posts:", err))
        .finally(() => setLoadingPosts(false));
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.put("/users/profile", { fullName, bio, isPrivate });

      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        await api.post("/users/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await refreshUser();
      setMessage("Profile updated successfully.");
      setAvatarFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit profile</h1>
        <Link to="/" className="text-sm text-brand hover:underline">
          Back to home
        </Link>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border bg-white p-6 shadow-sm mb-8">
        {message && (
          <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
        )}
        {error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="mb-6 flex items-center gap-4">
          <img
            src={preview || "https://placehold.co/80x80?text=?"}
            alt="Avatar preview"
            className="h-20 w-20 rounded-full object-cover"
          />
          <label className="cursor-pointer text-sm font-medium text-brand hover:underline">
            Change photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Username: <span className="font-medium text-gray-700">@{user?.username}</span>
        </p>

        <FormInput
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-light"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/150</p>
        </div>

        <label className="mb-6 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private account
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand py-2 font-medium text-white transition hover:bg-brand-light disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* User's Posts Section */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-bold mb-4">Your Posts</h2>
        {loadingPosts ? (
          <p className="text-center text-sm text-gray-500">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-gray-500">You haven't posted anything yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((post) => {
              const mediaUrl = post.media?.[0]?.url || post.mediaUrl;
              return (
                <Link
                  key={post._id}
                  to={`/posts/${post._id}`}
                  className="relative aspect-square bg-gray-100 overflow-hidden group rounded"
                >
                  {mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="p-2 text-xs text-gray-600 truncate">{post.caption}</div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;