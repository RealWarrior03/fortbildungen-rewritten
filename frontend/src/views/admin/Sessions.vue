<template>
  <div class="sessions-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>{{ $t('admin.sessions.title') }}</h1>
      <button class="btn btn-primary" @click="showNewSessionModal">
        <i class="bi bi-plus-circle"></i> {{ $t('admin.sessions.new') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">{{ $t('common.loading') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Sessions grouped by Course -->
    <div v-else>
      <div v-for="course in groupedSessions" :key="course.id" class="course-sessions mb-4">
        <div class="card">
          <div class="card-header bg-light">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                {{ currentLanguage === 'de' ? course.title_de : course.title_en }}
              </h5>
              <button 
                class="btn btn-sm btn-outline-primary"
                @click="showNewSessionModal(course.id)"
              >
                <i class="bi bi-plus-circle"></i> {{ $t('admin.sessions.addSession') }}
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>{{ $t('admin.sessions.date') }}</th>
                    <th>{{ $t('admin.sessions.time') }}</th>
                    <th>{{ $t('admin.sessions.location') }}</th>
                    <th>{{ $t('admin.sessions.participants') }}</th>
                    <th>{{ $t('admin.sessions.status') }}</th>
                    <th>{{ $t('admin.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="session in course.sessions" :key="session.id">
                    <td>{{ formatDate(session.date_time) }}</td>
                    <td>{{ formatTime(session.date_time) }}</td>
                    <td>{{ session.location }}</td>
                    <td>
                      <span :class="getParticipantsClass(session)">
                        {{ session.participant_count }} / {{ session.max_participants }}
                      </span>
                    </td>
                    <td>
                      <span :class="['badge', getStatusClass(session)]">
                        {{ getStatusText(session) }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group">
                        <button 
                          class="btn btn-sm btn-outline-primary"
                          @click="editSession(session)"
                          :title="$t('common.edit')"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-info"
                          @click="viewParticipants(session)"
                          :title="$t('admin.sessions.viewParticipants')"
                        >
                          <i class="bi bi-people"></i>
                        </button>
                        <button 
                          class="btn btn-sm btn-outline-danger"
                          @click="confirmDeleteSession(session)"
                          :title="$t('common.delete')"
                          :disabled="session.participant_count > 0"
                          v-if="session.participant_count === 0"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="course.sessions.length === 0">
                    <td colspan="7" class="text-center text-muted py-3">
                      {{ $t('admin.sessions.noSessions') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- No Courses Message -->
      <div v-if="Object.keys(groupedSessions).length === 0" class="text-center my-4 text-muted">
        {{ $t('admin.sessions.noCourses') }}
      </div>
    </div>

    <!-- Session Modal -->
    <SessionModal
      v-if="showModal"
      :session="selectedSession"
      :courseId="selectedCourseId"
      :courses="courses"
      @save="saveSession"
      @close="showModal = false"
    />

    <!-- Participants Modal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :session="selectedSession"
      @close="showParticipantsModal = false"
    />
  </div>
</template>

<script>
import api from '@/services/api';
import SessionModal from '@/components/admin/SessionModal.vue';
import ParticipantsModal from '@/components/admin/ParticipantsModal.vue';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

export default {
  name: 'SessionsManagement',
  components: {
    SessionModal,
    ParticipantsModal
  },
  data() {
    return {
      sessions: [],
      courses: [],
      loading: true,
      error: null,
      showModal: false,
      showParticipantsModal: false,
      selectedSession: null,
      selectedCourseId: null
    };
  },
  computed: {
    currentLanguage() {
      return this.$i18n.locale;
    },
    groupedSessions() {
      const grouped = {};
      this.courses.forEach(course => {
        grouped[course.id] = {
          ...course,
          sessions: this.sessions.filter(session => session.course_id === course.id)
            .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
        };
      });
      return grouped;
    }
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        const [coursesResponse, sessionsResponse] = await Promise.all([
          api.getAllCourses(),
          api.getSessions()
        ]);
        this.courses = coursesResponse.data;
        this.sessions = sessionsResponse.data;
        this.loading = false;
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        this.error = 'Fehler beim Laden der Daten';
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return format(new Date(dateString), 'P', {
        locale: this.currentLanguage === 'de' ? de : enUS
      });
    },
    formatTime(dateString) {
      return format(new Date(dateString), 'HH:mm');
    },
    getParticipantsClass(session) {
      const course = this.courses.find(c => c.id === session.course_id);
      const ratio = session.participant_count / course.max_participants;
      return {
        'badge bg-success': ratio < 0.8,
        'badge bg-warning': ratio >= 0.8 && ratio < 1,
        'badge bg-danger': ratio >= 1
      };
    },
    getStatusClass(session) {
      const now = new Date();
      const sessionDate = new Date(session.date_time);
      return {
        'bg-success': sessionDate > now,
        'bg-secondary': sessionDate <= now
      };
    },
    getStatusText(session) {
      const now = new Date();
      const sessionDate = new Date(session.date_time);
      return sessionDate > now ? 
        this.$t('admin.sessions.upcoming') : 
        this.$t('admin.sessions.completed');
    },
    showNewSessionModal(courseId = null) {
      this.selectedSession = null;
      this.selectedCourseId = courseId;
      this.showModal = true;
    },
    editSession(session) {
      this.selectedSession = { ...session };
      this.showModal = true;
    },
    viewParticipants(session) {
      this.selectedSession = session;
      this.showParticipantsModal = true;
    },
    async confirmDeleteSession(session) {
      if (session.participant_count > 0) {
        alert(this.$t('admin.sessions.cannotDeleteWithParticipants'));
        return;
      }
      
      if (confirm(this.$t('admin.sessions.confirmDelete'))) {
        try {
          await api.deleteSession(session.id);
          await this.loadData();
        } catch (error) {
          console.error('Fehler beim Löschen des Termins:', error);
          alert(this.$t('admin.sessions.deleteError'));
        }
      }
    },
    async saveSession(sessionData) {
      try {
        if (sessionData.id) {
          await api.updateSession(sessionData.id, sessionData);
        } else {
          await api.createSession(sessionData);
        }
        this.showModal = false;
        await this.loadData();
      } catch (error) {
        console.error('Fehler beim Speichern des Termins:', error);
        alert(this.$t('admin.sessions.saveError'));
      }
    }
  }
};
</script>

<style scoped>
.btn-group .btn {
  padding: 0.25rem 0.5rem;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5em 0.75em;
}
</style> 