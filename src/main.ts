import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VBtn, VSelect, VTextarea } from 'vuetify/components'
import '@fontsource/ibm-plex-sans/300.css'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import 'vuetify/styles'
import 'leaflet/dist/leaflet.css'
import './fieldops.css'
import App from './App.vue'

const vuetify = createVuetify({
	components: { VBtn, VSelect, VTextarea },
	theme: {
		defaultTheme: 'fieldops',
		themes: {
			fieldops: {
				dark: false,
				colors: { primary: '#b9440a', secondary: '#1c3a4a', success: '#28633d', warning: '#8b4e00', error: '#a62d25', background: '#f4f2ee', surface: '#ffffff' },
			},
		},
	},
})

createApp(App).use(vuetify).mount('#app')
