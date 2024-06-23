import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'fresco',
    name: 'Network Canvas Fresco',
    short_name: 'Fresco',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#FFFFFF',
    background_color: '#FFFFFF',
    start_url: '/',
    display: 'standalone',
    screenshots: [
      {
        src: '/screenshot.png',
        sizes: '640x320',
        type: 'image/gif',
      },
    ],
  };
}
