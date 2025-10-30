import React from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

type Attempts = Array<Record<string, any>>

export function ScoreChart({ attempts }: { attempts: Attempts }) {
  // Prepare data: scores over time (sorted by finishedAt or id)
  const sorted = attempts.slice().sort((a, b) => {
    const ta = a.finishedAt || a.id
    const tb = b.finishedAt || b.id
    return (new Date(ta).getTime() || Number(ta)) - (new Date(tb).getTime() || Number(tb))
  })

  const labels = sorted.map((a) => {
    const ts = a.finishedAt || a.id
    const d = new Date(ts)
    return isNaN(d.getTime()) ? String(ts) : d.toLocaleString()
  })

  const scores = sorted.map((a) => Number(a.score) || 0)

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Rezultat (score)',
        data: scores,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.2,
      },
    ],
  }

  // Distribution bar chart
  const buckets: Record<number, number> = {}
  for (const s of scores) {
    const bucket = Math.min(100, Math.round(Number(s) / 10) * 10)
    buckets[bucket] = (buckets[bucket] || 0) + 1
  }

  const barLabels = Object.keys(buckets).sort((a, b) => Number(a) - Number(b))
  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Število poskusov v razredu rezultatov',
        data: barLabels.map((k) => buckets[Number(k)] || 0),
        backgroundColor: 'rgba(54,162,235,0.6)',
      },
    ],
  }

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <h3>Rezultati skozi čas</h3>
        <Line data={lineData} />
      </div>
      <div className="chart-card">
        <h3>Distribucija rezultatov</h3>
        <Bar data={barData} />
      </div>
    </div>
  )
}

export default ScoreChart
