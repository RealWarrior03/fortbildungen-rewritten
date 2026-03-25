<template>
  <div class="admin-layout">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link class="navbar-brand" to="/admin/dashboard">Admin</router-link>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div id="adminNavbar" class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/admin/dashboard">Dashboard</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/admin/courses">Kurse</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/admin/sessions">Termine</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/admin/persons">Personen</router-link>
            </li>
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item">
              <router-link class="nav-link" to="/courses">Kursportal</router-link>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container mt-4">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  methods: {
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authRoles');
      localStorage.removeItem('authUsername');
      localStorage.removeItem('authDisplayName');
      localStorage.removeItem('authEmail');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('adminDisplayName');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      this.$router.push('/login');
    }
  }
};
</script>
