import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

function getApiBaseUrl() {
  const resolved = new URL(api.defaults.baseURL, window.location.origin);
  resolved.pathname = `${resolved.pathname.replace(/\/+$/, '')}/`;
  return resolved;
}

export function getApiUrl(path) {
  return new URL(path.replace(/^\/+/, ''), getApiBaseUrl()).href;
}

export function getPublicFileUrl(path) {
  const apiBase = new URL(api.defaults.baseURL, window.location.origin);
  return new URL(path, apiBase.origin).href;
}

const getData = async (path, config) => {
  const response = await api.get(path, config);
  return response.data.data;
};

export const portfolioApi = {
  getProfile: (config) => getData('/profile', config),
  getSkills: (config) => getData('/skills', config),
  getEducation: (config) => getData('/education', config),
  getExperience: (config) => getData('/experience', config),
  getProjects: (config) => getData('/projects', config),
  getProject: (slug, config) => getData(`/projects/${encodeURIComponent(slug)}`, config),
  getCertifications: (config) => getData('/certifications', config),
  getAchievements: (config) => getData('/achievements', config),
  getResume: (config) => getData('/resume', config),
  downloadResume: (config) => api.get('/resume/download', { ...config, responseType: 'blob' }),
  submitContact: async (form) => {
    const response = await api.post('/contact', form);
    return response.data;
  },
};

const adminResourcePaths = {
  profile: '/profile',
  skills: '/skills',
  education: '/education',
  experience: '/experience',
  projects: '/projects',
  certifications: '/certifications',
  achievements: '/achievements',
  socialLinks: '/social-links',
};

export const adminApi = {
  getSetupStatus: () => getData('/auth/setup-status'),
  createInitialAdmin: (payload) => api.post('/auth/setup', payload).then((response) => response.data),
  getDashboard: () => getData('/auth/dashboard'),
  getResource: async (resource) => {
    const response = await api.get(adminResourcePaths[resource]);
    if (resource === 'profile') return response.data.data.profile;
    if (resource === 'skills') return Object.values(response.data.data).flat();
    return response.data.data;
  },
  saveResource: (resource, id, payload) => {
    const endpoint = adminResourcePaths[resource];
    return resource === 'profile'
      ? api.put(endpoint, payload).then((response) => response.data)
      : id
      ? api.put(`${endpoint}/${id}`, payload).then((response) => response.data)
      : api.post(endpoint, payload).then((response) => response.data);
  },
  deleteResource: (resource, id) => {
    const endpoint = adminResourcePaths[resource];
    return api.delete(resource === 'profile' ? endpoint : `${endpoint}/${id}`)
      .then((response) => response.data);
  },
  uploadProfileImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/profile/image', form).then((response) => response.data);
  },
  uploadProjectImage: (id, file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post(`/projects/${id}/image`, form).then((response) => response.data);
  },
  uploadCertificationDocument: (id, file) => {
    const form = new FormData();
    form.append('document', file);
    return api.post(`/certifications/${id}/document`, form).then((response) => response.data);
  },
  getMessages: async () => {
    const response = await api.get('/contact');
    return response.data.data;
  },
  updateMessageRead: (id, isRead) => (
    api.patch(`/contact/${id}/read`, { is_read: isRead }).then((response) => response.data)
  ),
  deleteMessage: (id) => api.delete(`/contact/${id}`).then((response) => response.data),
  getResume: async () => {
    const response = await api.get('/resume');
    return response.data.data;
  },
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/resume/upload', form).then((response) => response.data);
  },
  downloadResume: () => api.get('/resume/download', { responseType: 'blob' }),
};

export default api;
