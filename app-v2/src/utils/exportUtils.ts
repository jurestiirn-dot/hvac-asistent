// Export utilities for PDF, DOCX, and CSV with Slovenian language support
import jsPDF from 'jspdf'
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

/**
 * Export data to CSV with Slovenian formatting
 */
export function exportToCSV(filename: string, data: string[][]) {
  const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Export to DOCX with Slovenian content and proper formatting
 */
export async function exportToDOCX(filename: string, content: {
  title: string
  subtitle?: string
  sections: Array<{
    heading: string
    paragraphs?: string[]
    table?: {
      headers: string[]
      rows: string[][]
    }
  }>
}) {
  const children: any[] = [
    new Paragraph({
      text: content.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  ]

  if (content.subtitle) {
    children.push(
      new Paragraph({
        text: content.subtitle,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )
  }

  content.sections.forEach(section => {
    children.push(
      new Paragraph({
        text: section.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      })
    )

    if (section.paragraphs) {
      section.paragraphs.forEach(para => {
        children.push(
          new Paragraph({
            text: para,
            spacing: { after: 100 }
          })
        )
      })
    }

    if (section.table) {
      children.push(
        new Paragraph({ text: '', spacing: { after: 200 } })
      )
      
      // Headers
      children.push(
        new Paragraph({
          children: [new TextRun({ text: section.table.headers.join(' | '), bold: true })],
          spacing: { after: 100 }
        })
      )
      
      // Rows
      section.table.rows.forEach(row => {
        children.push(
          new Paragraph({
            text: row.join(' | '),
            spacing: { after: 50 }
          })
        )
      })
    }
  })

  children.push(
    new Paragraph({
      text: `\nDokument ustvarjen: ${new Date().toLocaleString('sl-SI')}`,
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER
    })
  )

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  })

  const blob = await (await import('docx')).Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}

/**
 * Export to PDF with Slovenian content and proper formatting
 */
export function exportToPDF(filename: string, content: {
  title: string
  subtitle?: string
  sections: Array<{
    heading: string
    paragraphs?: string[]
    table?: {
      headers: string[]
      rows: string[][]
    }
  }>
}) {
  const doc = new jsPDF()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(content.title, 105, yPos, { align: 'center' })
  yPos += 15

  // Subtitle
  if (content.subtitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(content.subtitle, 105, yPos, { align: 'center' })
    yPos += 15
  }

  // Sections
  content.sections.forEach(section => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    // Section heading
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(section.heading, 20, yPos)
    yPos += 10

    // Paragraphs
    if (section.paragraphs) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      section.paragraphs.forEach(para => {
        const lines = doc.splitTextToSize(para, 170)
        lines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage()
            yPos = 20
          }
          doc.text(line, 20, yPos)
          yPos += 6
        })
        yPos += 3
      })
    }

    // Table
    if (section.table) {
      yPos += 5
      
      // Headers
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      const colWidth = 170 / section.table.headers.length
      section.table.headers.forEach((header, i) => {
        doc.text(header, 20 + i * colWidth, yPos)
      })
      yPos += 7

      // Rows
      doc.setFont('helvetica', 'normal')
      section.table.rows.forEach(row => {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
        row.forEach((cell, i) => {
          const cellLines = doc.splitTextToSize(cell, colWidth - 2)
          doc.text(cellLines[0] || '', 20 + i * colWidth, yPos)
        })
        yPos += 7
      })
      yPos += 5
    }

    yPos += 5
  })

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Dokument ustvarjen: ${new Date().toLocaleString('sl-SI')}`,
    105,
    yPos > 280 ? 290 : yPos + 10,
    { align: 'center' }
  )

  doc.save(`${filename}.pdf`)
}
