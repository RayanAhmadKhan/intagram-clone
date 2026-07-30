import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getUserPostsApi } from "../services/postService";
import FollowButton from "../components/FollowButton";
import PostGrid from "../components/PostGrid";
import { SkeletonProfileHeader } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // User list modal state
  const [modalTitle, setModalTitle] = useState("");
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/users/${username}`);
      setProfile(data.data.profile);

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

  const openUserListModal = async (type) => {
    if (!profile) return;
    setModalTitle(type === "followers" ? "Followers" : "Following");
    setShowModal(true);
    setModalLoading(true);
    try {
      const { data } = await api.get(`/follow/${profile.id}/${type}`);
      setModalUsers(data?.data?.users || []);
    } catch (err) {
      console.error(`Failed to load ${type}`, err);
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!profile) return;
    const targetUser = {
      _id: profile.id || profile._id,
      username: profile.username,
      avatar: profile.avatar,
      fullName: profile.fullName,
    };
    navigate("/messages", { state: { targetUser } });
  };

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

        {/* Clickable Followers / Following */}
        <div className="mt-4 flex gap-6 text-sm">
          <span>
            <strong>{posts.length}</strong> posts
          </span>

          {canSeePosts ? (
            <button
              onClick={() => openUserListModal("followers")}
              className="hover:underline text-left cursor-pointer"
            >
              <strong>{profile.followersCount}</strong> followers
            </button>
          ) : (
            <span>
              <strong>{profile.followersCount}</strong> followers
            </span>
          )}

          {canSeePosts ? (
            <button
              onClick={() => openUserListModal("following")}
              className="hover:underline text-left cursor-pointer"
            >
              <strong>{profile.followingCount}</strong> following
            </button>
          ) : (
            <span>
              <strong>{profile.followingCount}</strong> following
            </span>
          )}
        </div>

        {canSeePosts && profile.bio && <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>}
        {!canSeePosts && (
          <p className="mt-3 text-sm text-gray-400">
            This account is private. Follow to see their bio and posts.
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          {profile.isOwnProfile ? (
            <Link
              to="/profile"
              className="inline-block rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit profile
            </Link>
          ) : (
            <>
              <FollowButton userId={profile.id} initialStatus={followStatus} onChange={load} />
              <button
                onClick={handleStartChat}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 transition"
              >
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {canSeePosts ? (
        <div>
          <h2 className="text-sm font-semibold uppercase text-gray-400 mb-3 tracking-wider">Posts</h2>
          <PostGrid posts={posts} />
        </div>
      ) : (
        <EmptyState icon="🔒" title="This account is private" subtitle="Follow to view their posts." />
      )}

      {/* Modal for Followers / Following List */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base">{modalTitle}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {modalLoading ? (
              <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
            ) : modalUsers.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No users found.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-3">
                {modalUsers.map((u) => (
                  <div
                    key={u._id || u.id}
                    onClick={() => {
                      setShowModal(false);
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

export default UserProfile;