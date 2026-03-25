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
                <th>{{ $t('courses.session') }}</th>
                <th>{{ $t('courses.location') }}</th>
                <th>{{ $t('courses.availablePlaces') }}</th>
                <th>{{ $t('courses.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="session in sessions"
                :key="session.id"
                :class="{ 'table-success': isRegisteredForSession(session.id) }"
              >
                <td>{{ formatDateTime(session.date_time) }}</td>
                <td>{{ session.location }}</td>
                <td>
                  <span v-if="sessionAvailability[session.id]">
                    {{ getAvailableSeats(session.id) }}
                  </span>
                  <div v-else class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">{{ $t('common.loading') }}</span>
                  </div>
                </td>
                <td>
                  <button
                    v-if="isRegisteredForSession(session.id)"
                    class="btn btn-outline-danger btn-sm"
                    :disabled="cancellingSessionId === session.id"
                    @click="cancelRegistrationForSession(session.id)"
                  >
                    <span
                      v-if="cancellingSessionId === session.id"
                      class="spinner-border spinner-border-sm me-1"
                      role="status"
                    ></span>
                    Abmelden
                  </button>
                  <router-link
                    v-else-if="isSessionBookable(session.id)"
                    :to="`/register/${course.id}?session=${session.id}`" 
                    class="btn btn-primary btn-sm"
                  >
                    {{ $t('courses.register') }}
                  </router-link>
                  <button v-else class="btn btn-outline-secondary btn-sm" disabled>
                    Ausgebucht
                  </button>
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
        myRegistrationsBySession: {},
        cancellingSessionId: null,
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

        await Promise.all([
          this.loadSessions(courseId),
          this.loadMyRegistrations()
        ]);
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

          // Verfügbare Plätze für jeden Termin laden
          await Promise.all(this.sessions.map(session => this.loadSessionAvailability(session.id)));
        } catch (error) {
          console.error('Fehler beim Laden der Termine:', error);
          this.sessionsError = 'Fehler beim Laden der Termine. Bitte versuchen Sie es später erneut.';
        } finally {
          this.loadingSessions = false;
        }
      },
      async loadMyRegistrations() {
        const token = localStorage.getItem('authToken')
          || localStorage.getItem('userToken')
          || localStorage.getItem('adminToken');

        if (!token) {
          this.myRegistrationsBySession = {};
          return;
        }

        try {
          const response = await api.getMyRegistrations();
          const bySession = {};

          response.data.forEach(registration => {
            if (registration.session_id) {
              bySession[registration.session_id] = registration;
            }
          });

          this.myRegistrationsBySession = bySession;
        } catch (error) {
          if (error.response?.status !== 401) {
            console.error('Fehler beim Laden der eigenen Anmeldungen:', error);
          }
          this.myRegistrationsBySession = {};
        }
      },
      async loadSessionAvailability(sessionId) {
        try {
          const response = await api.getSession(sessionId);
          this.sessionAvailability[sessionId] = response.data;
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
      },
      getAvailableSeats(sessionId) {
        return this.sessionAvailability[sessionId]?.available ?? 0;
      },
      isSessionBookable(sessionId) {
        return this.getAvailableSeats(sessionId) > 0;
      },
      isRegisteredForSession(sessionId) {
        return Boolean(this.myRegistrationsBySession[sessionId]);
      },
      async cancelRegistrationForSession(sessionId) {
        const registration = this.myRegistrationsBySession[sessionId];
        if (!registration) {
          return;
        }

        const confirmed = window.confirm('Moechten Sie sich von diesem Termin wirklich abmelden?');
        if (!confirmed) {
          return;
        }

        this.cancellingSessionId = sessionId;

        try {
          await api.deleteRegistration(registration.id);
          await Promise.all([
            this.loadMyRegistrations(),
            this.loadSessionAvailability(sessionId)
          ]);
        } catch (error) {
          console.error('Fehler beim Abmelden von Termin:', error);
          if (error.response?.data?.message) {
            this.sessionsError = error.response.data.message;
          } else {
            this.sessionsError = 'Abmeldung konnte nicht durchgeführt werden.';
          }
        } finally {
          this.cancellingSessionId = null;
        }
      }
    }
  };
  </script>