<template>
  <div class="my-sessions">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h1 class="mb-0">Meine Termine</h1>
      <button class="btn btn-outline-secondary btn-sm" @click="loadRegistrations" :disabled="loading">
        Aktualisieren
      </button>
    </div>

    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Laden...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="registrations.length === 0" class="alert alert-info">
      Es wurden noch keine Anmeldungen fuer Ihren Benutzer gefunden.
    </div>

    <div v-else class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>Kurs</th>
            <th>Termin</th>
            <th>Ort</th>
            <th>Anmeldung</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in registrations" :key="entry.id">
            <td>{{ currentLanguage === 'de' ? entry.title_de : entry.title_en }}</td>
            <td>{{ formatDateTime(entry.date_time) }}</td>
            <td>{{ entry.location }}</td>
            <td>{{ formatDateTime(entry.registration_time) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'MySessions',
  data() {
    return {
      loading: true,
      error: null,
      registrations: []
    };
  },
  computed: {
    currentLanguage() {
      return this.$i18n.locale;
    }
  },
  async created() {
    await this.loadRegistrations();
  },
  methods: {
    async loadRegistrations() {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.getMyRegistrations();
        this.registrations = response.data;
      } catch (error) {
        console.error('Fehler beim Laden der eigenen Termine:', error);
        if (error.response && error.response.status === 401) {
          this.error = 'Bitte erneut anmelden.';
        } else {
          this.error = 'Termine konnten nicht geladen werden.';
        }
      } finally {
        this.loading = false;
      }
    },
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) {
        return '-';
      }

      const date = new Date(dateTimeStr);
      return new Intl.DateTimeFormat(this.currentLanguage, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    }
  }
};
</script>
