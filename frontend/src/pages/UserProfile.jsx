// import { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import api from "../services/api";
// import { getUserPostsApi } from "../services/postService";
// import FollowButton from "../components/FollowButton";
// import PostGrid from "../components/PostGrid";
// import { SkeletonProfileHeader } from "../components/Skeleton";
// import EmptyState from "../components/EmptyState";

// const UserProfile = () => {
//   const { username } = useParams();
//   const [profile, setProfile] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);

//   const load = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const { data } = await api.get(`/users/${username}`);
//       setProfile(data.data.profile);

//       // Fetch user's posts
//       try {
//         const postsRes = await getUserPostsApi(username);
//         const fetchedPosts = postsRes.data?.posts || postsRes.posts || postsRes.data || [];
//         setPosts(fetchedPosts);
//       } catch (err) {
//         console.error("Failed to load user posts", err);
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Could not load this profile.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [username]);

//   if (loading) {
//     return (
//       <div className="mx-auto max-w-xl p-6">
//         <SkeletonProfileHeader />
//       </div>
//     );
//   }
//   if (error) {
//     return (
//       <div className="mx-auto max-w-xl p-6">
//         <EmptyState icon="⚠" title="Couldn't load this profile" subtitle={error} />
//       </div>
//     );
//   }
//   if (!profile) return null;

//   const followStatus = profile.isFollowing
//     ? "following"
//     : profile.hasPendingRequest
//     ? "requested"
//     : "not_following";

//   const canSeePosts = profile.isOwnProfile || profile.isFollowing || !profile.isPrivate;
//     const handleStartChat = () => {
//     //Navigates directly to your /messages route with target user selected
//    navigate("/messages", { state: { targetUser } });
//  };
//   return (
//     <div className="mx-auto max-w-xl p-6">
//       <Link to="/" className="mb-4 inline-block text-sm text-brand hover:underline">
//         ← Back to home
//       </Link>
//       <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
//        {/* Direct Message Button */}
//                 <button
//                   onClick={handleStartChat}
//                   className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 transition"
//                 >
//                   Message
//                 </button>
//       </div>

//       <div className="rounded-xl border bg-white p-6 shadow-sm mb-6">
//         <div className="flex items-center gap-4">
//           <img
//             src={profile.avatar?.url || "https://placehold.co/80x80?text=?"}
//             alt={profile.username}
//             className="h-20 w-20 rounded-full object-cover"
//           />
//           <div className="flex-1">
//             <div className="flex items-center gap-3">
//               <h1 className="text-lg font-bold">@{profile.username}</h1>
//               {profile.isPrivate && (
//                 <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Private</span>
//               )}
//             </div>
//             {profile.fullName && <p className="text-sm text-gray-500">{profile.fullName}</p>}
//           </div>
//         </div>

//         <div className="mt-4 flex gap-6 text-sm">
//           <span>
//             <strong>{posts.length}</strong> posts
//           </span>
//           <span>
//             <strong>{profile.followersCount}</strong> followers
//           </span>
//           <span>
//             <strong>{profile.followingCount}</strong> following
//           </span>
//         </div>

//         {canSeePosts && profile.bio && <p className="mt-3 text-sm text-gray-700">{profile.bio}</p>}
//         {!canSeePosts && (
//           <p className="mt-3 text-sm text-gray-400">
//             This account is private. Follow to see their bio and posts.
//           </p>
//         )}

//         <div className="mt-5">
//           {profile.isOwnProfile ? (
//             <Link
//               to="/profile"
//               className="inline-block rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Edit profile
//             </Link>
//           ) : (
//             <FollowButton userId={profile.id} initialStatus={followStatus} onChange={load} />
//           )}
//         </div>
//       </div>

//       {/* Posts Grid */}
//       {canSeePosts ? (
//         <div>
//           <h2 className="text-sm font-semibold uppercase text-gray-400 mb-3 tracking-wider">Posts</h2>
//           <PostGrid posts={posts} />
//         </div>
//       ) : (
//         <EmptyState icon="🔒" title="This account is private" subtitle="Follow to view their posts." />
//       )}
      
  
//     </div>
//   );
// };

// export default UserProfile;

// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import api from "../services/api";
// import { getUserPostsApi } from "../services/postService";
// import FollowButton from "../components/FollowButton";
// import PostGrid from "../components/PostGrid";
// import { SkeletonRow } from "../components/Skeleton";

// const UserProfile = () => {
//   const { username } = useParams();
//   const navigate = useNavigate();
//   const { user: currentUser } = useAuth();

//   const [targetUser, setTargetUser] = useState(null);
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const isOwnProfile =
//     currentUser?.username?.toLowerCase() === username?.toLowerCase();

//   useEffect(() => {
//     fetchProfileData();
//   }, [username]);

//   const fetchProfileData = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       // Fetch user profile info
//       const userRes = await api.get(`/users/${username}`);
//       const userData =
//         userRes.data?.user || userRes.data?.data?.user || userRes.data;
//       setTargetUser(userData);

//       // Fetch user posts
//       const postsRes = await getUserPostsApi(username);
//       const fetchedPosts =
//         postsRes.data?.posts || postsRes.posts || postsRes.data || [];
//       setPosts(fetchedPosts);
//     } catch (err) {
//       setError(err.response?.data?.message || "User not found");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartChat = () => {
//     // Navigates directly to your /messages route with target user selected
//     navigate("/messages", { state: { targetUser } });
//   };

//   if (loading) {
//     return (
//       <div className="mx-auto max-w-xl p-6 space-y-4">
//         <SkeletonRow />
//         <SkeletonRow />
//       </div>
//     );
//   }

//   if (error || !targetUser) {
//     return (
//       <div className="mx-auto max-w-xl p-6 text-center">
//         <p className="text-red-500 font-medium">{error || "User not found"}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-xl p-6">
//       {/* Profile Header Info */}
//       <div className="mb-6 flex items-start gap-6">
//         <img
//           src={
//             targetUser.avatar?.url ||
//             targetUser.avatar ||
//             "https://placehold.co/80x80?text=?"
//           }
//           alt={targetUser.username}
//           className="h-20 w-20 rounded-full object-cover border"
//         />

//         <div className="flex-1">
//           <div className="flex items-center gap-3 mb-2 flex-wrap">
//             <h1 className="text-xl font-bold">@{targetUser.username}</h1>

//             {/* Action Buttons */}
//             {isOwnProfile ? (
//               <button
//                 onClick={() => navigate("/profile")}
//                 className="px-3 py-1.5 text-xs font-semibold rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
//               >
//                 Edit Profile
//               </button>
//             ) : (
//               <div className="flex items-center gap-2">
//                 <FollowButton
//                   targetUserId={targetUser._id || targetUser.id}
//                   initialIsFollowing={targetUser.isFollowing}
//                   initialIsRequested={targetUser.isRequested}
//                   onStatusChange={fetchProfileData}
//                 />

//                 {/* Direct Message Button */}
//                 <button
//                   onClick={handleStartChat}
//                   className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 transition"
//                 >
//                   Message
//                 </button>
//               </div>
//             )}
//           </div>

//           {targetUser.fullName && (
//             <p className="font-semibold text-sm">{targetUser.fullName}</p>
//           )}
//           {targetUser.bio && (
//             <p className="text-sm text-gray-600 mt-1">{targetUser.bio}</p>
//           )}
//         </div>
//       </div>

//       {/* User Posts Section */}
//       <div className="border-t pt-6">
//         <h2 className="text-lg font-bold mb-4">Posts</h2>
//         <PostGrid posts={posts} />
//       </div>
//     </div>
//   );
// };

// export default UserProfile;

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

        {/* Action Buttons Container */}
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