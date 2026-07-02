import React from 'react'
import type { Preview } from '@storybook/react'

// The app's real Tailwind v4 stylesheet — the @theme block here defines every
// design token (bg-primary, text-ink, bg-sidebar, shadow-card, …). Storybook
// runs it through Next's PostCSS pipeline (@tailwindcss/postcss), so utilities
// and tokens resolve exactly as in-product.
import '../app/globals.css'
import './preview.css'

import { SessionProvider, type SessionUser } from '../src/client/Session'
import { CompanyStateProvider } from '../src/client/CompanyState'

// Fake logged-in user so components calling useSession() (AppHeader, …) render.
const MOCK_USER: SessionUser = {
  id: 'demo-user',
  name: 'Gabriel Oliveira',
  email: 'gabriel.oliveira@netzsch.com',
  isAdmin: true,
  company: { id: 'demo-company', name: 'NETZSCH Equipamentos de Moagem' },
}

const preview: Preview = {
  // Autodocs on every story: a docs page with a live preview + source code.
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'page',
      values: [
        { name: 'page', value: '#f6f6f6' },
        { name: 'card', value: '#ffffff' },
        { name: 'header', value: '#4c4d57' },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      // Clean, grouped sidebar ordering.
      storySort: {
        order: [
          'Overview',
          ['Introduction', 'Getting Started', 'About'],
          'Charts',
          'Metrics',
          'Rankings & Live',
          'Availability',
          'Filters & Inputs',
          'Layout',
          'Foundations',
        ],
      },
    },
  },
  decorators: [
    // Every story gets the app's providers (session + per-company state store)
    // and the page font/background, so nothing renders unstyled or crashes on a
    // missing context.
    (Story) => (
      <SessionProvider user={MOCK_USER}>
        <CompanyStateProvider initial={{}}>
          <div className="sb-dr-root">
            <Story />
          </div>
        </CompanyStateProvider>
      </SessionProvider>
    ),
  ],
}

export default preview
