<template>
    <div class="admin-dashboard">
        <h1>{{ $t('admin.dashboard') }}</h1>
        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">{{ $t('common.loading') }}</span>
            </div>
        </div>
        <div v-else-if="error" class="alert alert-danger">
            {{ error }}
        </div>
        <div v-else>
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Kurse</h5>
                            <h2 class="card-text">{{ dashboardData.counts.courses }}</h2>
                            <router-link to="/admin/courses" class="btn btn-light btn-sm mt-2">Verwalten</router-link>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Termine</h5>
                            <h2 class="card-text">{{ dashboardData.counts.sessions }}</h2>
                            <router-link to="/admin/sessions" class="btn btn-light btn-sm mt-2">Verwalten</router-link>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Anmeldungen</h5>
                            <h2 class="card-text">{{ dashboardData.counts.registrations }}</h2>
                            <router-link to="/admin/registrations"
                                class="btn btn-light btn-sm mt-2">Verwalten</router-link>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h5 class="card-title">Personen</h5>
                            <h2 class="card-text">{{ dashboardData.counts.persons }}</h2>
                            <router-link to="/admin/persons" class="btn btn-light btn-sm mt-2">Verwalten</router-link>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Neueste Anmeldungen</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Name</th>
                                    <th>E-Mail</th>
                                    <th>Kurs</th>
                                    <th>Termin</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="reg in dashboardData.latestRegistrations" :key="reg.id">
                                    <td>{{ formatDateTime(reg.registration_time) }}</td>
                                    <td>{{ reg.name }}</td>
                                    <td>{{ reg.email }}</td>
                                    <td>{{ reg.title_de }}</td>
                                    <td>{{ formatDateTime(reg.date_time) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import api from '@/services/api';
export default {
    name: 'AdminDashboard',
    data() {
        return {
            dashboardData: {
                counts: {
                    courses: 0,
                    sessions: 0,
                    registrations: 0,
                    persons: 0
                },
                latestRegistrations: []
            },
            loading: true,
            error: null
        };
    },
    async created() {
        try {
            const response = await api.getAdminDashboard();
            this.dashboardData = response.data;
            this.loading = false;
        } catch (error) {
            console.error('Fehler beim Laden der Dashboard-Daten:', error);
            this.error = 'Fehler beim Laden der Dashboard-Daten. Bitte versuchen Sie es später erneut.';
            this.loading = false;
        }
    },
    methods: {
        formatDateTime(dateTimeStr) {
            const date = new Date(dateTimeStr);
            return new Intl.DateTimeFormat(this.$i18n.locale, {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        }
    }
};
</script>