'use client'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor, Essentials, Paragraph, Heading, Bold, Italic, Underline,
  List, Link, Autoformat, BlockQuote, Table, TableToolbar,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import Box from '@mui/material/Box'

// CKEditor 5 (open-source GPL build) for long-form batch fields. Read-only
// mode uses the same editor with the toolbar hidden, so stored HTML is always
// rendered through CKEditor's own model (never injected raw into the page).
// Loaded with next/dynamic (ssr: false) from RichTextField — CKEditor needs window.

const CONFIG = {
  licenseKey: 'GPL',
  plugins: [Essentials, Paragraph, Heading, Bold, Italic, Underline, List, Link, Autoformat, BlockQuote, Table, TableToolbar],
  toolbar: ['heading', '|', 'bold', 'italic', 'underline', '|', 'bulletedList', 'numberedList', 'blockQuote', '|', 'link', 'insertTable', '|', 'undo', 'redo'],
  table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
}

export default function RichTextEditor({
  value,
  onChange,
  readOnly,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  readOnly: boolean
  placeholder?: string
}) {
  return (
    <Box
      sx={{
        '--ck-font-face': 'inherit',
        '--ck-color-focus-border': (t) => t.palette.primary.main,
        '--ck-border-radius': '8px',
        '& .ck-editor__editable': { minHeight: 140, fontSize: '0.875rem', lineHeight: 1.6 },
        ...(readOnly && {
          '& .ck-editor__top': { display: 'none' },
          '& .ck.ck-editor__editable.ck-read-only': {
            border: 'none', boxShadow: 'none', bgcolor: 'transparent', px: 0, minHeight: 0,
          },
        }),
      }}
    >
      <CKEditor
        editor={ClassicEditor}
        config={{ ...CONFIG, placeholder, initialData: value }}
        disabled={readOnly}
        onChange={(_, editor) => onChange(editor.getData())}
      />
    </Box>
  )
}
