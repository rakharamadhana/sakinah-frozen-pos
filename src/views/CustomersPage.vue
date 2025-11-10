<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Daftar Pelanggan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-list v-if="customers.length">
        <ion-item v-for="c in customers" :key="c.id">
          <ion-label>
            <h2>{{ c.name }}</h2>
            <p v-if="c.phone">📞 {{ c.phone }}</p>
          </ion-label>

          <!-- WhatsApp button -->
          <ion-button
              v-if="c.phone"
              fill="clear"
              color="success"
              size="small"
              @click.stop="openWhatsApp(c.phone)"
          >
            <ion-icon :icon="logoWhatsapp"></ion-icon>
          </ion-button>

          <!-- Map button -->
          <ion-button
              v-if="c.map_link"
              fill="clear"
              color="primary"
              size="small"
              @click.stop="openMap(c.map_link)"
          >
            <ion-icon :icon="navigateOutline"></ion-icon>
          </ion-button>

          <!-- Edit -->
          <ion-button
              fill="clear"
              color="warning"
              size="small"
              @click.stop="editCustomer(c)"
          >
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>

          <!-- Delete -->
          <ion-button
              fill="clear"
              color="danger"
              size="small"
              @click.stop="deleteCustomer(c.id)"
          >
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-text v-else color="medium">
        <p>Belum ada pelanggan.</p>
      </ion-text>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openAddCustomer()">
          <ion-icon :icon="addOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Add/Edit Customer Modal -->
      <ion-alert
          :is-open="showModal"
          header="Tambah / Edit Pelanggan"
          :inputs="[
          { name: 'name', type: 'text', placeholder: 'Nama pelanggan', value: editCustomerData.name },
          { name: 'phone', type: 'tel', placeholder: 'No. WA dengan + | Contoh: +628179', value: editCustomerData.phone },
          { name: 'map_link', type: 'url', placeholder: 'Link Google Maps', value: editCustomerData.map_link }
        ]"
          :buttons="[
          { text: 'Batal', role: 'cancel', handler: closeModal },
          { text: 'Simpan', handler: handleSaveCustomer }
        ]"
          @didDismiss="closeModal"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonText, IonFab, IonFabButton, IonRefresher,
  IonRefresherContent, IonAlert
} from '@ionic/vue'
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '@/supabase'
import {addOutline, createOutline, logoWhatsapp, navigateOutline, pencilOutline, trashOutline} from 'ionicons/icons'

// ---- State ----
const customers = ref<any[]>([])
const showModal = ref(false)
const editCustomerData = reactive({
  id: null as string | null,
  name: '',
  phone: '',
  map_link: ''
})

// ---- Load customers ----
const loadCustomers = async () => {
  const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })
  if (!error && data) customers.value = data
  else console.error(error)
}
onMounted(loadCustomers)

const handleRefresh = async (ev: CustomEvent) => {
  await loadCustomers()
  ev.detail.complete()
}

// ---- Add / Edit ----
const openAddCustomer = () => {
  editCustomerData.id = null
  editCustomerData.name = ''
  editCustomerData.phone = ''
  editCustomerData.map_link = ''
  showModal.value = true
}

const editCustomer = (c: any) => {
  editCustomerData.id = c.id
  editCustomerData.name = c.name
  editCustomerData.phone = c.phone
  editCustomerData.map_link = c.map_link
  showModal.value = true
}

const closeModal = () => (showModal.value = false)

const handleSaveCustomer = async (data: any) => {
  const payload = {
    name: data.name.trim(),
    phone: data.phone?.trim() || null,
    map_link: data.map_link?.trim() || null
  }

  if (editCustomerData.id) {
    await supabase.from('customers').update(payload).eq('id', editCustomerData.id)
  } else {
    await supabase.from('customers').insert(payload)
  }

  showModal.value = false
  await loadCustomers()
}

// ---- Delete ----
const deleteCustomer = async (id: string) => {
  if (confirm('Yakin ingin menghapus pelanggan ini?')) {
    await supabase.from('customers').delete().eq('id', id)
    await loadCustomers()
  }
}

// ---- WhatsApp & Maps ----
const openWhatsApp = (phone: string) => {
  if (!phone) return
  // normalize phone number (no +, no spaces)
  const normalized = phone.replace(/[^\d]/g, '')
  window.open(`https://wa.me/${normalized}`, '_blank')
}

const openMap = (link: string) => {
  if (!link) return
  window.open(link, '_blank')
}
</script>
