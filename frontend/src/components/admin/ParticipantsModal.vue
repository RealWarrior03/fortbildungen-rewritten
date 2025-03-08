<template>
  <div class="modal d-block" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ $t('admin.sessions.participants') }} - {{ sessionInfo }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        
        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="loading" class="text-center my-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">{{ $t('common.loading') }}</span>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="alert alert-danger">
            {{ error }}
          </div>

          <!-- Participants List -->
          <div v-else>
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="participant-count">
                {{ $t('admin.sessions.participantCount', { 
                  current: participants.length, 
                  max: session.max_participants 
                }) }}
              </div>
              
              <!-- Export Button -->
              <button 
                class="btn btn-outline-primary btn-sm"
                @click="exportParticipants"
                :disabled="participants.length === 0"
              >
                <i class="bi bi-download me-1"></i>
                {{ $t('common.export') }}
              </button>
            </div>

            <div class="table-responsive">
              <table class="table table-hover" v-if="participants.length > 0">
                <thead>
                  <tr>
                    <th>{{ $t('admin.persons.name') }}</th>
                    <th>{{ $t('admin.persons.email') }}</th>
                    <th>{{ $t('admin.persons.department') }}</th>
                    <th>{{ $t('admin.sessions.registrationDate') }}</th>
                    <th v-if="allowDelete">{{ $t('admin.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="participant in participants" :key="participant.registration_id">
                    <td>{{ participant.name }}</td>
                    <td>
                      <a :href="'mailto:' + participant.email">
                        {{ participant.email }}
                      </a>
                    </td>
                    <td>{{ participant.department }}</td>
                    <td>{{ formatDate(participant.registration_date) }}</td>
                    <td v-if="allowDelete">
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click="confirmDeleteRegistration(participant)"
                        :title="$t('admin.sessions.removeParticipant')"
                      >
                        <i class="bi bi-person-x"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- No Participants Message -->
              <div v-else class="text-center text-muted my-4">
                {{ $t('admin.sessions.noParticipants') }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

export default {
  name: 'ParticipantsModal',
  props: {
    session: {
      type: Object,
      required: true
    },
    allowDelete: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: true,
      error: null,
      participants: []
    };
  },
  computed: {
    currentLanguage() {
      return this.$i18n.locale;
    },
    sessionInfo() {
      const date = format(new Date(this.session.date_time), 'Pp', {
        locale: this.currentLanguage === 'de' ? de : enUS
      });
      return `${this.session.course_title_de} (${date})`;
    }
  },
  async created() {
    await this.loadParticipants();
  },
  methods: {
    async loadParticipants() {
      try {
        const response = await api.getSessionParticipants(this.session.id);
        this.participants = response.data;
        this.loading = false;
      } catch (error) {
        console.error('Fehler beim Laden der Teilnehmer:', error);
        this.error = this.$t('admin.sessions.loadError');
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return format(new Date(dateString), 'Pp', {
        locale: this.currentLanguage === 'de' ? de : enUS
      });
    },
    async confirmDeleteRegistration(participant) {
      if (confirm(this.$t('admin.sessions.confirmRemoveParticipant'))) {
        try {
          await api.deleteRegistration(participant.registration_id);
          await this.loadParticipants();
        } catch (error) {
          console.error('Fehler beim Entfernen des Teilnehmers:', error);
          alert(this.$t('admin.sessions.removeError'));
        }
      }
    },
    exportParticipants() {
      // CSV-Daten vorbereiten
      const headers = [
        this.$t('admin.persons.name'),
        this.$t('admin.persons.email'),
        this.$t('admin.persons.department'),
        this.$t('admin.sessions.registrationDate')
      ];
      
      const csvData = this.participants.map(p => [
        p.name,
        p.email,
        p.department,
        this.formatDate(p.registration_date)
      ]);

      // CSV erstellen
      const csv = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Download initiieren
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `teilnehmer_${this.session.id}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.click();
    }
  }
}
</script> 