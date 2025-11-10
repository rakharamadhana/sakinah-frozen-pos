<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/orders" />
        </ion-buttons>
        <ion-title>Detail Pesanan</ion-title>
      </ion-toolbar>
    </ion-header>

    <!-- 🧾 Order Info -->
    <ion-content class="ion-padding" v-if="order">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Order #{{ order.id.slice(0, 6) }}</ion-card-title>
          <ion-card-subtitle>{{ order.customers?.name }}</ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <p><strong>Status:</strong> {{ order.status }}</p>
          <p><strong>Total:</strong> {{ order.total_amount.toLocaleString() }} NTD</p>

          <ion-item>
            <ion-label position="stacked">Ubah Status</ion-label>
            <ion-select v-model="newStatus">
              <ion-select-option value="Pending">Pending</ion-select-option>
              <ion-select-option value="In-Delivery">In-Delivery</ion-select-option>
              <ion-select-option value="Completed">Completed</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="updateStatus">
            Simpan Status
          </ion-button>

          <ion-button expand="block" fill="outline" class="ion-margin-top" @click="toggleEdit">
            {{ editMode ? 'Selesai Edit' : 'Edit Item' }}
          </ion-button>

          <ion-button
              expand="block"
              color="danger"
              fill="solid"
              class="ion-margin-top"
              @click="deleteOrder"
          >
            <ion-icon slot="start" :icon="trashBinOutline" />
            Hapus Pesanan
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- 🧮 Order Items -->
      <ion-list>
        <ion-list-header>
          <ion-label>Item Pesanan</ion-label>
        </ion-list-header>

        <ion-item v-for="(item) in orderItems" :key="item.id">
          <ion-label>
            <h2>{{ item.products?.name }}</h2>
            <p>
              @{{ item.unit_price }} ×
              {{ item.weight_kg.toFixed(3) }}
              {{ item.products?.unit || 'unit' }}
            </p>
          </ion-label>

          <!-- ✏️ Edit Mode -->
          <template v-if="editMode">
            <ion-input
                type="number"
                step="0.001"
                min="0.001"
                v-model.number="item.weight_kg"
                :placeholder="item.products?.unit"
                class="ion-margin-end"
                style="max-width: 100px;"
            ></ion-input>

            <ion-button size="small" @click="saveItem(item)">
              <ion-icon :icon="saveOutline" />
            </ion-button>

            <ion-button size="small" color="danger" @click="deleteItem(item)">
              <ion-icon :icon="trashBinOutline" />
            </ion-button>
          </template>

          <ion-note slot="end">{{ item.line_total.toLocaleString() }} NTD</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>

    <!-- 🔄 Loading -->
    <ion-content v-else class="ion-padding">
      <ion-spinner name="crescent"></ion-spinner>
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
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonInput,
  IonIcon,
  toastController,
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/supabase'
import { saveOutline, trashBinOutline } from 'ionicons/icons'

const route = useRoute()
const orderId = route.params.id as string

const order = ref<any>(null)
const orderItems = ref<any[]>([])
const newStatus = ref('')
const editMode = ref(false)

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 1500,
    color,
    position: 'bottom',
  })
  await toast.present()
}

// 🧭 Load order + items
const loadOrder = async () => {
  const { data, error } = await supabase
      .from('orders')
      .select('*, customers(name)')
      .eq('id', orderId)
      .single()
  if (!error && data) {
    order.value = data
    newStatus.value = data.status
  }

  const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name, unit)')
      .eq('order_id', orderId)
  orderItems.value = items || []
}

// 🔄 Update status
const updateStatus = async () => {
  if (!order.value) return
  const { error } = await supabase
      .from('orders')
      .update({ status: newStatus.value })
      .eq('id', order.value.id)

  if (error) await showToast('Gagal memperbarui status: ' + error.message, 'danger')
  else await showToast('Status berhasil diperbarui!', 'success')
}

// ✏️ Toggle edit mode
const toggleEdit = () => (editMode.value = !editMode.value)

// 💾 Save single item
const saveItem = async (item: any) => {
  const newLineTotal = Math.ceil(item.unit_price * item.weight_kg)
  item.line_total = newLineTotal

  const { error } = await supabase
      .from('order_items')
      .update({
        weight_kg: item.weight_kg,
        line_total: newLineTotal,
      })
      .eq('id', item.id)

  if (error) await showToast('Gagal update item: ' + error.message, 'danger')
  else await showToast('Item berhasil diperbarui!', 'success')

  await recalcTotal()
  await loadOrder()
}

// ❌ Delete entire order
const deleteOrder = async () => {
  if (!order.value) return
  const confirmDelete = confirm('Yakin ingin menghapus seluruh pesanan ini?')
  if (!confirmDelete) return

  try {
    await supabase.from('order_items').delete().eq('order_id', order.value.id)
    await supabase.from('orders').delete().eq('id', order.value.id)

    await showToast('Pesanan berhasil dihapus!', 'success')
    window.history.back()
  } catch (err: any) {
    console.error(err)
    await showToast('Gagal menghapus pesanan: ' + err.message, 'danger')
  }
}

// 🔢 Recalculate total after item update/delete
const recalcTotal = async () => {
  const total = orderItems.value.reduce((s, i) => s + i.line_total, 0)
  const { error } = await supabase
      .from('orders')
      .update({ total_amount: total })
      .eq('id', order.value.id)

  if (!error) order.value.total_amount = total
}

// 🗑️ Delete single item
const deleteItem = async (item: any) => {
  if (!confirm('Yakin hapus item ini?')) return
  const { error } = await supabase.from('order_items').delete().eq('id', item.id)
  if (error) await showToast('Gagal menghapus item: ' + error.message, 'danger')
  else {
    orderItems.value = orderItems.value.filter((i) => i.id !== item.id)
    await recalcTotal()
    await showToast('Item dihapus.', 'medium')
  }
}

onMounted(loadOrder)
</script>
