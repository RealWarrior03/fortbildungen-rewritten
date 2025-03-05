<template>
    <div class="registration">
        <h1>{{ $t('registration.title') }}</h1>

        <div v-if="loading" class="text-center my-5">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">{{ $t('common.loading') }}</span>
            </div>
        </div>

        <div v-else-if="error" class="alert alert-danger">
            {{ error }}
        </div>

        <div v-else-if="registrationSuccess" class="alert alert-success">
            <h4>{{ $t('registration.success') }}</h4>
            <p>Vielen Dank für Ihre Anmeldung!</p>
            <p>
                <strong>Kurs:</strong> {{ currentLanguage === 'de' ? course.title_de : course.title_en }}<br>
                <strong>Termin:</strong> {{ formatDateTime(selectedSession.date_time) }}<br>
                <strong>Ort:</strong> {{ selectedSession.location }}<br>
                <strong>Name:</strong> {{ personData.name }}<br>
                <strong>E-Mail:</strong> {{ personData.email }}
            </p>
            <p class="mt-3">
                <router-link to="/courses" class="btn btn-primary">
                    Zurück zur Kursübersicht
                </router-link>
            </p>
        </div>

        <div v-else>
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">{{ currentLanguage === 'de' ? course.title_de : course.title_en }}</h5>
                    <p class="card-text">
                        {{ currentLanguage === 'de' ? (course.description_de || 'Keine Beschreibung verfügbar') :
                            (course.description_en || 'No description available') }}
                    </p>
                </div>
            </div>

            <form @submit.prevent="submitRegistration">
                <div class="row">
                    <div class="col-md-6">
                        <h3>{{ $t('registration.personInfo') }}</h3>

                        <div class="mb-3">
                            <label for="name" class="form-label">{{ $t('registration.name') }} *</label>
                            <input type="text" class="form-control" id="name" v-model="personData.name" required>
                        </div>

                        <div class="mb-3">
                            <label for="email" class="form-label">{{ $t('registration.email') }} *</label>
                            <input type="email" class="form-control" id="email" v-model="personData.email" required
                                @blur="checkExistingPerson">
                            <div v-if="existingPerson" class="form-text text-info">
                                Diese E-Mail-Adresse ist bereits registriert. Ihre Daten werden automatisch verwendet.
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="department" class="form-label">{{ $t('registration.department') }}</label>
                            <input type="text" class="form-control" id="department" v-model="personData.department">
                        </div>
                    </div>

                    <div class="col-md-6">
                        <h3>{{ $t('registration.selectSession') }}</h3>

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
                        <div v-else class="mb-3">
                            <label for="session" class="form-label">Termin </label>
                            <select class="form-select" id="session" v-model="selectedSessionId" required>
                                <option value="" disabled>Bitte wählen Sie einen Termin</option>
                                <option v-for="session in availableSessions" :key="session.id" :value="session.id">
                                    {{ formatDateTime(session.date_time) }} - {{ session.location }}
                                    ({{ sessionAvailability[session.id] ? sessionAvailability[session.id].available :
                                    '?' }} Plätze frei)
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <button type="submit" class="btn btn-primary" :disabled="submitting || !isFormValid">
                        <span v-if="submitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
                        {{ $t('common.submit') }}
                    </button>
                    <router-link to="/courses" class="btn btn-outline-secondary ms-2">
                        {{ $t('common.cancel') }}
                    </router-link>
                </div>
            </form>
        </div>
    </div>
</template>
<script>
import api from '@/services/api';
export default {
    name: 'CourseRegistration',
    data() {
        return {
            course: {},
            sessions: [],
            sessionAvailability: {},
            selectedSessionId: '',
            personData: {
                name: '',
                email: '',
                department: ''
            },
            existingPerson: null,
            loading: true,
            loadingSessions: true,
            submitting: false,
            registrationSuccess: false,
            error: null,
            sessionsError: null
        };
    },
    computed: {
        currentLanguage() {
            return this.$i18n.locale;
        },
        isFormValid() {
            return this.personData.name &&
                this.personData.email &&
                this.selectedSessionId;
        },
        availableSessions() {
            return this.sessions.filter(session => {
                const availability = this.sessionAvailability[session.id];
                return !availability || availability.available > 0;
            });
        },
        selectedSession() {
            return this.sessions.find(s => s.id === this.selectedSessionId) || {};
        }
    },
    async created() {
        const courseId = this.$route.params.courseId;
        const sessionId = this.$route.query.session;
        if (sessionId) {
            this.selectedSessionId = parseInt(sessionId);
        }
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
                console.error('Fehler beim Laden der Verfügbarkeit für Termin ${ sessionId }:', error);
            }
        },
        formatDateTime(dateTimeStr) {
            const date = new Date(dateTimeStr);
            return new Intl.DateTimeFormat(this.currentLanguage, {
                dateStyle: 'full',
                timeStyle: 'short'
            }).format(date);
        },
        async checkExistingPerson() {
            if (!this.personData.email) return;
            try {
                const response = await api.get('/persons/search?email=' + encodeURIComponent(this.personData.email));
                this.existingPerson = response.data;
                if (this.existingPerson) {
                    this.personData.name = this.existingPerson.name;
                    this.personData.department = this.existingPerson.department;
                }
            } catch (error) {
                // Person existiert nicht, das ist in Ordnung
                this.existingPerson = null;
            }
        },
        async submitRegistration() {
            if (!this.isFormValid) return;
            this.submitting = true;
            try {
                // 1. Person erstellen oder abrufen
                let personId;
                if (this.existingPerson) {
                    personId = this.existingPerson.id;
                } else {
                    const personResponse = await api.createPerson(this.personData);
                    personId = personResponse.data.personId;
                }
                // 2. Anmeldung erstellen
                const registrationData = {
                    person_id: personId,
                    session_id: this.selectedSessionId
                };
                await api.registerForSession(registrationData);
                this.registrationSuccess = true;
            } catch (error) {
                console.error('Fehler bei der Anmeldung:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    this.error = error.response.data.message;
                } else {
                    this.error = 'Fehler bei der Anmeldung. Bitte versuchen Sie es später erneut.';
                }
            } finally {
                this.submitting = false;
            }
        }
    }
};
</script>