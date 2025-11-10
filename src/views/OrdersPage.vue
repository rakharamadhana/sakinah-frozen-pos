<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Daftar Pesanan</ion-title>
      </ion-toolbar>

      <!-- 🔹 Tabs -->
      <ion-toolbar>
        <ion-segment v-model="selectedTab" @ionChange="onSegmentChange">
          <ion-segment-button value="active">
            <ion-label>Aktif</ion-label>
          </ion-segment-button>
          <ion-segment-button value="completed">
            <ion-label>Selesai</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- ✅ Swiper Element -->
      <swiper-container
          ref="swiperEl"
          :slides-per-view="1"
          :speed="250"
          @slidechange="onSlideChange"
      >
      <!-- 🟡 Active Orders -->
        <swiper-slide>
          <ion-list v-if="activeOrders.length">
            <ion-item
                v-for="order in activeOrders"
                :key="order.id"
                button
                detail
                @click="$router.push(`/order/${order.id}`)"
            >
              <ion-label>
                <h2>
                  Order #{{ order.id.slice(0, 6) }}
                  <ion-badge :color="getStatusColor(order.status)" class="ion-margin-start">
                    {{ order.status }}
                  </ion-badge>
                </h2>
                <p>Buyer: {{ order.customers?.name || 'N/A' }}</p>
                <p>Total: {{ order.total_amount }} NTD</p>
              </ion-label>

              <ion-button
                  fill="clear"
                  color="success"
                  size="small"
                  @click.stop="markAsCompleted(order)"
              >
                <ion-icon :icon="checkmarkOutline" />
              </ion-button>


              <ion-button
                  v-if="order.customers?.map_link"
                  fill="clear"
                  color="primary"
                  size="small"
                  @click.stop="openMap(order.customers.map_link)"
              >
                <ion-icon :icon="navigateOutline" />
              </ion-button>

              <ion-button
                  fill="clear"
                  color="success"
                  size="small"
                  @click.stop="copyOrder(order)"
              >
                <ion-icon :icon="copyOutline" />
              </ion-button>
            </ion-item>
          </ion-list>
          <ion-text v-else color="medium"><p>Tidak ada pesanan aktif.</p></ion-text>
        </swiper-slide>

        <!-- 🟢 Completed Orders -->
        <swiper-slide>
          <ion-list v-if="completedOrders.length">
            <ion-item
                v-for="order in completedOrders"
                :key="order.id"
                button
                detail
                @click="$router.push(`/order/${order.id}`)"
            >
              <ion-label>
                <h2>
                  Order #{{ order.id.slice(0, 6) }}
                  <ion-badge color="success" class="ion-margin-start">Completed</ion-badge>
                </h2>
                <p>Buyer: {{ order.customers?.name || 'N/A' }}</p>
                <p>Total: {{ order.total_amount }} NTD</p>
              </ion-label>

              <ion-button
                  fill="clear"
                  color="success"
                  size="small"
                  @click.stop="copyOrder(order)"
              >
                <ion-icon :icon="copyOutline" />
              </ion-button>
            </ion-item>
          </ion-list>
          <ion-text v-else color="medium"><p>Tidak ada pesanan selesai.</p></ion-text>
        </swiper-slide>
      </swiper-container>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="$router.push('/new-order')">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <app-toast ref="toast" />
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
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonFab,
  IonFabButton,
  IonIcon,
  IonBadge,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton
} from '@ionic/vue'
import AppToast from '@/components/AppToast.vue'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { onIonViewWillEnter } from '@ionic/vue'
import { supabase } from '@/supabase'
import { addOutline, navigateOutline, copyOutline, checkmarkOutline } from 'ionicons/icons'
import { Clipboard } from '@capacitor/clipboard'

const orders = ref<any[]>([])
const selectedTab = ref<'active' | 'completed'>('active')
const swiperEl = ref<any>(null)
const toast = ref<any>(null)

// ⚙️ Swiper settings
const slideOpts = {
  slidesPerView: 1,
  speed: 250,
  allowTouchMove: true
}

// 🧭 Filter orders
const activeOrders = computed(() =>
    orders.value.filter(o => o.status === 'Pending' || o.status === 'In-Delivery')
)
const completedOrders = computed(() =>
    orders.value.filter(o => o.status === 'Completed')
)

// 📦 Load from Supabase
const loadOrders = async () => {
  const { data, error } = await supabase
      .from('orders')
      .select('*, customers(name, map_link)')
      .order('created_at', { ascending: false })
  if (!error && data) orders.value = data
  else console.error(error)
}

// 📱 Refresh event
const handleRefresh = async (ev: CustomEvent) => {
  await loadOrders()
  ev.detail.complete()
}

// 🔵 Slide → Segment
const onSlideChange = (event: any) => {
  const swiper = event.target.swiper
  selectedTab.value = swiper?.activeIndex === 0 ? 'active' : 'completed'
}

const markAsCompleted = async (order: any) => {
  try {
    const { error } = await supabase
        .from('orders')
        .update({ status: 'Completed' })
        .eq('id', order.id)

    if (error) throw error

    // update the local state instantly for reactivity
    const target = orders.value.find(o => o.id === order.id)
    if (target) target.status = 'Completed'

    toast.value?.show('Pesanan ditandai sebagai selesai ✅', 'success')
  } catch (err: any) {
    console.error(err)
    toast.value?.show('Gagal memperbarui status: ' + err.message, 'danger')
  }
}


// 🌍 Open map in browser
const openMap = (link: string) => {
  if (link) window.open(link, '_blank')
}

// 📋 Copy order text
const copyOrder = async (order: any) => {
  try {
    const { data: items, error } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order.id)
    if (error) throw error

    let text = `Rincian Order (${order.customers?.name || 'N/A'})\n\n`
    if (items?.length) {
      text += items
          .map(i =>
              `${i.products?.name} @${i.unit_price} x ${i.weight_kg.toFixed(3)} ${i.products?.unit || ''} = ${i.line_total} NTD`
          )
          .join('\n')
      text += `\n\nTOTAL ${order.total_amount} NTD`
    } else {
      text += `Total: ${order.total_amount} NTD`
    }

    await Clipboard.write({ string: text })
    toast.value?.show('Rincian order disalin ke clipboard!', 'primary')
  } catch (err: any) {
    console.error(err)
    toast.value?.show('Gagal menyalin order: ' + err.message, 'danger')
  }
}

// 🟡 Badge color helper
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'success'
    case 'In-Delivery':
      return 'warning'
    default:
      return 'medium'
  }
}

// 🔄 Lifecycle
onIonViewWillEnter(loadOrders)
onMounted(loadOrders)

onMounted(async () => {
  await loadOrders()

  // ✅ register swiper listener manually to ensure Vue reactivity
  const el = swiperEl.value as HTMLElement & { swiper?: any }
  if (el?.swiper) {
    el.swiper.on('slideChange', () => {
      const index = el.swiper.activeIndex
      selectedTab.value = index === 0 ? 'active' : 'completed'
    })
  }
})

onBeforeUnmount(() => {
  const el = swiperEl.value as HTMLElement & { swiper?: any }
  el?.swiper?.off('slideChange')
})

const onSegmentChange = async () => {
  if (!swiperEl.value?.swiper) return
  const index = selectedTab.value === 'active' ? 0 : 1
  swiperEl.value.swiper.slideTo(index)
}


</script>

