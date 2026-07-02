'use client'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import UploadIcon from '@mui/icons-material/FileUploadOutlined'
import type { ProductData } from '@/src/data/batchForm'
import { SectionCard, withAlpha } from '../ui'

export default function ProductTab({ value, onChange }: { value: ProductData; onChange: (v: ProductData) => void }) {
  const set = <K extends keyof ProductData>(key: K, v: ProductData[K]) => onChange({ ...value, [key]: v })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SectionCard title="Information">
        <TextField
          fullWidth
          multiline
          minRows={4}
          value={value.details}
          onChange={(e) => set('details', e.target.value)}
          placeholder="Write product information here"
        />
      </SectionCard>

      <SectionCard title="Attachments">
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            gap: 1,
            py: 5,
            borderRadius: 2,
            border: '2px dashed',
            borderColor: (t) => withAlpha(t.palette.primary.main, 0.4),
            bgcolor: (t) => withAlpha(t.palette.primary.main, 0.06),
            color: 'primary.main',
            cursor: 'pointer',
          }}
        >
          <UploadIcon />
          <Typography variant="body2">Drag files here or click to upload</Typography>
        </Box>
      </SectionCard>
    </Box>
  )
}
