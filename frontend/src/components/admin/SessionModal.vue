<template>
    <div class="modal d-block" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ session ? $t('admin.sessions.edit') : $t('admin.sessions.new') }}
                    </h5>
                    <button type="button" class="btn-close" @click="$emit('close')"></button>
                </div>
                <form @submit.prevent="handleSubmit">
                    <div class="modal-body">
                        <div class="row">
                            <!-- Kursauswahl -->
                            <div class="col-12 mb-3">
                                <label for="course" class="form-label required">
                                    {{ $t('admin.sessions.course') }}
                                </label>
                                <select class="form-select" id="course" v-model="formData.course_id" required
                                    :disabled="!!session">
                                    <option value="" disabled>{{ $t('admin.sessions.selectCourse') }}</option>
                                    <option v-for="course in courses" :key="course.id" :value="course.id">
                                        {{ currentLanguage === 'de' ? course.title_de : course.title_en }}
                                    </option>
                                </select>
                            </div>

                            <!-- Datum und Uhrzeit -->
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="date" class="form-label required">
                                        {{ $t('admin.sessions.date') }}
                                    </label>
                                    <input type="date" class="form-control" id="date" v-model="formData.date" required
                                        :min="minDate">
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="time" class="form-label required">
                                        {{ $t('admin.sessions.time') }}
                                    </label>
                                    <input type="time" class="form-control" id="time" v-model="formData.time" required>
                                </div>
                            </div>

                            <!-- Ort -->
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="location" class="form-label required">
                                        {{ $t('admin.sessions.location') }}
                                    </label>
                                    <input type="text" class="form-control" id="location" v-model="formData.location"
                                        required>
                                </div>
                            </div>

                            <!-- Maximale Teilnehmer -->
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="maxParticipants" class="form-label required">
                                        {{ $t('admin.sessions.maxParticipants') }}
                                    </label>
                                    <input type="number" class="form-control" id="maxParticipants"
                                        v-model="formData.max_participants" min="1" max="100" required>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="$emit('close')">
                            {{ $t('common.cancel') }}
                        </button>
                        <button type="submit" class="btn btn-primary" :disabled="loading || !isFormValid">
                            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                            {{ $t('common.save') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import { format } from 'date-fns';

export default {
    name: 'SessionModal',
    props: {
        session: {
            type: Object,
            default: null
        },
        courseId: {
            type: Number,
            default: null
        },
        courses: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            loading: false,
            formData: {
                course_id: this.courseId || null,
                date: '',
                time: '',
                location: '',
                max_participants: ''
            }
        };
    },
    computed: {
        currentLanguage() {
            return this.$i18n.locale;
        },
        activeCourses() {
            return this.courses.filter(course => course.active);
        },
        selectedCourse() {
            return this.courses.find(course => course.id === this.formData.course_id);
        },
        minDate() {
            return format(new Date(), 'yyyy-MM-dd');
        },
        isFormValid() {
            console.log('Validating form data:', this.formData);
            return Boolean(
                this.formData.course_id &&
                this.formData.date &&
                this.formData.time &&
                this.formData.location &&
                this.formData.max_participants
            );
        }
    },
    created() {
        if (this.session) {
            const dateTime = new Date(this.session.date_time);
            this.formData = {
                course_id: this.session.course_id,
                date: format(dateTime, 'yyyy-MM-dd'),
                time: format(dateTime, 'HH:mm'),
                location: this.session.location,
                max_participants: this.session.max_participants
            };
        } else if (this.courseId) {
            this.formData.course_id = this.courseId;
        }
    },
    methods: {
        formatDuration(minutes) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;

            if (hours === 0) {
                return `${minutes} ${this.$t('courses.minutesShort')}`;
            } else if (remainingMinutes === 0) {
                return `${hours} ${this.$t('courses.hoursShort')}`;
            } else {
                return `${hours} ${this.$t('courses.hoursShort')} ${remainingMinutes} ${this.$t('courses.minutesShort')}`;
            }
        },
        async handleSubmit() {
            console.log('Submit attempted, formData:', this.formData);
            console.log('Form valid?', this.isFormValid);
            
            if (!this.isFormValid) {
                console.warn('Form validation failed:', {
                    course_id: Boolean(this.formData.course_id),
                    date: Boolean(this.formData.date),
                    time: Boolean(this.formData.time),
                    location: Boolean(this.formData.location),
                    max_participants: Boolean(this.formData.max_participants)
                });
                return;
            }

            this.loading = true;
            try {
                const dateTime = new Date(`${this.formData.date}T${this.formData.time}`);
                
                const sessionData = {
                    id: this.session?.id,
                    course_id: Number(this.formData.course_id),
                    date_time: dateTime.toISOString(),
                    location: this.formData.location,
                    max_participants: Number(this.formData.max_participants)
                };

                console.log('Sending sessionData:', sessionData);
                await this.$emit('save', sessionData);
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped>
.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.required:after {
    content: " *";
    color: red;
}
</style>