<template>
  <div class="notification-container">
    <TransitionGroup name="notification-list" tag="div" class="notification-list">
      <Notification
        v-for="notification in notifications"
        :key="notification.id"
        :id="notification.id"
        :title="notification.title"
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        @close="removeNotification"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Notification from './Notification.vue'
import type { NotificationProps } from './Notification.vue'

const notifications = ref<NotificationProps[]>([])

const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
  const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  notifications.value.unshift({
    ...notification,
    id
  })
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Expose methods for global use
defineExpose({
  addNotification,
  removeNotification
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
}

/* List transition animations */
.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-list-move {
  transition: transform 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .notification-list {
    gap: 8px;
  }
}
</style> 