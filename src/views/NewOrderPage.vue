<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tambah Pesanan Baru</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-list-header>
          <ion-label>Pilih Produk</ion-label>
        </ion-list-header>

        <ion-item v-for="p in products" :key="p.id">
          <ion-label>
            <h2>{{ p.name }}</h2>
            <p>@{{ p.price_per_kg }} NTD / kg</p>
          </ion-label>
          <ion-button size="small" @click="openAddKg(p)">
            + Kg
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-card v-if="currentItems.length">
        <ion-card-header>
          <ion-card-title>Rincian Order</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item v-for="(item, idx) in currentItems" :key="idx">
              <ion-label>
                {{ item.product.name }} @{{ item.unitPrice }} x {{ item.weightKg.toFixed(3) }} = {{ item.lineTotal }} NTD
              </ion-label>
              <ion-button fill="clear" color="danger" @click="removeItem(idx)">Hapus</ion-button>
            </ion-item>
            <ion-item>
              <ion-label><strong>Total</strong></ion-label>
              <ion-note slot="end"><strong>{{ totalAmount }} NTD</strong></ion-note>
            </ion-item>
          </ion-list>

          <ion-item>
            <ion-label position="stacked">Nama Pembeli</ion-label>
            <ion-input v-model="buyerName"></ion-input>
          </ion-item>

          <ion-button expand="block" class="ion-margin-top" @click="saveOrder" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Pesanan' }}
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonListHeader,
  IonItem, IonLabel, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonNote, IonInput
} from '@ionic/vue'
import { alertController } from '@ionic/vue'

import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { Clipboard } from '@capacitor/clipboard'
import { Share } from '@capacitor/share'
import { useRouter } from 'vue-router'

const router = useRouter()

const products = ref<any[]>([])
const currentItems = ref<any[]>([])
const buyerName = ref('')
const saving = ref(false)

// 🐔 Load products
const loadProducts = async () => {
  const { data } = await supabase.from('products').select('*').eq('is_active', true)
  products.value = data || []
}
onMounted(loadProducts)

// ➕ Add product weight modal
const openAddKg = async (p: any) => {
  const alert = await alertController.create({
    header: 'Masukkan Berat (kg)',
    inputs: [
      {
        name: 'weight',
        type: 'number',
        value: '1.000',
        placeholder: 'Berat (kg)'
      }
    ],
    buttons: [
      {
        text: 'Batal',
        role: 'cancel'
      },
      {
        text: 'Tambah',
        handler: (data) => {
          const w = Number(data.weight)
          if (isNaN(w) || w <= 0) {
            return false // prevent dismiss if invalid
          }

          const lineTotal = Math.ceil(w * p.price_per_kg)
          currentItems.value.push({
            product: p,
            weightKg: w,
            unitPrice: p.price_per_kg,
            lineTotal
          })
        }
      }
    ]
  })

  await alert.present()
}

// 🧮 Calculations
const removeItem = (i: number) => currentItems.value.splice(i, 1)
const totalAmount = computed(() => currentItems.value.reduce((s, i) => s + i.lineTotal, 0))

// 📋 Copy helper
const copyToClipboard = async (text: string) => {
  try {
    await Clipboard.write({ string: text })
    console.log('Copied via Capacitor')
  } catch (err) {
    try {
      await navigator.clipboard.writeText(text)
      console.log('Copied via Web Clipboard')
    } catch (err2) {
      alert('Tidak bisa menyalin ke clipboard, silakan salin manual.')
    }
  }
}

// 💾 Save order
const saveOrder = async () => {
  if (!buyerName.value) return alert('Isi nama pembeli terlebih dahulu.')
  saving.value = true

  try {
    // 1️⃣ Get or create customer
    const { data: customerData, error: cErr } = await supabase
        .from('customers')
        .upsert({ name: buyerName.value }, { onConflict: 'name' })
        .select()
        .single()
    if (cErr) throw cErr

    // 2️⃣ Create order
    const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({
          customer_id: customerData.id,
          total_amount: totalAmount.value,
          status: 'Pending'
        })
        .select()
        .single()
    if (oErr) throw oErr

    // 3️⃣ Add order items
    const itemsPayload = currentItems.value.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      weight_kg: i.weightKg,
      unit_price: i.unitPrice,
      line_total: i.lineTotal
    }))
    const { error: iErr } = await supabase.from('order_items').insert(itemsPayload)
    if (iErr) throw iErr

    // 4️⃣ Generate receipt text
    const text = `Rincian Order (${buyerName.value})\n\n` +
        currentItems.value
            .map(i => `${i.product.name} @${i.unitPrice} x ${i.weightKg.toFixed(3)} = ${i.lineTotal}`)
            .join('\n') +
        `\n\nTOTAL ${totalAmount.value} NTD`

    // 5️⃣ Copy & share
    await copyToClipboard(text)
    await new Promise(r => setTimeout(r, 150)) // small delay for focus safety
    await Share.share({ text })

    alert('Order disimpan & teks disalin.')
    router.push('/orders')

  } catch (err: any) {
    console.error(err)
    alert('Gagal menyimpan order: ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

