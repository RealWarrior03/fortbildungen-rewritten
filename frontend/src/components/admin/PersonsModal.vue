<template>
    <div class="modal d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ person ? $t('admin.persons.edit') : $t('admin.persons.new') }}
            </h5>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
          <form @submit.prevent="handleSubmit">
            <div class="modal-body">
              <div class="mb-3">
                <label for="name" class="form-label">{{ $t('admin.persons.name') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="name"
                  v-model="formData.name"
                  required
                >
              </div>
  
              <div class="mb-3">
                <label for="email" class="form-label">{{ $t('admin.persons.email') }}</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="formData.email"
                  required
                >
              </div>
  
              <div class="mb-3">
                <label for="department" class="form-label">{{ $t('admin.persons.department') }}</label>
                <input
                  type="text"
                  class="form-control"
                  id="department"
                  v-model="formData.department"
                >
              </div>
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
  </template>
  
  <script>
  export default {
    name: 'PersonModal',
    props: {
      person: {
        type: Object,
        default: null
      }
    },
    data() {
      return {
        loading: false,
        formData: {
          name: '',
          email: '',
          department: ''
        }
      };
    },
    created() {
      if (this.person) {
        this.formData = { ...this.person };
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
  </style>