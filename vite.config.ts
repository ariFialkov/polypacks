import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds are portable: every path is relative ('./'), and each page is a single self-contained HTML
// file with its scripts, styles and fonts inlined. That way the game runs from any folder on any host,
// including platforms that serve it from a sub-path or inside a sandboxed iframe (where separate
// module script files are blocked). `vite build` makes the game; `vite build --mode cards` adds the
// card index into dist/cards/ without clearing the game.
export default defineConfig(({ mode }) => {
  const cards = mode === 'cards';
  return {
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: !cards,
      rollupOptions: { input: cards ? 'cards/index.html' : 'index.html' },
    },
    plugins: [
      react(),
      viteSingleFile({ removeViteModuleLoader: true }),
      !cards &&
        VitePWA({
          registerType: 'autoUpdate',
          // .json rather than .webmanifest: some hosts only accept common file types
          manifestFilename: 'manifest.json',
          includeAssets: ['icon.svg', 'apple-touch-icon.png'],
          manifest: {
            name: 'Polypacks',
            short_name: 'Polypacks',
            description: 'Open packs. Build the deck. Outplay the table.',
            theme_color: '#0b0b12',
            background_color: '#0b0b12',
            display: 'standalone',
            orientation: 'portrait',
            start_url: './',
            scope: './',
            icons: [
              { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{html,svg,png,json}'],
            maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          },
        }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
}) as any;
