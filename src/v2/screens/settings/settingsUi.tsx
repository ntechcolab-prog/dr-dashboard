'use client'

import type { ReactNode } from 'react'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Local MUI mirrors of the Tailwind FormSection/Field helpers. Duplicated inside
// this folder (per the v2 isolation rule) rather than imported from the shared
// Tailwind FormControls, so parallel agents never collide.

export function FormSectionV2({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card sx={{ p: 3 }}>
      <Box
        sx={{
          mb: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{ fontWeight: 600, letterSpacing: '0.06em', color: 'text.secondary' }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Card>
  )
}

export function FieldV2({
  label,
  children,
  sx,
}: {
  label: string
  children: ReactNode
  sx?: object
}) {
  return (
    <Box sx={sx}>
      <Typography
        variant="body2"
        component="label"
        sx={{ mb: 0.75, display: 'block', color: 'text.secondary' }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )
}
