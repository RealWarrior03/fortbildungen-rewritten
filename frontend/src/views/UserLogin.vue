<template>
  <div class="user-login">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h2 class="mb-0">Login</h2>
          </div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger">
              {{ error }}
            </div>
            <form @submit.prevent="login">
              <div class="mb-3">
                <label for="username" class="form-label">Benutzername</label>
                <input
                  id="username"
                  v-model="credentials.username"
                  type="text"
                  class="form-control"
                  required
                >
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Passwort</label>
                <input
                  id="password"
                  v-model="credentials.password"
                  type="password"
                  class="form-control"
                  required
                >
              </div>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Anmelden
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'UserLogin',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      loading: false,
      error: null
    };
  },
  methods: {
    async login() {
      this.loading = true;
      this.error = null;

      try {
        const response = await api.login(this.credentials);
        const roles = Array.isArray(response.data.roles) ? response.data.roles : ['user'];

        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authUsername', response.data.username || '');
        localStorage.setItem('authDisplayName', response.data.displayName || response.data.username || '');
        localStorage.setItem('authEmail', response.data.email || '');

        // Legacy keys clean-up
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminDisplayName');

        const redirectPath = this.$route.query.redirect || (roles.includes('admin') ? '/admin/dashboard' : '/my-sessions');
        this.$router.push(redirectPath);
      } catch (error) {
        console.error('Login-Fehler:', error);
        if (error.response && error.response.status === 401) {
          this.error = 'Ungueltiger Benutzername oder Passwort';
        } else if (error.response && error.response.status === 403) {
          this.error = 'Keine Berechtigung fuer diese Anwendung';
        } else {
          this.error = 'Fehler beim Login. Bitte spaeter erneut versuchen.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
