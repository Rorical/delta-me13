<template>
  <div class="background">
    <div class="holographic-grid"></div>
    <div class="energy-waves">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
      <div class="wave wave-3"></div>
    </div>
    <div class="scan-lines"></div>
    <div class="floating-digits">
      <span v-for="(digit, index) in floatingDigits" :key="index" 
            :style="digit.style" class="digit">{{ digit.value }}</span>
    </div>
    <div class="glitch-blocks">
      <div v-for="(block, index) in glitchBlocks" :key="index" 
           :style="block.style" class="glitch-block"></div>
    </div>
    <div class="moving-bars">
      <div v-for="(bar, index) in movingBars" :key="index" 
           :style="bar.style" class="moving-bar"></div>
    </div>
    <div class="falling-binary-strings">
      <div v-for="(string, index) in fallingBinaryStrings" :key="index" 
           :style="string.style" class="binary-string">
        <div v-for="(char, charIndex) in string.characters" :key="charIndex" 
             class="binary-char">{{ char }}</div>
      </div>
    </div>
    <div class="particle-field">
      <div v-for="(particle, index) in particles" :key="index" 
           :style="particle.style" class="particle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface FloatingDigit {
  value: string
  style: {
    left: string
    top: string
    animationDelay: string
    animationDuration: string
  }
}

interface GlitchBlock {
  style: {
    left: string
    top: string
    width: string
    height: string
    animationDelay: string
  }
}

interface MovingBar {
  style: {
    left: string
    top: string
    animationDelay: string
    animationDuration: string
  }
}

interface FallingBinaryString {
  characters: string[]
  style: {
    left: string
    animationDelay: string
    animationDuration: string
  }
}

// Reactive data
const floatingDigits = ref<FloatingDigit[]>([])
const glitchBlocks = ref<GlitchBlock[]>([])
const movingBars = ref<MovingBar[]>([])
const fallingBinaryStrings = ref<FallingBinaryString[]>([])
const particles = ref<any[]>([])
let binaryStringInterval: number | null = null

const generateParticles = () => {
  const particleArray: any[] = []
  for (let i = 0; i < 20; i++) {
    particleArray.push({
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        animationDuration: (Math.random() * 3 + 2) + 's'
      }
    })
  }
  particles.value = particleArray
}

const generateFloatingDigits = () => {
  const digits: FloatingDigit[] = []
  for (let i = 0; i < 30; i++) {
    digits.push({
      value: Math.random() > 0.5 ? '1' : '0',
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 10 + 's',
        animationDuration: (Math.random() * 15 + 10) + 's'
      }
    })
  }
  floatingDigits.value = digits
}

const generateGlitchBlocks = () => {
  const blocks: GlitchBlock[] = []
  for (let i = 0; i < 15; i++) {
    blocks.push({
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        width: (Math.random() * 50 + 10) + 'px',
        height: (Math.random() * 20 + 5) + 'px',
        animationDelay: Math.random() * 5 + 's'
      }
    })
  }
  glitchBlocks.value = blocks
}

const generateMovingBars = () => {
  const bars: MovingBar[] = []
  for (let i = 0; i < 8; i++) {
    bars.push({
      style: {
        left: '-100px',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 8 + 's',
        animationDuration: (Math.random() * 10 + 15) + 's'
      }
    })
  }
  movingBars.value = bars
}

const generateBinaryString = () => {
  const length = Math.floor(Math.random() * 15) + 8 // 8-22 characters
  const characters: string[] = []
  
  for (let i = 0; i < length; i++) {
    characters.push(Math.random() > 0.5 ? '1' : '0')
  }
  
  return {
    characters,
    style: {
      left: Math.random() * 95 + '%',
      animationDelay: '0s',
      animationDuration: (Math.random() * 8 + 12) + 's'
    }
  }
}

const addFallingBinaryString = () => {
  const newString = generateBinaryString()
  fallingBinaryStrings.value.push(newString)
  
  // Remove the string after animation completes
  setTimeout(() => {
    const index = fallingBinaryStrings.value.indexOf(newString)
    if (index > -1) {
      fallingBinaryStrings.value.splice(index, 1)
    }
  }, parseFloat(newString.style.animationDuration) * 1000)
}

// Lifecycle
onMounted(() => {
  generateFloatingDigits()
  generateGlitchBlocks()
  generateMovingBars()
  generateParticles()
  
  // Regenerate glitch blocks periodically
  const glitchInterval = setInterval(() => {
    generateGlitchBlocks()
  }, 3000)
  
  // Generate falling binary strings randomly
  binaryStringInterval = setInterval(() => {
    if (Math.random() > 0.3) { // 70% chance to generate
      addFallingBinaryString()
    }
  }, 1500) as unknown as number // Check every 1.5 seconds
  
  onUnmounted(() => {
    clearInterval(glitchInterval)
    if (binaryStringInterval) {
      clearInterval(binaryStringInterval)
    }
  })
})
</script>

<style scoped>
/* Background Effects */
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 
    inset 0 0 50px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 212, 255, 0.1);
}

.holographic-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-pulse 4s ease-in-out infinite;
}

@keyframes grid-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.energy-waves {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  width: 200%;
  height: 200%;
  border-radius: 50%;
  border: 1px solid rgba(0, 212, 255, 0.05);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: wave-expand infinite ease-out;
}

.wave-1 { animation-duration: 8s; animation-delay: 0s; }
.wave-2 { animation-duration: 8s; animation-delay: 2.5s; }
.wave-3 { animation-duration: 8s; animation-delay: 5s; }

@keyframes wave-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.1);
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

.particle-field {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(0, 212, 255, 0.6);
  border-radius: 50%;
  animation: particle-float infinite linear;
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.8);
}

@keyframes particle-float {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

.scan-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 212, 255, 0.05) 1px,
    rgba(0, 212, 255, 0.05) 2px
  );
  background-size: 100% 4px;
  animation: scan-lines 3s linear infinite;
  pointer-events: none;
}

@keyframes scan-lines {
  0% { transform: translateY(0); }
  100% { transform: translateY(40px); }
}

.digit {
  position: absolute;
  font-size: 14px;
  color: rgba(0, 212, 255, 0.2);
  animation: float infinite linear;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

@keyframes float {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
}

.glitch-block {
  position: absolute;
  background: rgba(77, 208, 225, 0.1);
  animation: glitch 0.8s infinite;
}

@keyframes glitch {
  0%, 90%, 100% { opacity: 0; }
  5%, 85% { opacity: 1; }
}

.moving-bar {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.4), transparent);
  animation: move-bar infinite linear;
  box-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

@keyframes move-bar {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(calc(100vw + 100px)); }
}

.binary-string {
  position: absolute;
  top: -200px;
  display: flex;
  flex-direction: column;
  animation: fall-and-fade infinite linear;
  pointer-events: none;
}

.binary-char {
  font-size: 16px;
  color: rgba(0, 212, 255, 0.3);
  text-shadow: 0 0 4px rgba(0, 212, 255, 0.2);
  line-height: 1.2;
  font-family: 'Courier New', monospace;
  margin-bottom: 2px;
}

@keyframes fall-and-fade {
  0% { 
    transform: translateY(0); 
    opacity: 0; 
  }
  10% { 
    opacity: 1; 
  }
  80% { 
    opacity: 1; 
  }
  100% { 
    transform: translateY(calc(100vh + 200px)); 
    opacity: 0; 
  }
}
</style> 