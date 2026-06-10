// Dependency-free PDF export.
//
// Approach: clone the on-screen container (identified by `elementId`) into a
// fresh popup window, copy over every <style>/<link rel=stylesheet> from the
// current document so Tailwind + app styles render identically, then call
// window.print(). The browser's print dialog lets the user "Save as PDF".
// Because we clone the live node, the printed output reflects the CURRENT
// filtered/selected state exactly as shown — no separate render path to drift.

export function printElement(elementId: string, title: string): void {
  const source = document.getElementById(elementId)
  if (!source) {
    // Fallback: print the whole page rather than failing silently.
    window.print()
    return
  }

  const win = window.open('', '_blank', 'width=1024,height=768')
  if (!win) {
    // Popup blocked — fall back to printing the current page.
    window.print()
    return
  }

  // Collect all style sources from the current document.
  const headStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => node.outerHTML)
    .join('\n')

  const doc = win.document
  doc.open()
  doc.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
${headStyles}
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  .print-wrap { padding: 24px; }
  .print-title { font: 600 18px/1.3 system-ui, sans-serif; color: #1f2123; margin: 0 0 16px; }
  /* Keep cards from splitting across pages where possible. */
  .print-wrap [class*="rounded-xl"], .print-wrap [class*="rounded-lg"] {
    break-inside: avoid;
  }
  @page { margin: 14mm; }
  @media print {
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="print-wrap">
  <h1 class="print-title">${escapeHtml(title)}</h1>
  <div id="print-body"></div>
</div>
</body>
</html>`)
  doc.close()

  // Deep-clone the live node so current state (filters, selection, chart) prints.
  const clone = source.cloneNode(true) as HTMLElement
  // Strip interactive-only chrome marked no-print (buttons, toggles).
  clone.querySelectorAll('.no-print').forEach((n) => n.remove())

  const mount = doc.getElementById('print-body')
  if (mount) mount.appendChild(clone)

  // Give styles + any async layout a tick, then print and close.
  const trigger = () => {
    win.focus()
    win.print()
    // Close shortly after the dialog returns; left open if user cancels fast.
    setTimeout(() => win.close(), 300)
  }

  if (doc.readyState === 'complete') {
    setTimeout(trigger, 250)
  } else {
    win.addEventListener('load', () => setTimeout(trigger, 250))
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
