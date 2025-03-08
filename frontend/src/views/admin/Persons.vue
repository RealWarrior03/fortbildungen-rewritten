<template>
    <div class="persons-management">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>{{ $t('admin.persons.title') }}</h1>
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
          
          <!-- Neuer Person Button -->
          <button class="btn btn-primary" @click="showNewPersonModal">
            <i class="bi bi-plus-circle"></i> {{ $t('admin.persons.new') }}
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
  
      <!-- Persons Table -->
      <div v-else class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('admin.persons.name') }}</th>
              <th>{{ $t('admin.persons.email') }}</th>
              <th>{{ $t('admin.persons.department') }}</th>
              <th>{{ $t('admin.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="person in filteredPersons" :key="person.id">
              <td>{{ person.id }}</td>
              <td>{{ person.name }}</td>
              <td>{{ person.email }}</td>
              <td>{{ person.department }}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-2" @click="editPerson(person)">
                  <i class="bi bi-pencil"></i> {{ $t('common.edit') }}
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="confirmDeletePerson(person)">
                  <i class="bi bi-trash"></i> {{ $t('common.delete') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <!-- No Results Message -->
        <div v-if="filteredPersons.length === 0" class="text-center my-4 text-muted">
          {{ $t('admin.persons.noResults') }}
        </div>
      </div>
  
      <!-- Person Modal -->
      <PersonModal
        v-if="showModal"
        :person="selectedPerson"
        @save="savePerson"
        @close="showModal = false"
      />
    </div>
  </template>
  
  <script>
  import api from '@/services/api';
  import PersonModal from '@/components/admin/PersonsModal.vue';
  import { debounce } from 'lodash';
  
  export default {
    name: 'PersonsManagement',
    components: {
      PersonModal
    },
    data() {
      return {
        persons: [],
        loading: true,
        error: null,
        showModal: false,
        selectedPerson: null,
        searchQuery: ''
      };
    },
    computed: {
      filteredPersons() {
        if (!this.searchQuery) return this.persons;
        
        const query = this.searchQuery.toLowerCase();
        return this.persons.filter(person => 
          person.name.toLowerCase().includes(query) ||
          person.email.toLowerCase().includes(query) ||
          person.department?.toLowerCase().includes(query)
        );
      }
    },
    created() {
      this.handleSearch = debounce(this.handleSearch, 300);
      this.loadPersons();
    },
    methods: {
      async loadPersons() {
        try {
          const response = await api.getPersons();
          this.persons = response.data;
          this.loading = false;
        } catch (error) {
          console.error('Fehler beim Laden der Personen:', error);
          this.error = 'Fehler beim Laden der Personen';
          this.loading = false;
        }
      },
      handleSearch() {
        // Implementierung für serverseitige Suche falls nötig
        // Aktuell wird clientseitig über computed property gefiltert
      },
      showNewPersonModal() {
        this.selectedPerson = null;
        this.showModal = true;
      },
      editPerson(person) {
        this.selectedPerson = { ...person };
        this.showModal = true;
      },
      async confirmDeletePerson(person) {
        if (confirm(this.$t('admin.persons.confirmDelete'))) {
          try {
            await api.deletePerson(person.id);
            await this.loadPersons();
          } catch (error) {
            console.error('Fehler beim Löschen der Person:', error);
            alert(this.$t('admin.persons.deleteError'));
          }
        }
      },
      async savePerson(personData) {
        try {
          if (personData.id) {
            await api.updatePerson(personData.id, personData);
          } else {
            await api.createPerson(personData);
          }
          this.showModal = false;
          await this.loadPersons();
        } catch (error) {
          console.error('Fehler beim Speichern der Person:', error);
          alert(this.$t('admin.persons.saveError'));
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