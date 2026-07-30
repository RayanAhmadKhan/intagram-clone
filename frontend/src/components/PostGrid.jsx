import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import EmptyState from './EmptyState';

export default function PostGrid({ posts }) {
  if (!posts || posts.length === 0) {
    return <EmptyState icon="▦" title="No posts yet" />;
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4 mt-6">
      {posts.map((post) => (
        <Link
          to={`/posts/${post.id}`}
          key={post.id}
          className="relative aspect-square group bg-gray-100 overflow-hidden"
        >
          {post.media[0]?.resourceType === 'video' ? (
            <video
              src={post.media[0].url}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={post.media[0].url}
              alt={post.caption}
              className="w-full h-full object-cover"
            />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white font-semibold transition-opacity">
            <div className="flex items-center gap-1">
              <Heart className="w-5 h-5 fill-white" />
              <span>{post.likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{post.commentsCount}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}