<template>
  <div class="courses-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>{{ $t('admin.courses.title') }}</h1>
      <div class="d-flex gap-3 align-items-center">
        <!-- Suchleiste -->
        <div class="search-box">
          <div class="input-group">
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              :placeholder="$t('common.search')"
              @input="handleSearch"
            >
            <!-- <span class="input-group-text">
              <i class="bi bi-search"></i>
            </span> -->
          </div>
        </div>
        
        <!-- Neuer Kurs Button -->
        <button class="btn btn-primary" @click="showNewCourseModal">
          <i class="bi bi-plus-circle"></i> {{ $t('admin.courses.new') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">{{ $t('common.loading') }}</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- Courses Table -->
    <div v-else class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ $t('admin.courses.titleDe') }}</th>
            <th>{{ $t('admin.courses.titleEn') }}</th>
            <th>{{ $t('admin.courses.sessions') }}</th>
            <th>{{ $t('admin.courses.status') }}</th>
            <th>{{ $t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in filteredCourses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.title_de }}</td>
            <td>{{ course.title_en }}</td>
            <td>
              <span class="badge bg-primary">
                {{ course.session_count || 0 }}
              </span>
            </td>
            <td>
              <span :class="['badge', course.active ? 'bg-success' : 'bg-secondary']">
                {{ course.active ? $t('admin.courses.active') : $t('admin.courses.inactive') }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-primary me-2" @click="editCourse(course)">
                <i class="bi bi-pencil"></i> {{ $t('common.edit') }}
              </button>
              <button class="btn btn-sm btn-outline-danger" @click="confirmDeleteCourse(course)">
                <i class="bi bi-trash"></i> {{ $t('common.delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- No Results Message -->
      <div v-if="filteredCourses.length === 0" class="text-center my-4 text-muted">
        {{ $t('admin.courses.noResults') }}
      </div>
    </div>

    <!-- Course Modal -->
    <CourseModal
      v-if="showModal"
      :course="selectedCourse"
      @save="saveCourse"
      @close="showModal = false"
    />
  </div>
</template>

<script>
import api from '@/services/api';
import CourseModal from '@/components/admin/CourseModal.vue';
import { debounce } from 'lodash';

export default {
  name: 'CoursesManagement',
  components: {
    CourseModal
  },
  data() {
    return {
      courses: [],
      loading: true,
      error: null,
      showModal: false,
      selectedCourse: null,
      searchQuery: ''
    };
  },
  computed: {
    filteredCourses() {
      if (!this.searchQuery) return this.courses;
      
      const query = this.searchQuery.toLowerCase();
      return this.courses.filter(course => 
        course.title_de?.toLowerCase().includes(query) ||
        course.title_en?.toLowerCase().includes(query) ||
        course.description_de?.toLowerCase().includes(query) ||
        course.description_en?.toLowerCase().includes(query)
      );
    }
  },
  created() {
    this.handleSearch = debounce(this.handleSearch, 300);
    this.loadCourses();
  },
  methods: {
    async loadCourses() {
      try {
        const response = await api.getAllCourses();
        this.courses = response.data;
        this.loading = false;
      } catch (error) {
        console.error('Fehler beim Laden der Kurse:', error);
        this.error = 'Fehler beim Laden der Kurse';
        this.loading = false;
      }
    },
    handleSearch() {
      // Clientseitige Filterung über computed property
    },
    showNewCourseModal() {
      this.selectedCourse = null;
      this.showModal = true;
    },
    editCourse(course) {
      this.selectedCourse = { ...course };
      this.showModal = true;
    },
    async confirmDeleteCourse(course) {
      if (confirm(this.$t('admin.courses.confirmDelete'))) {
        try {
          await api.deleteCourse(course.id);
          await this.loadCourses();
        } catch (error) {
          console.error('Fehler beim Löschen des Kurses:', error);
          alert(this.$t('admin.courses.deleteError'));
        }
      }
    },
    async saveCourse(courseData) {
      try {
        if (courseData.id) {
          await api.updateCourse(courseData.id, courseData);
        } else {
          await api.createCourse(courseData);
        }
        this.showModal = false;
        await this.loadCourses();
      } catch (error) {
        console.error('Fehler beim Speichern des Kurses:', error);
        alert(this.$t('admin.courses.saveError'));
      }
    },
    formatDuration(minutes) {
      if (!minutes) return '-';
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours === 0) {
        return `${minutes} ${this.$t('courses.minutesShort')}`;
      } else if (remainingMinutes === 0) {
        return `${hours} ${this.$t('courses.hoursShort')}`;
      } else {
        return `${hours} ${this.$t('courses.hoursShort')} ${remainingMinutes} ${this.$t('courses.minutesShort')}`;
      }
    }
  }
};
</script>

<style scoped>
.search-box {
  min-width: 300px;
}

.input-group-text {
  background-color: white;
  border-left: none;
}

.form-control:focus + .input-group-text {
  border-color: #86b7fe;
}
</style> 