<template>
    <div class="courses-table">
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('admin.courseTitle') }} (DE)</th>
              <th>{{ $t('admin.courseTitle') }} (EN)</th>
              <th>{{ $t('admin.status') }}</th>
              <th>{{ $t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courses" :key="course.id">
              <td>{{ course.id }}</td>
              <td>{{ course.title_de }}</td>
              <td>{{ course.title_en }}</td>
              <td>
                <span :class="['badge', course.active ? 'bg-success' : 'bg-secondary']">
                  {{ course.active ? $t('admin.active') : $t('admin.inactive') }}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-2" @click="$emit('edit', course)">
                  <i class="bi bi-pencil"></i> {{ $t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', course.id)">
                  <i class="bi bi-trash"></i> {{ $t('common.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CoursesTable',
    props: {
      courses: {
        type: Array,
        required: true
      }
    }
  };
  </script>