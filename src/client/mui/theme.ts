'use client'

import { createTheme } from '@mui/material/styles'

// IRIS / Digital Reports design tokens, mapped from app/globals.css @theme so the
// MUI v2 app reads as the same product as the Tailwind v0/v1 versions — not
// "Material out of the box". Keep these in sync with the CSS tokens.
const tokens = {
  header: '#4c4d57',
  sidebar: '#5c5f62',
  page: '#f6f6f6',
  card: '#ffffff',

  primary: '#46aa9f',
  primary700: '#008d84',
  primarySoft: '#e2f0ed',

  ink: '#4c4d57',
  muted: '#8d9094',
  faint: '#c3c5c7',
  line: '#ececec',

  up: '#1aa367',
  down: '#c12907',
  warning: '#f19909',

  irisBlue: '#6ca8c9',
  irisBlue700: '#5b97b8',
  irisTopbar: '#41414a',
} as const

export const chartPalette = ['#46aa9f', '#6bb7b0', '#f19909', '#f89984', '#a2a6ac']

// Exposed so components can reach IRIS-specific colors that don't map onto a
// standard MUI palette slot (sidebar/header chrome, iris blue accents).
export const iris = tokens

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: tokens.primary, dark: tokens.primary700, contrastText: '#ffffff' },
    secondary: { main: tokens.irisBlue, dark: tokens.irisBlue700, contrastText: '#ffffff' },
    success: { main: tokens.up },
    error: { main: tokens.down },
    warning: { main: tokens.warning },
    background: { default: tokens.page, paper: tokens.card },
    text: { primary: tokens.ink, secondary: tokens.muted, disabled: tokens.faint },
    divider: tokens.line,
  },
  shape: { borderRadius: 10 },
  typography: {
    // Matches the Roboto next/font variable wired in app/layout.tsx.
    fontFamily: 'var(--font-roboto), Roboto, ui-sans-serif, system-ui, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        // The product uses soft cards, not Material elevation shadows.
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.02)',
          border: `1px solid ${tokens.line}`,
        },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
})

export default theme
