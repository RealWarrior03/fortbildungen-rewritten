import { createI18n } from 'vue-i18n';

const messages = {
  de: {
    nav: {
      home: 'Startseite',
      courses: 'Fortbildungen',
      admin: 'Administration'
    },
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      back: 'Zurück',
      submit: 'Absenden',
      loading: 'Wird geladen...'
    },
    courses: {
      title: 'Verfügbare Fortbildungen',
      register: 'Anmelden',
      details: 'Details anzeigen',
      noCoursesAvailable: 'Keine Fortbildungen verfügbar'
    },
    registration: {
      title: 'Anmeldung zur Fortbildung',
      selectSession: 'Termin auswählen',
      personInfo: 'Persönliche Informationen',
      name: 'Name',
      email: 'E-Mail',
      department: 'Abteilung',
      success: 'Anmeldung erfolgreich',
      error: 'Fehler bei der Anmeldung',
      ipRestriction: 'Sie können diese Anmeldung nur von dem Computer aus bearbeiten, von dem sie erstellt wurde.'
    },
    admin: {
      login: 'Admin-Login',
      dashboard: 'Dashboard',
      courses: 'Kursverwaltung',
      sessions: 'Terminverwaltung',
      registrations: 'Anmeldungsverwaltung',
      persons: 'Personenverwaltung',
      username: 'Benutzername',
      password: 'Passwort',
      loginButton: 'Anmelden'
    }
  },
  en: {
    nav: {
      home: 'Home',
      courses: 'Courses',
      admin: 'Administration'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      back: 'Back',
      submit: 'Submit',
      loading: 'Loading...'
    },
    courses: {
      title: 'Available Courses',
      register: 'Register',
      details: 'Show Details',
      noCoursesAvailable: 'No courses available'
    },
    registration: {
      title: 'Course Registration',
      selectSession: 'Select Session',
      personInfo: 'Personal Information',
      name: 'Name',
      email: 'Email',
      department: 'Department',
      success: 'Registration successful',
      error: 'Registration error',
      ipRestriction: 'You can only edit this registration from the computer it was created on.'
    },
    admin: {
      login: 'Admin Login',
      dashboard: 'Dashboard',
      courses: 'Course Management',
      sessions: 'Session Management',
      registrations: 'Registration Management',
      persons: 'Person Management',
      username: 'Username',
      password: 'Password',
      loginButton: 'Login'
    }
  }
};

const i18n = createI18n({
  locale: 'de',
  fallbackLocale: 'en',
  messages
});

export default i18n;