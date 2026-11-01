import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

// Flat config (ESLint 9 + eslint-config-next 16). Same rule choices as the previous .eslintrc.json.
export default defineConfig([
  ...nextVitals,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'off',
      // New React Compiler checks from eslint-plugin-react-hooks 7. They flag existing, working patterns
      // (e.g. setState inside an effect), so they stay visible as warnings instead of failing the lint.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts', 'data/**', 'scripts/**', 'supabase-functions/**']),
]);
