import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor für Admin-Token
api.interceptors.request.use(config => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken && config.url.includes('/admin')) {
    config.headers.Authorization = `Bearer ${adminToken}`;
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

  // Admin
  adminLogin(credentials) {
    return api.post('/admin/login', credentials);
  },
  getAdminDashboard() {
    return api.get('/admin/dashboard');
  },

  searchPersons(query) {
    return api.get(`/persons/search?q=${encodeURIComponent(query)}`);
  }
};