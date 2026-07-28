import axios from 'axios';

const API = axios.create({
  baseURL: '/api/posts', // Vite proxy forwards /api/posts to http://localhost:5000/api/posts
  withCredentials: true,
});

export const createPostApi = async (formData) => {
  // Use '' instead of '/' so it sends POST to /api/posts directly
  const { data } = await API.post('', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getPostByIdApi = async (id) => {
  const { data } = await API.get(`/${id}`);
  return data;
};

export const getUserPostsApi = async (username) => {
  const { data } = await API.get(`/user/${username}`);
  return data;
};

export const updatePostApi = async (id, caption) => {
  const { data } = await API.put(`/${id}`, { caption });
  return data;
};

export const deletePostApi = async (id) => {
  const { data } = await API.delete(`/${id}`);
  return data;
};

export const likePostApi = async (id) => {
  const { data } = await API.post(`/${id}/like`);
  return data;
};

export const unlikePostApi = async (id) => {
  const { data } = await API.delete(`/${id}/like`);
  return data;
};