<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Daftar Produk</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">

      <!-- If not logged in -->
      <div v-if="!user">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Login Diperlukan</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Anda harus login untuk mengelola produk.</p>
            <ion-button expand="block" router-link="/tabs/profile">
              Buka Halaman Login
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- If logged in -->
      <div v-else>

        <!-- Add new product form -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Tambah Produk Baru</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Nama Produk</ion-label>
              <ion-input
                  v-model="newName"
                  placeholder="contoh: Dada Fillet"
                  clear-input
              ></ion-input>
            </ion-item>


            <ion-item>
              <ion-label position="floating">Harga per kg (NTD)</ion-label>
              <ion-input type="number" v-model="newPrice"></ion-input>
            </ion-item>

            <ion-button
                expand="block"
                class="ion-margin-top"
                :disabled="!newName || !newPrice || saving"
                @click="addProduct"
            >
              {{ saving ? 'Menyimpan...' : 'Tambah Produk' }}
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Product list -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Produk Aktif</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="p in products" :key="p.id">
                <ion-label>
                  <h2>{{ p.name }}</h2>
                  <p>@{{ p.price_per_kg }} NTD / kg</p>
                </ion-label>

                <ion-button
                    fill="outline"
                    size="small"
                    @click="openEditPrice(p)"
                >
                  Edit
                </ion-button>
              </ion-item>
            </ion-list>

            <ion-button expand="block" fill="outline" @click="loadProducts">
              Muat Ulang
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Edit Price Alert -->
      <ion-alert
          :is-open="editState.open"
          header="Ubah Harga Produk"
          :inputs="[
          {
            name: 'price',
            type: 'number',
            value: editState.value,
            placeholder: 'Harga per kg (NTD)'
          }
        ]"
          :buttons="[
          { text: 'Batal', role: 'cancel', handler: closeEdit },
          { text: 'Simpan', handler: handleSaveEdit }
        ]"
          @didDismiss="closeEdit"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonAlert
} from '@ionic/vue'
import { ref, onMounted, reactive } from 'vue'
import { supabase } from '@/supabase'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const { user } = useSupabaseAuth()

const newName = ref('')
const newPrice = ref('')
const products = ref<any[]>([])
const saving = ref(false)

// Edit state
const editState = reactive({
  open: false,
  product: null as any,
  value: ''
})

const loadProducts = async () => {
  const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

  if (!error && data) products.value = data
  else console.error(error)
}

const addProduct = async () => {
  if (!user.value) return alert('Silakan login terlebih dahulu.')
  if (!newName.value || !newPrice.value) return alert('Nama dan harga wajib diisi.')

  try {
    saving.value = true
    const { error } = await supabase
        .from('products')
        .insert({
          name: newName.value.trim(),
          price_per_kg: Number(newPrice.value),
          is_active: true
        })

    if (error) throw error

    alert('Produk berhasil ditambahkan.')
    newName.value = ''
    newPrice.value = ''
    await loadProducts()
  } catch (err: any) {
    alert('Gagal menambah produk: ' + err.message)
  } finally {
    saving.value = false
  }
}

const openEditPrice = (p: any) => {
  editState.product = p
  editState.value = String(p.price_per_kg)
  editState.open = true
}

const closeEdit = () => {
  editState.open = false
  editState.product = null
  editState.value = ''
}

const handleSaveEdit = async (data: any) => {
  const newPrice = Number(data.price)
  if (isNaN(newPrice) || newPrice <= 0) return

  const { error } = await supabase
      .from('products')
      .update({ price_per_kg: newPrice })
      .eq('id', editState.product.id)

  if (error) {
    alert('Gagal mengubah harga: ' + error.message)
  } else {
    alert('Harga berhasil diperbarui.')
    await loadProducts()
  }

  closeEdit()
}

onMounted(loadProducts)
</script>
