<template>
    <div class="course-detail">
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">{{ $t('common.loading') }}</span>
        </div>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else>
        <h1>{{ currentLanguage === 'de' ? course.title_de : course.title_en }}</h1>
        
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">{{ $t('courses.description') }}</h5>
            <p class="card-text">
              {{ currentLanguage === 'de' ? (course.description_de || 'Keine Beschreibung verfügbar') : (course.description_en || 'No description available') }}
            </p>
          </div>
        </div>
        
        <h2>{{ $t('registration.selectSession') }}</h2>
        
        <div v-if="loadingSessions" class="text-center my-3">
          <div class="spinner-border spinner-border-sm" role="status">
            <span class="visually-hidden">{{ $t('common.loading') }}</span>
          </div>
        </div>
        
        <div v-else-if="sessionsError" class="alert alert-danger">
          {{ sessionsError }}
        </div>
        
        <div v-else-if="sessions.length === 0" class="alert alert-info">
          Keine Termine verfügbar.
        </div>
        
        <div v-else class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Datum & Uhrzeit</th>
                <th>Ort</th>
                <th>Verfügbare Plätze</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session.id">
                <td>{{ formatDateTime(session.date_time) }}</td>
                <td>{{ session.location }}</td>
                <td>
                  <span v-if="sessionAvailability[session.id]">
                    {{ sessionAvailability[session.id].available }} / {{ session.max_participants }}
                  </span>
                  <div v-else class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">{{ $t('common.loading') }}</span>
                  </div>
                </td>
                <td>
                  <router-link 
                    :to="`/register/${course.id}?session=${session.id}`" 
                    class="btn btn-primary btn-sm"
                    :disabled="sessionAvailability[session.id] && sessionAvailability[session.id].available <= 0"
                  >
                    {{ $t('courses.register') }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mt-4">
          <router-link to="/courses" class="btn btn-outline-secondary">
            {{ $t('common.back') }}
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '@/services/api';
  
  export default {
    name: 'CourseDetail',
    data() {
      return {
        course: {},
        sessions: [],
        sessionAvailability: {},
        loading: true,
        loadingSessions: true,
        error: null,
        sessionsError: null
      };
    },
    computed: {
      currentLanguage() {
        return this.$i18n.locale;
      }
    },
    async created() {
      const courseId = this.$route.params.id;
      
      try {
        const response = await api.getCourse(courseId);
        this.course = response.data;
        this.loading = false;
        
        this.loadSessions(courseId);
      } catch (error) {
        console.error('Fehler beim Laden des Kurses:', error);
        this.error = 'Fehler beim Laden des Kurses. Bitte versuchen Sie es später erneut.';
        this.loading = false;
      }
    },
    methods: {
      async loadSessions(courseId) {
        try {
          const response = await api.getSessionsByCourse(courseId);
          this.sessions = response.data;
          this.loadingSessions = false;
          
          // Verfügbare Plätze für jeden Termin laden
          this.sessions.forEach(session => {
            this.loadSessionAvailability(session.id);
          });
        } catch (error) {
          console.error('Fehler beim Laden der Termine:', error);
          this.sessionsError = 'Fehler beim Laden der Termine. Bitte versuchen Sie es später erneut.';
          this.loadingSessions = false;
        }
      },
      async loadSessionAvailability(sessionId) {
        try {
          const response = await api.getSession(sessionId + '/available');
          this.$set(this.sessionAvailability, sessionId, response.data);
        } catch (error) {
          console.error(`Fehler beim Laden der Verfügbarkeit für Termin ${sessionId}:`, error);
        }
      },
      formatDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat(this.currentLanguage, {
          dateStyle: 'full',
          timeStyle: 'short'
        }).format(date);
      }
    }
  };
  </script>