'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Temporary stand-in while each screen is migrated to MUI in Fase 2. Renders the
// screen name so the shell (topbar + sidebar + routing) can be validated first.
export default function PlaceholderScreen({ name }: { name: string }) {
  return (
    <Box sx={{ p: 4 }}>
      <Card sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>{name}</Typography>
        <Chip label="MUI — in progress" color="secondary" size="small" />
      </Card>
    </Box>
  )
}
