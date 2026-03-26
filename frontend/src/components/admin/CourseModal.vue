<template>
  <div class="modal d-block" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ course ? $t('admin.editCourse') : $t('admin.newCourse') }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label for="title_de" class="form-label">{{ $t('admin.courseTitle') }} (DE)</label>
              <input type="text" class="form-control" id="title_de" v-model="formData.title_de" required>
            </div>

            <div class="mb-3">
              <label for="description_de" class="form-label">{{ $t('admin.courseDescription') }} (DE)</label>
              <textarea class="form-control" id="description_de" v-model="formData.description_de" rows="3"></textarea>
            </div>

            <div class="mb-3">
              <label for="ad_group" class="form-label">AD-Gruppe</label>
              <input
                type="text"
                class="form-control"
                id="ad_group"
                v-model="formData.ad_group"
                required
                placeholder="z. B. fortbildung-it-sicherheit"
              >
              <div class="form-text">Nur Benutzer dieser AD-Gruppe sehen und buchen diese Fortbildung.</div>
            </div>

            <div class="form-check mb-3">
              <input type="checkbox" class="form-check-input" id="active" v-model="formData.active">
              <label class="form-check-label" for="active">
                {{ $t('admin.courses.active') }}
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">
                {{ $t('common.cancel') }}
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CourseModal',
  props: {
    course: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      formData: {
        title_de: '',
        title_en: '',
        description_de: '',
        description_en: '',
        ad_group: '',
        active: true
      }
    };
  },
  computed: {
    isFormValid() {
      return this.formData.title_de?.trim();
    }
  },
  created() {
    if (this.course) {
      this.formData = { ...this.course };
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      try {
        await this.$emit('save', this.formData);
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

.modal-lg {
  max-width: 800px;
}

.required:after {
  content: " *";
  color: red;
}

.form-text {
  font-size: 0.875em;
}
</style>