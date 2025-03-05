<template>
    <div class="course-list">
      <h1>{{ $t('courses.title') }}</h1>
      
      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">{{ $t('common.loading') }}</span>
        </div>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else-if="courses.length === 0" class="alert alert-info">
        {{ $t('courses.noCoursesAvailable') }}
      </div>
      
      <div v-else class="row">
        <div v-for="course in courses" :key="course.id" class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">{{ currentLanguage === 'de' ? course.title_de : course.title_en }}</h5>
              <p class="card-text">
                {{ currentLanguage === 'de' ? (course.description_de || 'Keine Beschreibung verfügbar') : (course.description_en || 'No description available') }}
              </p>
            </div>
            <div class="card-footer bg-white border-top-0">
              <router-link :to="`/courses/${course.id}`" class="btn btn-outline-primary me-2">
                {{ $t('courses.details') }}
              </router-link>
              <router-link :to="`/register/${course.id}`" class="btn btn-primary">
                {{ $t('courses.register') }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '@/services/api';
  
  export default {
    name: 'CourseList',
    data() {
      return {
        courses: [],
        loading: true,
        error: null
      };
    },
    computed: {
      currentLanguage() {
        return this.$i18n.locale;
      }
    },
    async created() {
      try {
        const response = await api.getCourses();
        this.courses = response.data;
        this.loading = false;
      } catch (error) {
        console.error('Fehler beim Laden der Kurse:', error);
        this.error = 'Fehler beim Laden der Kurse. Bitte versuchen Sie es später erneut.';
        this.loading = false;
      }
    }
  };
  </script>