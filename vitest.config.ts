import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Covers both the Next app and the shared edge-function code. The
    // supabase/functions entrypoints import Deno globals and are not testable
    // here, which is part of why the compliance-critical decision logic was
    // moved into _shared/sms.ts as pure functions.
    include: [
      'src/**/*.test.ts',
      'supabase/functions/_shared/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
