import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import {defineConfig} from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/app/**/{loading,error,not-found,global-error}.tsx',
        'src/app/**/{sitemap,robots,manifest}.ts',
        'src/components/ui/**'
      ],
      thresholds: {
        statements: 55,
        branches: 48,
        functions: 54,
        lines: 55
      }
    }
  }
})
