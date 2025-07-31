<template>
  <div class="sci-fi-container">
    <!-- Loading Cover -->
    <LoadingCover v-if="showLoadingCover" @ready="onSystemReady" />

    <!-- Background music -->
    <audio 
      ref="bgmAudio" 
      loop 
      preload="auto"
      @error="onAudioError"
      @canplaythrough="onAudioReady">
      <source src="./assets/如我所书.mp3" type="audio/mpeg">
      Your browser does not support the audio element.
    </audio>

    <!-- Main Application -->
    <div 
      v-show="!showLoadingCover" 
      class="main-app"
      :class="{ 'app-enter': appEntered }">
      <!-- Notification Container -->
      <NotificationContainer ref="notificationContainer" />
      <!-- Background animations -->
      <BackgroundEffects />

      <!-- Header -->
      <Header />

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Section -->
        <TopSection />

        <!-- Folders Section -->
        <FoldersSection
          :folders="store.folders"
          :selected-folder="store.selectedFolder"
          @select-folder="store.selectFolder"
          @folder-hover="onFolderHover"
          @folder-leave="onFolderLeave"
        />

        <!-- Progress Bar -->
        <ProgressBar :progress="store.progress" />

        <!-- Bottom Section -->
        <div class="bottom-section">
          <!-- Left Panel -->
          <FilePanel
            :files="store.currentFiles"
            :selected-file="store.selectedFile"
            @select-file="store.selectFile"
            @file-hover="onFileHover"
            @file-leave="onFileLeave"
          />

          <!-- Right Panel -->
          <ContentPanel :content="store.selectedFileContent" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { onMounted, ref } from 'vue'
import { useAppStore } from './stores/appStore'
import LoadingCover from './components/LoadingCover.vue'
import NotificationContainer from './components/NotificationContainer.vue'
import BackgroundEffects from './components/BackgroundEffects.vue'
import Header from './components/Header.vue'
import TopSection from './components/TopSection.vue'
import OmphalosSystem from './components/OmphalosSystem.vue'
import FoldersSection from './components/FoldersSection.vue'
import ProgressBar from './components/ProgressBar.vue'
import FilePanel from './components/FilePanel.vue'
import ContentPanel from './components/ContentPanel.vue'
import { notificationService } from './services/notificationService'

// Use the store directly to maintain reactivity
const store = useAppStore()

// Loading state
const showLoadingCover = ref(true)
const appEntered = ref(false)

// Audio reference
const bgmAudio = ref<HTMLAudioElement | null>(null)
const audioReady = ref(false)

// Notification container reference
const notificationContainer = ref<InstanceType<typeof NotificationContainer> | null>(null)

// Event handlers
const onFolderHover = () => {
  // Add hover effects if needed
}

const onFolderLeave = () => {
  // Remove hover effects if needed
}

const onFileHover = () => {
  // Add file hover effects if needed
}

const onFileLeave = () => {
  // Remove file hover effects if needed
}

// Audio event handlers
const onAudioError = (e: Event) => {
  console.error('Audio failed to load:', e)
  audioReady.value = true // Continue even if audio fails
}

const onAudioReady = () => {
  console.log('Audio is ready to play')
  audioReady.value = true
}

// System ready handler
const onSystemReady = () => {
  showLoadingCover.value = false
  
  // Start the blur-to-clear transition
  setTimeout(() => {
    appEntered.value = true
  }, 100)
  
  // Start BGM when entering the system
  setTimeout(() => {
    playBGM()
  }, 500)
  
  // Start app animations
  store.animateProgress()
  
  // Initialize notification service
  if (notificationContainer.value) {
    notificationService.setContainer(notificationContainer.value)
  }
}

// Auto-play BGM function
const playBGM = async () => {
  if (bgmAudio.value) {
    try {
      bgmAudio.value.volume = 1 // Set volume
      await bgmAudio.value.play()
      console.log('BGM started playing')
    } catch (error) {
      console.log('Auto-play blocked by browser:', error)
      // Add click listener to start audio on user interaction
      document.addEventListener('click', startAudioOnClick, { once: true })
    }
  }
}

const startAudioOnClick = async () => {
  if (bgmAudio.value) {
    try {
      await bgmAudio.value.play()
      console.log('BGM started after user interaction')
    } catch (error) {
      console.error('Failed to start BGM:', error)
    }
  }
}

// Lifecycle
onMounted(() => {
  // Audio will be handled by the loading cover
  // Main app initialization will happen after loading cover is dismissed
})
</script>

<style scoped>
.sci-fi-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background: 
    radial-gradient(ellipse at center, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%);
  color: #00d4ff;
  font-family: 'Courier New', monospace;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  perspective: 1000px;
}

.main-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  opacity: 0;
  transform: scale(0.95);
  transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-app.app-enter {
  backdrop-filter: blur(0px);
  opacity: 1;
  transform: scale(1);
}

/* Main Content */
.main-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  box-sizing: border-box;
  min-height: 0;
}

/* Bottom Section */
.bottom-section {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }
  
  .bottom-section {
    flex-direction: column;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 10px;
  }
  
  .sci-fi-container {
    height: auto;
    min-height: 100vh;
  }
  
  .main-app {
    height: auto;
    min-height: 100vh;
  }
  
  .bottom-section {
    flex: 1;
    min-height: 0;
  }
}
</style>