import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PDF and Image + — Free PDF & Image Tools',
    short_name: 'PDF & Image +',
    description: 'Free online PDF and image tools. No registration required.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      { src: '/logo-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
