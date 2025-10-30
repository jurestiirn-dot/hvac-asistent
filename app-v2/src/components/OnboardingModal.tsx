import React from 'react'
import { motion } from 'framer-motion'

export default function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(2,6,23,0.6),rgba(2,6,23,0.85))'}}/>
      <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} transition={{duration:0.35}} className="card" style={{maxWidth:720,width:'92%'}}>
        <h3 style={{marginTop:0}}>Dobrodošli v HVAC Asistent</h3>
        <p>Ta aplikacija vsebuje učne lekcije, kvize in nadzorne plošče z vizualizacijami. Priporočamo, da začnete z Lekcije → Filtracija.</p>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          <button className="btn-ghost" onClick={onClose}>Zapri</button>
          <button className="btn-primary" onClick={onClose}>Začni</button>
        </div>
      </motion.div>
    </div>
  )
}
