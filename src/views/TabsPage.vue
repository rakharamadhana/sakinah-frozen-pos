<template>
  <ion-tabs>
    <ion-router-outlet></ion-router-outlet>

    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="orders" href="/orders">
        <ion-icon :icon="listOutline" />
        <ion-label>Pesanan</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="products" href="/products">
        <ion-icon :icon="cubeOutline" />
        <ion-label>Produk</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="customers" href="/customers">
        <ion-icon :icon="peopleOutline" /> <!-- 👈 -->
        <ion-label>Pelanggan</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="profile" href="/profile">
        <ion-icon :icon="personCircleOutline" />
        <ion-label>Profil</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>


<script setup lang="ts">
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/vue'
import {listOutline, cubeOutline, personCircleOutline, peopleOutline} from 'ionicons/icons'
</script>
