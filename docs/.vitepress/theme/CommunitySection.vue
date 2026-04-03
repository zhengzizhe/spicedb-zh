<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const zh = lang.value?.startsWith('zh')

interface Contributor {
  login: string
  avatar_url: string
  html_url: string
}

const contributors = ref<Contributor[]>([])
const loaded = ref(false)

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
    contributors.value = all.filter(c => c.login && !c.login.includes('[bot]'))
    loaded.value = true
  } catch {
    loaded.value = true
  }
})
</script>

<template>
  <section class="community-section">

    <!-- Contributors scrolling -->
    <div class="contributors-area" v-if="loaded && contributors.length">
      <h3>{{ zh ? '感谢所有贡献者' : 'Thanks to All Contributors' }}</h3>
      <p class="contributors-sub">
        {{ zh ? 'SpiceDB 核心项目 + 中文文档社区' : 'SpiceDB core project + Chinese docs community' }}
      </p>
      <div class="contributors-flow">
        <div class="flow-track">
          <a
            v-for="(c, i) in [...contributors, ...contributors]"
            :key="c.login + '-' + i"
            :href="c.html_url"
            target="_blank"
            class="contributor-bubble"
            :title="c.login"
          >
            <img :src="c.avatar_url" :alt="c.login" loading="lazy" />
            <span class="bubble-name">{{ c.login }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Discord: immersive aurora scene -->
    <a href="https://authzed.com/discord" target="_blank" class="aurora-scene">
      <!-- Aurora layers -->
      <div class="aurora-layer aurora-1" />
      <div class="aurora-layer aurora-2" />
      <div class="aurora-layer aurora-3" />

      <!-- Fireflies -->
      <div class="firefly" v-for="n in 12" :key="'ff'+n" :style="{
        '--ff-x': `${5 + (n * 7.3) % 90}%`,
        '--ff-y': `${10 + (n * 13.7) % 70}%`,
        '--ff-delay': `${(n * 0.8) % 5}s`,
        '--ff-dur': `${2.5 + (n * 0.7) % 3}s`,
        '--ff-size': `${2 + (n % 3)}px`,
      }" />

      <!-- Center content -->
      <div class="aurora-content">
        <div class="aurora-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
        <div class="aurora-text-group">
          <span class="aurora-title">{{ zh ? '加入 SpiceDB 社区' : 'Join the Community' }}</span>
          <span class="aurora-hint">{{ zh ? '和全球开发者交流权限建模的经验' : 'Discuss authorization modeling with developers worldwide' }}</span>
        </div>
        <span class="aurora-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </span>
      </div>
    </a>

  </section>
</template>
