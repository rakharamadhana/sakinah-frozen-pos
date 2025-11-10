<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-card>
        <ion-card-header>
          <ion-card-title>💰 Pendapatan {{ currentMonthName }}</ion-card-title>

        </ion-card-header>
        <ion-card-content>
          <div class="ion-text-start">
            <h1 class="text-2xl font-bold">
              {{ formatInt(incomeThisMonth) }} NTD
            </h1>

            <p class="text-sm text-gray-400 ion-margin-top">
              {{ previousMonthName }}: {{ formatInt(incomeLastMonth) }} NTD
            </p>

            <p
                v-if="incomeChangePercent !== null"
                :style="{
    color: incomeChangePercent > 0
      ? 'var(--ion-color-success)'
      : incomeChangePercent < 0
      ? 'var(--ion-color-danger)'
      : 'var(--ion-color-medium)'
  }"
                class="text-sm font-medium ion-margin-top flex items-center gap-1"
            >
              <ion-icon
                  :icon="incomeChangePercent > 0 ? arrowUpOutline : incomeChangePercent < 0 ? arrowDownOutline : removeOutline"
                  size="small"
              ></ion-icon>
              {{ incomeChangePercent > 0 ? '+' : '' }}{{ incomeChangePercent.toFixed(1) }}%
              {{ incomeChangePercent > 0 ? 'lebih tinggi' : incomeChangePercent < 0 ? 'lebih rendah' : 'sama seperti' }} dari bulan lalu
            </p>

          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>📈 Profit Bulan Ini</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="ion-text-start">
            <h1 class="text-2xl font-bold">
              {{
                monthlyProfit.length
                    ? formatInt(monthlyProfit[0].total_profit)
                    : 0
              }} NTD
            </h1>
            <p class="text-sm text-gray-400 ion-margin-top">
              Revenue: {{ monthlyProfit.length ? formatInt(monthlyProfit[0].total_revenue) : 0 }} NTD
              <br />
              Cost: {{ monthlyProfit.length ? formatInt(monthlyProfit[0].total_cost) : 0 }} NTD
            </p>

          </div>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>💹 Profit per Produk</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list v-if="productProfits.length">
            <ion-item v-for="p in productProfits" :key="p.name">
              <ion-label>
                <strong>{{ p.name }}</strong>
                <p class="text-sm text-gray-500">
                  Revenue: {{ p.total_revenue }} NTD
                </p>
                <p class="text-sm text-gray-500">
                  Cost: {{ p.total_cost }} NTDR
                </p>
              </ion-label>

              <ion-note slot="end" style="font-size:0.9rem;font-weight:500;text-align:right;">
                {{ formatInt(p.total_profit) }} NTD
                <br />
                <span
                    :style="{
          color:
            p.total_revenue > 0
              ? (p.total_profit / p.total_revenue) * 100 >= 0
                ? 'var(--ion-color-success)'
                : 'var(--ion-color-danger)'
              : 'var(--ion-color-medium)'
        }"
                    style="font-size:0.85rem;"
                >
        {{
                    p.total_revenue > 0
                        ? ((p.total_profit / p.total_revenue) * 100).toFixed(1)
                        : '0.0'
                  }}%
      </span>
              </ion-note>
            </ion-item>
          </ion-list>
          <ion-text v-else color="medium">Belum ada data profit.</ion-text>
        </ion-card-content>
      </ion-card>


      <ion-card>
        <ion-card-header>
          <ion-card-title>⚖️ Penjualan per Produk</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list v-if="productSales.length">
            <ion-item v-for="p in productSales" :key="p.name">
              <ion-label><strong>{{ p.name }}</strong></ion-label>
              <ion-note slot="end" style="font-size: 0.95rem; font-weight: 500;">
                {{ p.total.toFixed(3) }} {{ p.unit }}
              </ion-note>
            </ion-item>
          </ion-list>
          <ion-text v-else color="medium">Belum ada data penjualan.</ion-text>
        </ion-card-content>
      </ion-card>


      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="peopleOutline" class="ion-margin-end"></ion-icon>
            Pembelian per Pelanggan
          </ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-list v-if="displayedCustomers.length">
            <ion-item v-for="c in displayedCustomers" :key="c.name" lines="none">
              <ion-label>{{ c.name }}</ion-label>
              <ion-note slot="end" style="font-size: 1rem; font-weight: 500;">
                {{ formatInt(c.total_spent) }} NTD
              </ion-note>

            </ion-item>
          </ion-list>

          <ion-text v-else color="medium">
            Belum ada data pelanggan.
          </ion-text>

          <div v-if="customerTotals.length > 5" class="ion-text-center ion-margin-top">
            <ion-button
                fill="clear"
                size="small"
                color="primary"
                @click="toggleShowMore"
            >
              {{ showAllCustomers ? 'Sembunyikan' : 'Tampilkan Semua' }}
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonLabel, IonNote, IonText, IonRefresher, IonRefresherContent, IonButton, IonIcon
} from '@ionic/vue'
import {ref, onMounted, computed} from 'vue'
import { supabase } from '@/supabase'
import { onIonViewWillEnter } from '@ionic/vue'
import { peopleOutline, arrowUpOutline, arrowDownOutline, removeOutline } from 'ionicons/icons'

// 🔢 Format to integer, rounded UP (no commas, no decimals)
const formatInt = (n: number) => {
  if (!n || isNaN(n)) return '0'
  return Math.ceil(n).toString()
}

// 🗓️ Month name formatter (Indonesian locale)
const getMonthName = (date: Date) =>
    date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

const currentMonthName = ref('')
const previousMonthName = ref('')

const incomeThisMonth = ref(0)
const productSales = ref<any[]>([])
const customerTotals = ref<any[]>([])

const showAllCustomers = ref(false)
const displayedCustomers = computed(() =>
    showAllCustomers.value
        ? customerTotals.value
        : customerTotals.value.slice(0, 5)
)

const toggleShowMore = () => {
  showAllCustomers.value = !showAllCustomers.value
}

const incomeLastMonth = ref(0)
const incomeChangePercent = ref<number | null>(null)

// 💹 Profit data
const productProfits = ref<any[]>([])
const monthlyProfit = ref<any[]>([])

// 🧭 Load data
const loadDashboard = async () => {
  const now = new Date()
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  currentMonthName.value = getMonthName(now)
  previousMonthName.value = getMonthName(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  // 💰 This month income
  const { data: thisMonth } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', firstDayThisMonth)
      .lt('created_at', firstDayNextMonth)
      .eq('status', 'Completed')

  incomeThisMonth.value = thisMonth?.reduce((s, o) => s + o.total_amount, 0) || 0

  // 💸 Last month income
  const { data: lastMonth } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', firstDayLastMonth)
      .lt('created_at', firstDayThisMonth)
      .eq('status', 'Completed')

  incomeLastMonth.value = lastMonth?.reduce((s, o) => s + o.total_amount, 0) || 0

  // 📈 Percentage change
  if (incomeLastMonth.value > 0) {
    incomeChangePercent.value =
        ((incomeThisMonth.value - incomeLastMonth.value) / incomeLastMonth.value) * 100
  } else {
    incomeChangePercent.value = incomeThisMonth.value > 0 ? 100 : 0
  }

  // ⚖️ Total kg sold per product
  const { data: productData } = await supabase.rpc('get_product_sales')
  productSales.value = productData || []

  // 👥 Total purchase per customer
  const { data: custData } = await supabase.rpc('get_customer_totals')
  customerTotals.value = custData || []

  const { data: profitData } = await supabase.rpc('get_product_profit_summary')
  productProfits.value = profitData || []

  const { data: monthlyData } = await supabase.rpc('get_monthly_profit_summary')
  monthlyProfit.value = monthlyData || []
}

onIonViewWillEnter(loadDashboard)
onMounted(loadDashboard)

const handleRefresh = async (ev: CustomEvent) => {
  await loadDashboard()
  ev.detail.complete()
}
</script>
