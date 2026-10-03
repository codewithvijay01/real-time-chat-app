import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <main className="not-found"><div className="brand-mark"><MessageCircle size={20} /></div><span className="eyebrow">A WRONG TURN</span><strong>404</strong><h1>This room doesn’t exist.</h1><Link className="primary-button" to="/"><ArrowLeft size={17} /> Back to Commonroom</Link></main>
}