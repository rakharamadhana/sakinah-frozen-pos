<template>
  <ion-toast
      :is-open="isOpen"
      :message="message"
      :color="color"
      :duration="duration"
      position="bottom"
      @didDismiss="isOpen = false"
  />
</template>

<script setup lang="ts">
import { IonToast } from '@ionic/vue'
import { ref, watchEffect, defineExpose } from 'vue'

// internal reactive state
const isOpen = ref(false)
const message = ref('')
const color = ref<'success' | 'danger' | 'warning' | 'primary' | 'medium'>('primary')
const duration = ref(2000)

// function to show toast
const show = (
    msg: string,
    type: 'success' | 'danger' | 'warning' | 'primary' | 'medium' = 'primary',
    time = 2000
) => {
  message.value = msg
  color.value = type
  duration.value = time
  isOpen.value = true
}

// expose to parent
defineExpose({ show })
</script>
