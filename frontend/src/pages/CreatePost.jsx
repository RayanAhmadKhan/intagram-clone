import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { createPostApi } from '../services/postService';

export default function CreatePost() {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      setError('You can upload a maximum of 10 media files');
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    const filePreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...filePreviews]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one media file');
      return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    files.forEach((file) => formData.append('media', file));

    setLoading(true);
    try {
      const res = await createPostApi(formData);
      navigate(`/posts/${res.data.post.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white border rounded-lg shadow-sm mt-6">
      <h2 className="text-xl font-bold mb-4 text-center">Create New Post</h2>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Media Files (1–10)</label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            id="media-input"
          />
          <label
            htmlFor="media-input"
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload images or videos</span>
          </label>

          {previews.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Preview ${i}`}
                  className="w-20 h-20 object-cover rounded border flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows="3"
            placeholder="Write a caption..."
            maxLength={2200}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded text-sm font-semibold hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Publishing...' : 'Share Post'}
        </button>
      </form>
    </div>
  );
}