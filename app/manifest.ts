import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Network Canvas Fresco',
    short_name: 'Fresco',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    theme_color: '#FFFFFF',
    background_color: '#FFFFFF',
    start_url: '/dashboard',
    display: 'standalone',
  };
}
