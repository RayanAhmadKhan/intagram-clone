import api from './api';

export const createPostApi = async (formData) => {
  const { data } = await api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getPostByIdApi = async (id) => {
  const { data } = await api.get(`/posts/${id}`);
  return data;
};

export const getUserPostsApi = async (username) => {
  const { data } = await api.get(`/posts/user/${username}`);
  return data;
};

export const updatePostApi = async (id, caption) => {
  const { data } = await api.put(`/posts/${id}`, { caption });
  return data;
};

export const deletePostApi = async (id) => {
  const { data } = await api.delete(`/posts/${id}`);
  return data;
};

export const likePostApi = async (id) => {
  const { data } = await api.post(`/posts/${id}/like`);
  return data;
};

export const unlikePostApi = async (id) => {
  const { data } = await api.delete(`/posts/${id}/like`);
  return data;
};