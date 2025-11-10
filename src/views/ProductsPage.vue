<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Daftar Produk</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- 🔐 If not logged in -->
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

      <!-- ✅ If logged in -->
      <div v-else>
        <!-- ➕ Add new product -->
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
              <ion-label position="stacked">Harga per Unit (NTD)</ion-label>
              <ion-input type="number" v-model="newPrice"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Satuan</ion-label>
              <ion-select v-model="newUnit">
                <ion-select-option value="kg">kg</ion-select-option>
                <ion-select-option value="pcs">pcs</ion-select-option>
                <ion-select-option value="box">box</ion-select-option>
                <ion-select-option value="pack">pack</ion-select-option>
                <ion-select-option value="liter">liter</ion-select-option>
              </ion-select>
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

        <!-- 📋 Product list -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Produk Aktif</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              <ion-item v-for="p in products" :key="p.id">
                <ion-label>
                  <h2>{{ p.name }}</h2>
                  <p>@{{ p.sell_price }} NTD / {{ p.unit }}</p>
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

      <!-- ✏️ Edit Product -->
      <ion-alert
          :is-open="editState.open"
          header="Ubah Harga / Satuan"
          :inputs="[
          {
            name: 'price',
            type: 'number',
            value: editState.value,
            placeholder: 'Harga per unit (NTD)',
          },
          {
            name: 'unit',
            type: 'text',
            value: editState.unit,
            placeholder: 'Satuan (mis. kg, pcs)',
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
  IonAlert,
  IonSelect,
  IonSelectOption,
  toastController,
} from '@ionic/vue'
import { ref, onMounted, reactive } from 'vue'
import { supabase } from '@/supabase'
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'

const { user } = useSupabaseAuth()

const newName = ref('')
const newPrice = ref('')
const newUnit = ref('kg')
const products = ref<any[]>([])
const saving = ref(false)

// Toast helper
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 1500,
    color,
    position: 'bottom'
  })
  await toast.present()
}

// Edit state
const editState = reactive({
  open: false,
  product: null as any,
  value: '',
  unit: 'kg'
})

// Load
const loadProducts = async () => {
  const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
  if (!error && data) products.value = data
  else console.error(error)
}

// Add
const addProduct = async () => {
  if (!user.value) return showToast('Silakan login terlebih dahulu.', 'danger')
  if (!newName.value || !newPrice.value)
    return showToast('Nama dan harga wajib diisi.', 'danger')

  try {
    saving.value = true
    const { error } = await supabase.from('products').insert({
      name: newName.value.trim(),
      sell_price: Number(newPrice.value),
      unit: newUnit.value,
      is_active: true
    })
    if (error) throw error
    showToast('Produk berhasil ditambahkan.', 'success')
    newName.value = ''
    newPrice.value = ''
    newUnit.value = 'kg'
    await loadProducts()
  } catch (err: any) {
    showToast('Gagal menambah produk: ' + err.message, 'danger')
  } finally {
    saving.value = false
  }
}

// Edit
const openEditPrice = (p: any) => {
  editState.product = p
  editState.value = String(p.sell_price)
  editState.unit = p.unit
  editState.open = true
}
const closeEdit = () => {
  editState.open = false
  editState.product = null
  editState.value = ''
  editState.unit = 'kg'
}

const handleSaveEdit = async (data: any) => {
  const newPrice = Number(data.price)
  const newUnit = String(data.unit || '').trim()
  if (isNaN(newPrice) || newPrice <= 0 || !newUnit) {
    showToast('Input tidak valid.', 'danger')
    return
  }

  const { error } = await supabase
      .from('products')
      .update({ sell_price: newPrice, unit: newUnit })
      .eq('id', editState.product.id)

  if (error) {
    showToast('Gagal mengubah produk: ' + error.message, 'danger')
  } else {
    showToast('Produk berhasil diperbarui.', 'success')
    await loadProducts()
  }
  closeEdit()
}

onMounted(loadProducts)
</script>
