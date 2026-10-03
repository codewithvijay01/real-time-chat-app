import { ArrowRight, ImagePlus, MessageCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle.jsx'
import Avatar from '../components/Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [picture, setPicture] = useState(null)
  const [preview, setPreview] = useState('')
  const [values, setValues] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (values.password !== values.confirmPassword) return setError('Passwords do not match.')
    setSubmitting(true)
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => form.append(key, value))
    if (picture) form.append('profilePicture', picture)
    try { await register(form); navigate('/', { replace: true }) } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setSubmitting(false) }
  }

  const choosePicture = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Choose an image file for your profile picture.')
    if (file.size > 4 * 1024 * 1024) return setError('Profile pictures must be smaller than 4 MB.')
    setError('')
    setPicture(file)
    setPreview(URL.createObjectURL(file))
  }

  return (
    <main className="auth-page auth-page-register">
      <section className="auth-aside">
        <div className="auth-aside-top"><div className="brand-mark"><MessageCircle size={19} /></div><span className="brand-word">commonroom<span>.</span></span><span className="auth-edition">A LITTLE MORE PRESENT</span></div>
        <div className="auth-story"><span className="story-kicker">GOOD THINGS START</span><h1>With a simple<br /><em>hello.</em></h1><p>Bring your favorite people a little closer, one message at a time.</p><div className="story-decoration"><span /><span /><span /></div></div>
        <div className="auth-aside-bottom"><span className="tiny-status" /><span>A small space for your inner circle.</span></div>
        <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
      </section>
      <section className="auth-main">
        <div className="auth-top-actions"><span>Already have an account? <Link to="/login">Sign in</Link></span><ThemeToggle /></div>
        <div className="auth-form-wrap register-form-wrap">
          <span className="eyebrow">MAKE YOURSELF AT HOME</span><h2>Join the<br />conversation.</h2><p className="auth-subtitle">A few details and you’re in.</p>
          <form onSubmit={submit} className="form-stack">
            <button className="picture-picker" type="button" onClick={() => fileRef.current?.click()}><span className="picture-preview">{preview ? <img src={preview} alt="Profile preview" /> : <ImagePlus size={18} />}</span><span><strong>Add a profile picture</strong><small>Optional · JPEG, PNG, WebP, GIF</small></span></button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => choosePicture(event.target.files?.[0])} />
            <div className="form-grid">
              <label className="field-label">Your name<input autoComplete="name" required minLength={2} maxLength={80} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="Alex Morgan" /></label>
              <label className="field-label">Username<input autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={values.username} onChange={(event) => setValues({ ...values, username: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="alexmorgan" /></label>
            </div>
            <label className="field-label">Email address<input type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></label>
            <div className="form-grid">
              <label className="field-label">Password<input type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 8 characters" /></label>
              <label className="field-label">Confirm password<input type="password" autoComplete="new-password" required value={values.confirmPassword} onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })} placeholder="Type it again" /></label>
            </div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Creating your account...' : 'Create account'}<ArrowRight size={17} /></button>
          </form>
        </div>
        <div className="auth-legal">© {new Date().getFullYear()} Commonroom <span>·</span> Made for good conversations</div>
      </section>
    </main>
  )
}