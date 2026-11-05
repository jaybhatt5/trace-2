import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Custom Vite plugin to capture visitor logs
const terminalLoggerPlugin = (): any => ({
  name: 'terminal-logger',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: () => void) => {
      if (req.url === '/__log_visitor' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            console.log(`\n============== 🚨 TUNNEL VISITOR CONNECTED 🚨 ==============`);
            console.log(`[Time]       : ${data.time}`);
            console.log(`[URL Opened] : ${data.url}`);
            console.log(`[Device/OS]  : ${data.device}`);
            console.log(`============================================================\n`);
          } catch (e) {
            // Silently catch malformed JSON data packets
          }
          res.end('ok');
        });
        return;
      }
      next();
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), terminalLoggerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      minify: 'esbuild' as const,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-motion': ['motion'],
          },
        },
      },
    },
    server: {
      // Allows dynamic subdomains and ngrok tunnel hosts to connect safely
      allowedHosts: [
        'moneybags-confused-exorcism.ngrok-free.dev',
        '.ngrok-free.dev',
        '.ngrok-free.app',
        '.trycloudflare.com',
      ],
      
      // Binds the server to all network interfaces so external traffic routes cleanly
      host: true,
      
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: [
          '**/data/**',
          '**/data/*',
          '**/*.log',
          '**/dist/**',
          '**/scripts/**',
          '**/.git/**',
          '**/.system_generated/**',
          '**/user-factchecks.json',
          (filePath: string) => {
            const norm = filePath.replace(/\\/g, '/');
            if (norm.includes('/src/data/')) return false; // keep src/data/mockData.ts for developer HMR
            if (norm.includes('/data/') || norm.endsWith('/data')) return true;
            if (norm.endsWith('.log')) return true;
            if (
              norm.includes('user-factchecks.json')
            ) {
              return true;
            }
            return false;
          },
        ],
      },
    },
  };
});
