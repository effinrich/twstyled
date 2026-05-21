import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    radix: 'src/radix/index.ts',
    base: 'src/base/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'tw-styled',
    'tailwind-merge',
    /@radix-ui\/.*/,
    /@base-ui-components\/.*/,
  ],
  jsx: 'react-jsx',
})
