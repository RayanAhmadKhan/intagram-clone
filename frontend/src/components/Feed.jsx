import { useEffect, useState } from "react";
import api from "../services/api";
import FeedPost from "./FeedPost";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = async (pageNum) => {
    const { data } = await api.get(`/feed?page=${pageNum}&limit=10`);
    return data.data;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { posts: firstPage, pagination } = await loadPage(1);
        setPosts(firstPage);
        setHasMore(pagination.hasMore);
        setPage(1);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your feed.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { posts: morePosts, pagination } = await loadPage(nextPage);
      setPosts((prev) => [...prev, ...morePosts]);
      setHasMore(pagination.hasMore);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <p className="py-6 text-center text-sm text-gray-400">Loading your feed...</p>;
  }

  if (error) {
    return <p className="py-6 text-center text-sm text-red-500">{error}</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No posts yet — follow some people (or make your own post) to see something here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
};

export default Feed;
