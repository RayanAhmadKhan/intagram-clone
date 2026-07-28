import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

const STORY_DURATION_MS = 5000;

const StoryViewer = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/stories/user/${username}`);
      if (data.data.stories.length === 0) {
        setError("No active stories right now — they may have expired.");
      }
      setStories(data.data.stories);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load stories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (stories.length === 0) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((i) => i + 1);
      } else {
        navigate("/");
      }
    }, STORY_DURATION_MS);
    return () => clearTimeout(timerRef.current);
  }, [index, stories, navigate]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => (index < stories.length - 1 ? setIndex((i) => i + 1) : navigate("/"));

  const handleDelete = async () => {
    const story = stories[index];
    if (!window.confirm("Delete this story now?")) return;
    await api.delete(`/stories/${story.id}`);
    const remaining = stories.filter((s) => s.id !== story.id);
    if (remaining.length === 0) {
      navigate("/");
    } else {
      setStories(remaining);
      setIndex((i) => Math.min(i, remaining.length - 1));
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  if (error || stories.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p>{error}</p>
        <button onClick={() => navigate("/")} className="text-sm underline">
          Back to home
        </button>
      </div>
    );
  }

  const story = stories[index];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative h-full w-full max-w-md">
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded bg-white/30">
              <div
                className={`h-full bg-white ${i < index ? "w-full" : i === index ? "animate-story-progress" : "w-0"}`}
                style={i === index ? { animationDuration: `${STORY_DURATION_MS}ms` } : undefined}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-2 top-6 z-10 flex items-center gap-2 text-white">
          <img
            src={story.owner.avatar?.url || "https://placehold.co/28x28?text=?"}
            alt={story.owner.username}
            className="h-7 w-7 rounded-full border border-white object-cover"
          />
          <span className="text-sm font-medium">@{story.owner.username}</span>
        </div>

        <button onClick={() => navigate("/")} className="absolute right-2 top-6 z-10 text-xl text-white">
          ✕
        </button>

        {story.isOwnStory && (
          <button
            onClick={handleDelete}
            className="absolute bottom-4 right-2 z-10 rounded bg-black/50 px-3 py-1 text-xs text-white"
          >
            Delete
          </button>
        )}

        <button onClick={goPrev} className="absolute left-0 top-0 z-10 h-full w-1/3" aria-label="Previous" />
        <button onClick={goNext} className="absolute right-0 top-0 z-10 h-full w-1/3" aria-label="Next" />

        {story.media.resourceType === "video" ? (
          <video src={story.media.url} autoPlay muted className="h-full w-full object-contain" />
        ) : (
          <img src={story.media.url} alt="" className="h-full w-full object-contain" />
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
