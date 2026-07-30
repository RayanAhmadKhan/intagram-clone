import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { getUserPostsApi } from "../services/postService";
import FollowButton from "../components/FollowButton";
import PostGrid from "../components/PostGrid";
import { SkeletonProfileHeader } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

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

  if (loading) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <SkeletonProfileHeader />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState icon="⚠" title="Couldn't load this profile" subtitle={error} />
      </div>
    );
  }
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
          <PostGrid posts={posts} />
        </div>
      ) : (
        <EmptyState icon="🔒" title="This account is private" subtitle="Follow to view their posts." />
      )}
    </div>
  );
};

export default UserProfile;