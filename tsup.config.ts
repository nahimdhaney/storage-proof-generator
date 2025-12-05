import { defineConfig } from 'tsup';

export default defineConfig([
  // Core library (browser + Node compatible)
  {
    entry: ['src/core/index.ts'],
    outDir: 'dist/core',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    splitting: false,
  },
  // Node-specific utilities
  {
    entry: ['src/node/index.ts'],
    outDir: 'dist/node',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    target: 'node20',
    platform: 'node',
    splitting: false,
  },
  // CLI
  {
    entry: ['src/node/cli.ts'],
    outDir: 'dist/node',
    format: ['cjs'],
    sourcemap: true,
    target: 'node20',
    platform: 'node',
    banner: {
      js: '#!/usr/bin/env node',
    },
    splitting: false,
  },
]);
