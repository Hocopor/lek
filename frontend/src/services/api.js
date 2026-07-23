import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const login = (password) => api.post('/login', { password });

export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const getProject = (id) => api.get(`/projects/${id}`);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const uploadLectures = (projectId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post(`/projects/${projectId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getLectures = (projectId) => api.get(`/projects/${projectId}/lectures`);
export const getLecture = (id) => api.get(`/lectures/${id}`);
export const processLecture = (id, options) => api.post(`/lectures/${id}/process`, options);
export const deleteLecture = (id) => api.delete(`/lectures/${id}`);

export const downloadLecture = (id) =>
  api.get(`/lectures/${id}/download`, { responseType: 'blob' });

export const getProjectSummary = (projectId) => api.get(`/projects/${projectId}/summary`);

export default api;
