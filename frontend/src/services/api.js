import axios from 'axios';

const SERVER_URL = String(process.env.SERVER_URL || '').trim();
const SERVER_PORT = String(process.env.SERVER_PORT || '').trim();

function buildApiUrl() {
  const hasProtocol = /^https?:\/\//i.test(SERVER_URL);
  const base = SERVER_URL
    ? (hasProtocol ? SERVER_URL : `${window.location.protocol}//${SERVER_URL}`)
    : `${window.location.protocol}//${window.location.hostname}`;

  try {
    const parsed = new URL(base);

    if (SERVER_PORT) {
      parsed.port = SERVER_PORT;
    } else if (!parsed.port && window.location.port) {
      parsed.port = window.location.port;
    }

    parsed.pathname = '/api';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch (error) {
    return '/api';
  }
}

const API_URL = buildApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor für Auth-Token
api.interceptors.request.use(config => {
  const authToken = localStorage.getItem('authToken')
    || localStorage.getItem('adminToken')
    || localStorage.getItem('userToken');

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

export default {
  // Kurse
  getCourses() {
    return api.get('/courses');
  },
  getCourse(id) {
    return api.get(`/courses/${id}`);
  },
  getAllCourses() {
    return api.get('/admin/courses');
  },
  createCourse(courseData) {
    return api.post('/admin/courses', courseData);
  },
  updateCourse(id, courseData) {
    return api.put(`/admin/courses/${id}`, courseData);
  },
  deleteCourse(id) {
    return api.delete(`/admin/courses/${id}`);
  },

  // Termine
  getSession(id) {
    return api.get(`/sessions/${id}/available`);
  },
  getSessionsByCourse(courseId) {
    return api.get(`/sessions/course/${courseId}`);
  },
  getSessions() {
    return api.get('/admin/sessions');
  },
  getSessionParticipants(sessionId) {
    return api.get(`/admin/sessions/${sessionId}/participants`);
  },
  createSession(sessionData) {
    return api.post('/admin/sessions', sessionData);
  },
  updateSession(id, sessionData) {
    return api.put(`/admin/sessions/${id}`, sessionData);
  },
  deleteSession(id) {
    return api.delete(`/admin/sessions/${id}`);
  },

  // Anmeldungen
  registerForSession(registrationData) {
    return api.post('/registrations', registrationData);
  },
  getRegistration(id) {
    return api.get(`/registrations/${id}`);
  },
  updateRegistration(id, registrationData) {
    return api.put(`/registrations/${id}`, registrationData);
  },
  deleteRegistration(id) {
    return api.delete(`/registrations/${id}`);
  },

  // Personen
  getPersons() {
    return api.get('/admin/persons');
  },
  getPerson(id) {
    return api.get(`/admin/persons/${id}`);
  },
  createPerson(personData) {
    return api.post('/admin/persons', personData);
  },
  updatePerson(id, personData) {
    return api.put(`/admin/persons/${id}`, personData);
  },
  deletePerson(id) {
    return api.delete(`/admin/persons/${id}`);
  },

  // Login (User + Admin)
  login(credentials) {
    return api.post('/auth/login', credentials);
  },
  getAdminDashboard() {
    return api.get('/admin/dashboard');
  },

  // Legacy aliases
  adminLogin(credentials) {
    return api.post('/auth/login', credentials);
  },
  userLogin(credentials) {
    return api.post('/auth/login', credentials);
  },
  getCurrentUser() {
    return api.get('/auth/me');
  },
  getMyRegistrations() {
    return api.get('/registrations/me');
  },

  searchPersons(query) {
    return api.get(`/persons/search?q=${encodeURIComponent(query)}`);
  }
};