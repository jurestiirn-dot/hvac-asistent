import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function Certificate({ fullName, code, courseTitle = 'HVAC Asistent – Celotna Študija' }: { fullName: string; code: string; courseTitle?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    if (!ref.current) return
    const el = ref.current
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('landscape', 'pt', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth
    const imgHeight = canvas.height * (imgWidth / canvas.width)

    pdf.addImage(imgData, 'PNG', 0, (pageHeight - imgHeight) / 2, imgWidth, imgHeight)
    pdf.save(`Certifikat-${fullName.replace(/\s+/g,'_')}.pdf`)
  }

  return (
    <div>
      <div ref={ref} style={{ width: '1000px', aspectRatio: '1.414', background:'#fff', color:'#1f2937', padding:'40px', position:'relative', border:'8px double #0f172a' }}>
        <div style={{position:'absolute', inset:20, border:'4px double #6b7280', pointerEvents:'none'}} />
        <div style={{textAlign:'center', marginTop:40}}>
          <div style={{fontSize:18, letterSpacing:6, color:'#6b7280'}}>CERTIFICATE OF COMPLETION</div>
          <h1 style={{fontSize:48, margin:'10px 0 0 0', letterSpacing:2}}>Akademski certifikat</h1>
          <div style={{fontSize:16, color:'#6b7280', marginTop:4}}>za uspešno opravljeno celotno študijo</div>
        </div>
        <div style={{textAlign:'center', marginTop:60}}>
          <div style={{fontSize:16, color:'#6b7280'}}>Podeljuje se</div>
          <div style={{fontSize:40, fontWeight:800, marginTop:10}}>{fullName}</div>
          <div style={{fontSize:16, color:'#6b7280', marginTop:8}}>za uspešno zaključeno usposabljanje</div>
          <div style={{fontSize:22, fontStyle:'italic', marginTop:8}}>{courseTitle}</div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', position:'absolute', left:40, right:40, bottom:40}}>
          <div style={{textAlign:'center'}}>
            <div style={{height:1, width:260, background:'#1f2937', marginBottom:6}}></div>
            <div style={{fontSize:12}}>Akademski vodja programa</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:12, color:'#6b7280'}}>Koda certifikata</div>
            <div style={{fontSize:16, fontWeight:700}}>{code}</div>
            <div style={{fontSize:12, color:'#6b7280', marginTop:4}}>{new Date().toLocaleDateString()}</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{height:1, width:260, background:'#1f2937', marginBottom:6}}></div>
            <div style={{fontSize:12}}>Direktor izobraževanja</div>
          </div>
        </div>
      </div>
      <div style={{marginTop:12}}>
        <button className="button" onClick={downloadPDF}>Prenesi PDF</button>
      </div>
    </div>
  )
}
