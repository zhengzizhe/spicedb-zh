<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const zh = lang.value?.startsWith('zh')

interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

const contributors = ref<Contributor[]>([])
const loaded = ref(false)

// Generate random but stable positions for scattered layout
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

onMounted(async () => {
  try {
    const [spicedbResp, docsResp] = await Promise.allSettled([
      fetch('https://api.github.com/repos/authzed/spicedb/contributors?per_page=30'),
      fetch('https://api.github.com/repos/zhengzizhe/spicedb-zh/contributors?per_page=10'),
    ])

    const all: Contributor[] = []

    if (spicedbResp.status === 'fulfilled' && spicedbResp.value.ok) {
      const data = await spicedbResp.value.json()
      if (Array.isArray(data)) all.push(...data)
    }

    if (docsResp.status === 'fulfilled' && docsResp.value.ok) {
      const data = await docsResp.value.json()
      if (Array.isArray(data)) {
        for (const c of data) {
          if (!all.find(a => a.login === c.login)) all.push(c)
        }
      }
    }

    contributors.value = all.filter(c => c.login && !c.login.includes('[bot]')).slice(0, 24)
    loaded.value = true
  } catch {
    loaded.value = true
  }
})

const orbitContributors = computed(() => {
  return contributors.value.map((c, i) => {
    const total = contributors.value.length
    const angle = (i / total) * 360
    const ring = i < 8 ? 1 : i < 18 ? 2 : 3
    const radius = ring === 1 ? 120 : ring === 2 ? 200 : 270
    const size = ring === 1 ? 48 : ring === 2 ? 40 : 34
    const delay = seededRandom(i * 7) * -20
    const duration = 30 + ring * 15
    return { ...c, angle, radius, size, delay, duration, ring }
  })
})
</script>

<template>
  <section class="community-section">
    <!-- Constellation area: contributors orbit + Discord portal -->
    <div class="constellation">
      <!-- Left: text -->
      <div class="constellation-text">
        <span class="constellation-label">{{ zh ? '开源社区' : 'Open Source' }}</span>
        <h2>
          {{ zh ? '由社区构建' : 'Built by Community' }}
        </h2>
        <p>
          {{ zh
            ? 'SpiceDB 由全球开发者共同打造。加入社区，和我们一起推动权限系统的未来。'
            : 'SpiceDB is built by developers worldwide. Join us in shaping the future of authorization.'
          }}
        </p>

        <!-- Discord portal -->
        <a href="https://authzed.com/discord" target="_blank" class="discord-portal">
          <div class="portal-rings">
            <div class="portal-ring ring-1" />
            <div class="portal-ring ring-2" />
            <div class="portal-ring ring-3" />
          </div>
          <div class="portal-core">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <span class="portal-text">{{ zh ? '加入 Discord 社区' : 'Join Discord' }}</span>
        </a>

        <a href="https://github.com/authzed/spicedb" target="_blank" class="github-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          {{ zh ? '在 GitHub 上贡献' : 'Contribute on GitHub' }}
        </a>
      </div>

      <!-- Right: orbital contributor galaxy -->
      <div class="orbit-galaxy" v-if="loaded && contributors.length">
        <!-- Orbital rings (decorative) -->
        <div class="orbit-ring orbit-ring-1" />
        <div class="orbit-ring orbit-ring-2" />
        <div class="orbit-ring orbit-ring-3" />

        <!-- Center glow -->
        <div class="galaxy-core">
          <div class="core-glow" />
          <span class="core-count">{{ contributors.length }}+</span>
        </div>

        <!-- Orbiting avatars -->
        <div
          v-for="c in orbitContributors"
          :key="c.login"
          class="orbit-avatar"
          :style="{
            '--angle': `${c.angle}deg`,
            '--radius': `${c.radius}px`,
            '--size': `${c.size}px`,
            '--delay': `${c.delay}s`,
            '--duration': `${c.duration}s`,
          }"
        >
          <a :href="c.html_url" target="_blank" :title="c.login">
            <img :src="c.avatar_url" :alt="c.login" loading="lazy" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
