import React from 'react'
import Lottie from 'lottie-react'

export default function LottieHero({ style }: { style?: React.CSSProperties }) {
  const [data, setData] = React.useState<any | null>(null)

  React.useEffect(() => {
    let mounted = true
    // Try to fetch the JSON file at runtime (no static import) so missing file won't break build
    fetch('/src/content/animations/hvac-hero.json')
      .then(r => r.ok ? r.json() : Promise.reject('no-file'))
      .then((json) => { if (mounted) setData(json) })
      .catch(() => { /* animation missing - we'll show fallback */ })
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}>
      <div style={{ width: 96, height: 96 }}>
        {data ? (
          <Lottie animationData={data} loop={true} />
        ) : (
          <div style={{width:96,height:96,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'linear-gradient(135deg,var(--accent),var(--accent-2))',color:'white',fontWeight:700}}>HV</div>
        )}
      </div>
      <div>
        <h3 style={{margin:0,color:'white'}}>HVAC Asistent</h3>
        <div style={{fontSize:12,color:'var(--muted)'}}>Učni asistent z vizualizacijami</div>
      </div>
    </div>
  )
}
