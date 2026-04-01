import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    // Polyfill global Buffer for swagger-parser's browser usage
    'global': 'globalThis',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpecLens',
      formats: ['es', 'iife'],
      fileName: (format) => `speclens.${format === 'es' ? 'js' : 'iife.js'}`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      // Polyfill Node.js built-ins used by swagger-parser's dependencies
      util: resolve(__dirname, 'src/shims/util.ts'),
      path: resolve(__dirname, 'src/shims/path.ts'),
      buffer: 'buffer/',
    },
  },
});
