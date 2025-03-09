const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IP-Adresse des Clients ermitteln
app.use((req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  next();
});

// Routen
const courseRoutes = require('./routes/courses');
const sessionRoutes = require('./routes/sessions');
const registrationRoutes = require('./routes/registrations');
const personRoutes = require('./routes/persons');
const adminRoutes = require('./routes/admin');
const adminPersonsRouter = require('./routes/admin/persons');
const adminCoursesRouter = require('./routes/admin/courses');
const adminSessionsRouter = require('./routes/admin/sessions');

app.use('/api/courses', courseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/persons', adminPersonsRouter);
app.use('/api/admin/courses', adminCoursesRouter);
app.use('/api/admin/sessions', adminSessionsRouter);

// Basis-Route
app.get('/', (req, res) => {
  res.send('Fortbildungsanmeldungssystem API');
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});