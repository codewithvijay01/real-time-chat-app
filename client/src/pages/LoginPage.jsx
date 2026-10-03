import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ identity: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try { await login(values); navigate('/', { replace: true }) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setSubmitting(false) }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <div className="auth-aside-top"><div className="brand-mark"><MessageCircle size={19} /></div><span className="brand-word">commonroom<span>.</span></span><span className="auth-edition">A LITTLE MORE PRESENT</span></div>
        <div className="auth-story"><span className="story-kicker">MAKE SPACE FOR</span><h1>Good talks.<br /><em>Real people.</em></h1><p>A quieter place to keep up with the people who matter.</p><div className="story-decoration"><span /><span /><span /></div></div>
        <div className="auth-aside-bottom"><ShieldCheck size={16} /><span>Your conversations stay yours.</span></div>
        <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
      </section>
      <section className="auth-main">
        <div className="auth-top-actions"><span>Already part of the room?</span><ThemeToggle /></div>
        <div className="auth-form-wrap">
          <span className="eyebrow">WELCOME BACK</span><h2>Pick up where<br />you left off.</h2><p className="auth-subtitle">Sign in to your Commonroom account.</p>
          <form onSubmit={submit} className="form-stack">
            <label className="field-label">Email or username<input autoComplete="username" autoFocus required value={values.identity} onChange={(event) => setValues({ ...values, identity: event.target.value })} placeholder="you@example.com" /></label>
            <label className="field-label">Password<input type="password" autoComplete="current-password" required minLength={8} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="Your password" /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}<ArrowRight size={17} /></button>
          </form>
          <div className="auth-switch">New around here? <Link to="/register">Create an account</Link></div>
        </div>
        <div className="auth-legal">© {new Date().getFullYear()} Commonroom <span>·</span> Made for good conversations</div>
      </section>
    </main>
  )
}