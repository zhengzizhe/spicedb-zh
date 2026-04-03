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

    <!-- Contributors scrolling flow -->
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

    <!-- Discord: organic floating decoration -->
    <div class="discord-deco">
      <a href="https://authzed.com/discord" target="_blank" class="discord-blob-link">
        <!-- Morphing blob background -->
        <svg class="blob-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blob-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#5865F2" />
              <stop offset="50%" stop-color="#7B68EE" />
              <stop offset="100%" stop-color="#A43189" />
            </linearGradient>
          </defs>
          <path fill="url(#blob-grad)" class="blob-path-1"
            d="M44.7,-76.4C58.8,-69.2,71.8,-58.6,79.6,-45.1C87.4,-31.6,90,-15.3,88.5,-0.9C87,13.6,81.4,27.1,73.4,39.2C65.4,51.3,55,61.9,42.6,69.4C30.2,76.9,15.1,81.3,0.1,81.2C-15,81,-30,76.3,-43.2,69.2C-56.4,62.1,-67.9,52.5,-75.5,40.2C-83.1,27.8,-86.8,12.6,-85.2,-1.5C-83.7,-15.5,-76.9,-28.5,-68.2,-40.6C-59.5,-52.7,-48.9,-64,-36.3,-72C-23.7,-80,-11.9,-84.7,1.7,-87.6C15.2,-90.5,30.5,-83.6,44.7,-76.4Z"
            transform="translate(100 100)" />
        </svg>
        <svg class="blob-svg blob-svg-2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="url(#blob-grad)" opacity="0.3" class="blob-path-2"
            d="M39.5,-67.8C52.9,-60.5,66.8,-53.3,75.1,-42C83.5,-30.6,86.3,-15.3,84.6,-1C82.9,13.3,76.7,26.6,68.5,38.2C60.3,49.8,50.1,59.6,38,66.7C25.9,73.8,12.9,78.2,-0.8,79.6C-14.6,81,-29.2,79.4,-41.6,72.5C-54,65.7,-64.2,53.6,-71.6,40C-79,26.5,-83.6,11.5,-83,-1.2C-82.4,-14,-76.6,-24.5,-68.7,-35.3C-60.8,-46.1,-50.8,-57.2,-38.8,-65.2C-26.8,-73.2,-13.4,-78.1,0.3,-78.6C14,-79.1,26.1,-75.2,39.5,-67.8Z"
            transform="translate(100 100)" />
        </svg>

        <!-- Floating petals -->
        <div class="petal petal-1" />
        <div class="petal petal-2" />
        <div class="petal petal-3" />
        <div class="petal petal-4" />
        <div class="petal petal-5" />

        <!-- Content -->
        <div class="discord-blob-inner">
          <svg class="discord-icon-svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span class="discord-blob-text">{{ zh ? '加入社区' : 'Join Us' }}</span>
        </div>
      </a>
    </div>

  </section>
</template>
