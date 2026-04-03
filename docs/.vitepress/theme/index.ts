import DefaultTheme from 'vitepress/theme'
import HomePage from './HomePage.vue'
import CommunitySection from './CommunitySection.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
    app.component('CommunitySection', CommunitySection)
  },
}
