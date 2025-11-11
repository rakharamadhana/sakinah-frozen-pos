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

        <!-- 🧾 Product List -->
        <ion-item v-for="p in products" :key="p.id">
          <ion-label>
            <h2>{{ p.name }}</h2>
            <p>@{{ p.sell_price }} NTD / {{ p.unit }}</p>
          </ion-label>
          <ion-button size="small" @click="openAddQuantity(p)">
            + {{ p.unit }}
          </ion-button>
        </ion-item>
      </ion-list>

      <!-- 🧮 Order Summary -->
      <ion-card v-if="currentItems.length">
        <ion-card-header>
          <ion-card-title>Rincian Order</ion-card-title>
        </ion-card-header>

        <ion-card-content>
          <ion-list>
            <ion-item v-for="(item, idx) in currentItems" :key="idx">
              <ion-label>
                {{ item.product.name }}
                @{{ item.unitPrice }} × {{ item.quantity.toFixed(3) }}
                {{ item.product.unit }} = {{ item.lineTotal }} NTD
              </ion-label>
              <ion-button fill="clear" color="danger" @click="removeItem(idx)">
                Hapus
              </ion-button>
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

          <ion-button
              expand="block"
              class="ion-margin-top"
              @click="saveOrder"
              :disabled="saving"
          >
            {{ saving ? "Menyimpan..." : "Simpan Pesanan" }}
          </ion-button>
        </ion-card-content>
      </ion-card>
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
  IonListHeader,
  IonItem,
  IonLabel,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonNote,
  IonInput,
  toastController,
} from "@ionic/vue";
import { alertController } from "@ionic/vue";
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/supabase";
import { Clipboard } from "@capacitor/clipboard";
import { Share } from "@capacitor/share";
import { useRouter } from "vue-router";

const router = useRouter();

const products = ref<any[]>([]);
const currentItems = ref<any[]>([]);
const buyerName = ref("");
const saving = ref(false);

// 🔔 Toast helper
const showToast = async (message: string, color: string = "primary") => {
  const toast = await toastController.create({
    message,
    duration: 1500,
    position: "bottom",
    color,
  });
  await toast.present();
};

// 🐔 Load products
const loadProducts = async () => {
  const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);
  products.value = data || [];
};
onMounted(loadProducts);

// ➕ Add product quantity modal
const openAddQuantity = async (p: any) => {
  const alert = await alertController.create({
    header: `Masukkan Jumlah (${p.unit})`,
    inputs: [
      {
        name: "qty",
        type: "number",
        value: "1.000",
        placeholder: `Jumlah (${p.unit})`,
      },
    ],
    buttons: [
      { text: "Batal", role: "cancel" },
      {
        text: "Tambah",
        handler: (data) => {
          const q = Number(data.qty);
          if (isNaN(q) || q <= 0) {
            showToast("Jumlah tidak valid!", "danger");
            return false;
          }

          const lineTotal = Math.ceil(q * p.sell_price);
          currentItems.value.push({
            product: p,
            quantity: q,
            unitPrice: p.sell_price,
            lineTotal,
          });
          showToast(`${p.name} ditambahkan ke daftar.`);
        },
      },
    ],
  });

  await alert.present();
};

// 🧮 Calculations
const removeItem = (i: number) => {
  const removed = currentItems.value.splice(i, 1);
  if (removed.length) showToast(`${removed[0].product.name} dihapus.`, "medium");
};
const totalAmount = computed(() =>
    currentItems.value.reduce((s, i) => s + i.lineTotal, 0)
);

// 📋 Copy helper
const copyToClipboard = async (text: string) => {
  try {
    await Clipboard.write({ string: text });
  } catch {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      await showToast("Tidak bisa menyalin teks.", "danger");
    }
  }
};

// 💾 Save order
const saveOrder = async () => {
  if (!buyerName.value) {
    await showToast("Isi nama pembeli terlebih dahulu.", "danger");
    return;
  }
  saving.value = true;

  try {
    // 1️⃣ Get or create customer
    const { data: customerData, error: cErr } = await supabase
        .from("customers")
        .upsert({ name: buyerName.value }, { onConflict: "name" })
        .select()
        .single();
    if (cErr) throw cErr;

    // 2️⃣ Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await showToast("Sesi login berakhir, silakan login kembali.", "danger");
      router.push("/login");
      return;
    }

    // 3️⃣ Create order
    const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerData.id,
          total_amount: totalAmount.value,
          status: "Pending",
          added_by: user.id,
        })
        .select()
        .single();
    if (oErr) throw oErr;

    // 4️⃣ Add order items
    const itemsPayload = currentItems.value.map((i) => ({
      order_id: order.id,
      product_id: i.product.id,
      weight_kg: i.quantity, // keep name for backward compatibility
      unit_price: i.unitPrice,
      line_total: i.lineTotal,
    }));
    const { error: iErr } = await supabase
        .from("order_items")
        .insert(itemsPayload);
    if (iErr) throw iErr;

    // 5️⃣ Generate receipt text
    const text =
        `Rincian Order (${buyerName.value})\n\n` +
        currentItems.value
            .map(
                (i) =>
                    `${i.product.name} @${i.unitPrice} x ${i.quantity.toFixed(3)} ${
                        i.product.unit
                    } = ${i.lineTotal}`
            )
            .join("\n") +
        `\n\nTOTAL ${totalAmount.value} NTD`;

    // 6️⃣ Copy & share
    await copyToClipboard(text);
    await Share.share({ text });

    await showToast("Order disimpan & teks disalin.", "success");
    router.push("/orders");
  } catch (err: any) {
    console.error(err);
    await showToast("Gagal menyimpan order: " + err.message, "danger");
  } finally {
    saving.value = false;
  }
};
</script>
