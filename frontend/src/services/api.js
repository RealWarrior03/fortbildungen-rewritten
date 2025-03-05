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
  createCourse(courseData) {
    return api.post('/courses', courseData);
  },
  updateCourse(id, courseData) {
    return api.put(`/courses/${id}`, courseData);
  },
  deleteCourse(id) {
    return api.delete(`/courses/${id}`);
  },

  // Termine
  getSessionsByCourse(courseId) {
    return api.get(`/sessions/course/${courseId}`);
  },
  createSession(sessionData) {
    return api.post('/sessions', sessionData);
  },
  updateSession(id, sessionData) {
    return api.put(`/sessions/${id}`, sessionData);
  },
  deleteSession(id) {
    return api.delete(`/sessions/${id}`);
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
    return api.get('/persons');
  },
  createPerson(personData) {
    return api.post('/persons', personData);
  },

  // Admin
  adminLogin(credentials) {
    return api.post('/admin/login', credentials);
  },
  getAdminDashboard() {
    return api.get('/admin/dashboard');
  }
};