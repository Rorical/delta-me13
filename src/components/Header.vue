<template>
  <header class="header" :class="{ 'header-glow': headerGlow }">
    <div class="header-left">
      <div class="app-icon">
        <img src="../assets/logo.png" alt="Logo" class="logo-image" />
      </div>
      <div class="app-title">
        <div class="app-name">如我所书</div>
        <div class="app-version">δ-me13.exe</div>
      </div>
    </div>
    <div class="header-right">
      <button class="header-btn" @click="triggerHeaderGlow">
        <span class="btn-icon">
          <Undo2 :size="30" :stroke-width="1.6" />
        </span>
        <div class="btn-ripple"></div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Undo2 } from 'lucide-vue-next'

const headerGlow = ref(false)

const triggerHeaderGlow = () => {
  headerGlow.value = true
  setTimeout(() => {
    headerGlow.value = false
  }, 1000)
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(173, 216, 230, 0.02);
  border-bottom: 1px solid rgba(173, 216, 230, 0.1);
  backdrop-filter: blur(1px);
  position: relative;
  z-index: 100;
}

.header-glow {
  box-shadow: 0 0 30px rgba(173, 216, 230, 0.3);
  transition: box-shadow 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.app-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: rgba(173, 216, 230, 0.9);
  filter: drop-shadow(0 0 10px rgba(173, 216, 230, 0.5));
}

.logo-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  z-index: 2;
  position: relative;
}

.app-title {
  display: flex;
  flex-direction: column;
}

.app-name {
  font-size: 17px;
  letter-spacing: 1px;
  color: var(--ui-muted);
}

.app-version {
  font-size: 22px;
  color: var(--ui-text);
}

.header-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--ui-text);
  padding: 4px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.header-btn:hover {
  filter: drop-shadow(0 0 8px rgba(173, 216, 230, 0.7));
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.btn-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(173, 216, 230, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.header-btn:active .btn-ripple {
  width: 100px;
  height: 100px;
}

/* Responsive */
@media (max-width: 480px) {
  .header {
    padding: 15px;
  }
}
</style> 