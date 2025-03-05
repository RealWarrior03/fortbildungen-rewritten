<template>
    <div class="home">
      <div class="jumbotron bg-light p-5 rounded">
        <h1>{{ $t('courses.title') }}</h1>
        <p class="lead">
          Willkommen beim Fortbildungsanmeldungssystem. Hier können Sie sich für verschiedene Fortbildungen anmelden.
        </p>
        <hr class="my-4">
        <p>Klicken Sie auf den Button, um alle verfügbaren Fortbildungen anzuzeigen.</p>
        <router-link to="/courses" class="btn btn-primary btn-lg">
          {{ $t('courses.title') }}
        </router-link>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'Home'
  }
  </script>