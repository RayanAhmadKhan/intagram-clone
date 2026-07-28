import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getUserPostsApi } from "../services/postService";
import FollowButton from "../components/FollowButton";

const UserProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.data.profile);

      // Fetch user's posts
      try {
        const postsRes = await getUserPostsApi(username);
        const fetchedPosts = postsRes.data?.posts || postsRes.posts || postsRes.data || [];
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Failed to load user posts", err);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load this profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!profile) return null;

  const followStatus = profile.isFollowing
    ? "following"
    : profile.hasPendingRequest
    ? "requested"
    : "not_following";

  const canSeePosts = profile.isOwnProfile || profile.isFollowing || !profile.isPrivate;

  return (
    <div className="mx-auto max-w-xl p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-brand hover:underline">
        ← Back to home
      </Link>

      <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar?.url || "https://placehold.co/80x80?text=?"}
            alt={profile.username}
            className="h-20 w-20 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">@{profile.username}</h1>
              {profile.isPrivate && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Private</span>
              )}
            </div>
            {profile.fullName && <p className="text-sm text-gray-500">{profile.fullName}</p>}
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <span>
            <strong>{posts.length}</strong> posts
          </span>
          <span>
            <strong>{profile.followersCount}</strong> followers
          </span>
          <span>
            <strong>{profile.followingCount}</strong> following
          </span>
        </div>

        {canSeePosts && profile.bio && <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>}
        {!canSeePosts && (
          <p className="mt-3 text-sm text-gray-400">
            This account is private. Follow to see their bio and posts.
          </p>
        )}

        <div className="mt-5">
          {profile.isOwnProfile ? (
            <Link
              to="/profile"
              className="inline-block rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit profile
            </Link>
          ) : (
            <FollowButton userId={profile.id} initialStatus={followStatus} onChange={load} />
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {canSeePosts ? (
        <div>
          <h2 className="text-sm font-semibold uppercase text-gray-400 mb-3 tracking-wider">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No posts yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              

          {posts.map((post) => {
            const postId = post._id || post.id; // Handles both MongoDB _id and id
            const mediaUrl = post.media?.[0]?.url || post.mediaUrl;

          return (
          <Link
            key={postId}
            to={`/posts/${postId}`} // Creates /posts/65a12345... instead of /posts/undefined
            className="relative aspect-square bg-gray-100 overflow-hidden rounded group"
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
      ) : (
        <div className="text-center py-10 border rounded-lg bg-gray-50 text-sm text-gray-500">
          This account is private. Follow to view posts.
        </div>
      )}
    </div>
  );
};

export default UserProfile;