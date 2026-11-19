import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * 배포 경로(base)
 * - GitHub Pages 프로젝트 사이트: https://<owner>.github.io/raffine-voca-app/ → base 필요
 * - 루트 도메인 호스팅(Cloudflare Pages · Vercel 등): `VITE_BASE=/` 로 빌드하면 루트로 동작
 * - 로컬 개발(npm run dev)은 항상 '/'
 * (GitHub Actions 배포에서는 저장소 이름을 읽어 VITE_BASE 를 자동으로 넣습니다 — deploy.yml 참고)
 */
const PAGES_BASE = process.env.VITE_BASE ?? '/rafine-class/';

export default defineConfig(({ mode }) => {
  const base = process.env.VITE_BASE ?? (mode === 'production' ? PAGES_BASE : '/');

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: '라피네 클래스 (Rafine Class)',
          short_name: '라피네 클래스',
          description: '라피네코딩 두정점 학생관리·학습·학부모 리포트 통합 앱 — 영어(5단계)·코딩·24주 커리큘럼',
          lang: 'ko',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f8fafc',
          theme_color: '#4f46e5',
          icons: [
            { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
            {
              src: `${base}icons/icon-maskable-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/\/r\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: { cacheName: 'pages', networkTimeoutSeconds: 4 },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    server: { port: 5173, host: true },
    preview: { port: 4173, host: true },
  };
});
