import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmtEGP } from './analytics'

// ---- CSV ----
export function exportCSV(rows, filename = 'export.csv') {
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, filename)
}

// ---- PDF report ----
// sections: [{ title, columns:[...], rows:[[...]] }]
export function exportPDF({ title = 'Diva Essentials — Report', subtitle = '', kpis = [], sections = [] }) {
  const doc = new jsPDF()
  const gold = [164, 126, 44]
  const ink = [21, 18, 13]

  doc.setFontSize(20); doc.setTextColor(...ink)
  doc.text(title, 14, 20)
  if (subtitle) { doc.setFontSize(10); doc.setTextColor(120); doc.text(subtitle, 14, 27) }
  doc.setDrawColor(...gold); doc.setLineWidth(0.6); doc.line(14, 31, 196, 31)

  let y = 40
  if (kpis.length) {
    doc.setFontSize(11); doc.setTextColor(...ink)
    const perRow = 2
    kpis.forEach((k, i) => {
      const col = i % perRow, row = Math.floor(i / perRow)
      const x = 14 + col * 95
      const yy = y + row * 16
      doc.setTextColor(120); doc.setFontSize(9); doc.text(k.label.toUpperCase(), x, yy)
      doc.setTextColor(...ink); doc.setFontSize(13); doc.text(String(k.value), x, yy + 6)
    })
    y += Math.ceil(kpis.length / perRow) * 16 + 6
  }

  sections.forEach(sec => {
    if (sec.title) { doc.setFontSize(13); doc.setTextColor(...ink); doc.text(sec.title, 14, y); y += 4 }
    autoTable(doc, {
      startY: y + 2,
      head: [sec.columns],
      body: sec.rows,
      theme: 'striped',
      headStyles: { fillColor: ink, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 12
    if (y > 260) { doc.addPage(); y = 20 }
  })

  doc.setFontSize(8); doc.setTextColor(150)
  doc.text(`Generated ${new Date().toLocaleString()} · Diva Essentials`, 14, 290)
  doc.save(title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pdf')
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export { fmtEGP }
