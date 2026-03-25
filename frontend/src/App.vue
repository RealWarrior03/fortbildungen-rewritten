<template>
  <div id="app">
    <nav v-if="!isAdminRoute" class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link class="navbar-brand" to="/">{{ $t('nav.home') }}</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/courses">{{ $t('nav.courses') }}</router-link>
            </li>
            <li class="nav-item" v-if="isAuthenticated">
              <router-link class="nav-link" to="/my-sessions">Meine Termine</router-link>
            </li>
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item" v-if="isAdmin">
              <router-link class="nav-link" to="/admin/dashboard">Admin</router-link>
            </li>
            <li class="nav-item" v-if="!isAuthenticated">
              <router-link class="nav-link" to="/login">Login</router-link>
            </li>
            <li class="nav-item" v-else>
              <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div :class="isAdminRoute ? '' : 'container mt-4'">
      <router-view />
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'App',
  data() {
    return {
      now: Date.now(),
      verifiedRoles: []
    };
  },
  computed: {
    isAdminRoute() {
      return this.$route.path.startsWith('/admin');
    },
    isAuthenticated() {
      this.now;
      return Boolean(localStorage.getItem('authToken'));
    },
    isAdmin() {
      return this.verifiedRoles.includes('admin');
    }
  },
  async created() {
    window.addEventListener('storage', this.refreshAuthState);
    await this.refreshAuthFromServer();
  },
  watch: {
    '$route.fullPath': {
      immediate: true,
      handler() {
        this.refreshAuthState();
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.refreshAuthState);
  },
  methods: {
    async refreshAuthState() {
      this.now = Date.now();
      await this.refreshAuthFromServer();
    },
    async refreshAuthFromServer() {
      if (!localStorage.getItem('authToken')) {
        this.verifiedRoles = [];
        return;
      }

      try {
        const response = await api.getCurrentUser();
        this.verifiedRoles = Array.isArray(response.data.roles) ? response.data.roles : [];
      } catch (error) {
        this.verifiedRoles = [];
      }
    },
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRoles');
      localStorage.removeItem('authUsername');
      localStorage.removeItem('authDisplayName');
      localStorage.removeItem('authEmail');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminDisplayName');
      this.verifiedRoles = [];
      this.now = Date.now();
      this.$router.push('/login');
    }
  }
}
</script>

<style lang="scss">
@import 'bootstrap/dist/css/bootstrap.min.css';

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>