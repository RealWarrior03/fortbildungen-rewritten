import { createI18n } from 'vue-i18n';

const messages = {
  de: {
    nav: {
      home: 'Startseite',
      courses: 'Fortbildungen',
      admin: 'Administration'
    },
    common: {
      loading: 'Wird geladen...'
    },
    courses: {
      title: 'Verfügbare Fortbildungen',
      noCoursesAvailable: 'Keine Fortbildungen verfügbar'
    },
    admin: {
      courseTitle: 'Kurstitel',
      courseDescription: 'Beschreibung',
      courseActive: 'Kurs aktiv',
      newCourse: 'Neuer Kurs',
      editCourse: 'Kurs bearbeiten',
      status: 'Status',
      active: 'Aktiv',
      inactive: 'Inaktiv',
      actions: 'Aktionen',
      confirmDeleteCourse: 'Möchten Sie diesen Kurs wirklich löschen?'
    }
  },
  en: {
    // Englische Übersetzungen hier
  }
};

export default createI18n({
  locale: 'de', // Standardsprache
  fallbackLocale: 'de',
  messages
}); 