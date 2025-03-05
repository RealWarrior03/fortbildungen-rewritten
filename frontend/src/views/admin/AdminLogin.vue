<template>
    <div class="admin-login">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h2 class="mb-0">{{ $t('admin.login') }}</h2>
                    </div>
                    <div class="card-body">
                        <div v-if="error" class="alert alert-danger">
                            {{ error }}
                        </div>
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label for="username" class="form-label">{{ $t('admin.username') }}</label>
                                <input type="text" class="form-control" id="username" v-model="credentials.username"
                                    required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">{{ $t('admin.password') }}</label>
                                <input type="password" class="form-control" id="password" v-model="credentials.password"
                                    required>
                            </div>
                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                                {{ $t('admin.loginButton') }}
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
    name: 'AdminLogin',
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
                const response = await api.adminLogin(this.credentials);
                // Token im localStorage speichern
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUsername', response.data.username);
                // Zur Admin-Dashboard weiterleiten
                this.$router.push('/admin/dashboard');
            } catch (error) {
                console.error('Login-Fehler:', error);
                if (error.response && error.response.status === 401) {
                    this.error = 'Ungültiger Benutzername oder Passwort';
                } else {
                    this.error = 'Fehler beim Login. Bitte versuchen Sie es später erneut.';
                }
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>