import type { NextConfig } from 'next';

const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 2000, 2560],
  },
  /* Every address the old static site used keeps working. */
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/index', destination: '/', permanent: true },
      { source: '/collection.html', destination: '/works', permanent: true },
      { source: '/collection', destination: '/works', permanent: true },
      { source: '/map.html', destination: '/map', permanent: true },
      { source: '/story.html', has: [{ type: 'query', key: 'id', value: '(?<id>.+)' }], destination: '/stories/:id', permanent: true },
      { source: '/story.html', destination: '/stories/roebling-fog', permanent: false },
      { source: '/story', destination: '/stories/roebling-fog', permanent: false },
      { source: '/print.html', has: [{ type: 'query', key: 'id', value: '(?<id>.+)' }], destination: '/prints/:id', permanent: true },
      { source: '/print.html', destination: '/prints/roebling-fog', permanent: false },
      { source: '/print', destination: '/prints/roebling-fog', permanent: false },
      { source: '/stories/:id.html', destination: '/stories/:id', permanent: true },
      { source: '/prints/:id.html', destination: '/prints/:id', permanent: true },
      { source: '/studio', destination: '/studio.html', permanent: false },
    ];
  },
};

export default config;
