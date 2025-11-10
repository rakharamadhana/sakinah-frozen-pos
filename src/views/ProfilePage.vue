<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- Logged in -->
      <div v-if="user">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ user.email }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>ID:</strong> {{ user.id }}</p>
            <ion-button expand="block" color="danger" @click="handleLogout">
              Keluar
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Logged out -->
      <div v-else>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Login Admin</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input v-model="email" type="email"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input v-model="password" type="password"></ion-input>
            </ion-item>

            <ion-button expand="block" class="ion-margin-top" @click="handleLogin">
              Masuk
            </ion-button>

            <ion-button expand="block" fill="clear" @click="handleSignup">
              Daftar Baru
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton
} from '@ionic/vue'
import { ref } from 'vue'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const { user, signIn, signUp, signOut } = useSupabaseAuth()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await signIn(email.value, password.value)
    alert('Login berhasil!')
  } catch (err: any) {
    alert('Login gagal: ' + err.message)
  }
}

const handleSignup = async () => {
  try {
    if (!email.value || !password.value) {
      alert('Masukkan email dan password terlebih dahulu.')
      return
    }

    await signUp(email.value, password.value)
    alert('Akun berhasil dibuat. Silakan login.')
  } catch (err: any) {
    alert('Gagal daftar: ' + err.message)
  }
}

const handleLogout = async () => {
  await signOut()
  alert('Berhasil keluar.')
}
</script>
