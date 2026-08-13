import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import i18next from 'eslint-plugin-i18next'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Een parameter die bewust (nog) niet gebruikt wordt, blijft leesbaar als hij zijn naam
      // houdt: `_state` documenteert waar een resolver op zal gaan sturen. De onderstreping is
      // het signaal "met opzet ongebruikt".
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Named exports, geen default exports (frontend/CLAUDE.md).
    // Alleen op src/: config-bestanden zoals vite.config.ts moeten juist
    // wel default exporteren.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message:
            'Geen default exports — gebruik een named export (export function Foo). ' +
            'Zo blijft de naam bij import gelijk en is de component vindbaar.',
        },
      ],
    },
  },
  {
    // Bewaakt Fase 2/3 van de i18n-migratie: geen nieuwe hardcoded UI-tekst in
    // JSX. Alleen op echte componenten/routes, niet op tests (die mogen
    // literale mock-tekst gebruiken).
    // PlayerHeader.tsx: nog ongebruikt component (zie docs/i18n-inventory.md
    // §1), wordt bij de eigen migratietaak meegenomen — niet hier.
    // src/routes/dev/**: interne design-review-routes (bv. GlassPanelDemo),
    // nooit aan een speler getoond — geen vertaalverplichting voor content
    // die het spel zelf nooit bereikt.
    files: ['src/components/**/*.tsx', 'src/routes/**/*.tsx'],
    ignores: ['**/*.test.tsx', 'src/components/ui/PlayerHeader.tsx', 'src/routes/dev/**/*.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': 'error',
    },
  },
])
