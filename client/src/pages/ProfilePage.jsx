import { ArrowLeft, Camera, Check, LogOut, Save, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import api, { getErrorMessage } from '../services/api.js'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [name, setName] = useState(user.name || '')
  const [bio, setBio] = useState(user.bio || '')
  const [picture, setPicture] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingAvatar, setRemovingAvatar] = useState(false)
  const [error, setError] = useState('')

  const save = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    const form = new FormData()
    form.append('name', name)
    form.append('bio', bio)
    if (picture) form.append('profilePicture', picture)
    try {
      const { data } = await api.put('/users/profile', form)
      updateUser(data.data.user)
      setPicture(null)
      setPreview('')
      notify('Profile updated')
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setSaving(false) }
  }

  const removePhoto = async () => {
    setRemovingAvatar(true)
    setError('')
    try {
      const { data } = await api.delete('/users/profile/avatar')
      updateUser(data.data.user)
      setPicture(null)
      setPreview('')
      notify('Profile photo removed')
    } catch (requestError) { setError(getErrorMessage(requestError)) } finally { setRemovingAvatar(false) }
  }

  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }

  return (
    <main className="profile-page">
      <header className="profile-topbar"><Link to="/" className="back-link"><ArrowLeft size={17} /> Back to messages</Link><ThemeToggle /></header>
      <section className="profile-content">
        <div className="profile-heading"><span className="eyebrow">YOUR CORNER</span><h1>Profile & preferences</h1><p>Make your space feel like yours.</p></div>
        <form className="profile-form" onSubmit={save}>
          <div className="profile-avatar-row">
            <button className="profile-avatar-button" type="button" onClick={() => fileRef.current?.click()} aria-label="Change profile picture">
              {preview ? <span className="avatar avatar-xxl"><img src={preview} alt="Profile preview" /></span> : <Avatar user={user} size="xxl" />}
              <span className="camera-chip"><Camera size={16} /></span>
            </button>
            <div><strong>Your photo</strong><p>Show the room who they’re talking to.</p><button type="button" className="text-button" onClick={() => fileRef.current?.click()}>Upload a new picture</button>{user.profilePicture && <button type="button" className="text-button remove-photo-button" onClick={removePhoto} disabled={removingAvatar}>{removingAvatar ? 'Removing...' : <><Trash2 size={12} /> Remove Photo</>}</button>}</div>
            <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              if (!file.type.startsWith('image/') || file.size > 4 * 1024 * 1024) return setError('Choose an image smaller than 4 MB.')
              setPicture(file)
              setPreview(URL.createObjectURL(file))
              setError('')
            }} />
          </div>
          <div className="profile-fields">
            <label className="field-label">Display name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="field-label">Username<input value={`@${user.username}`} readOnly /></label>
            <label className="field-label">Email address<input value={user.email} readOnly /></label>
            <label className="field-label">A little about you <span className="field-count">{bio.length}/180</span><textarea rows="4" maxLength={180} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A few words, if you like." /></label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="profile-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}{!saving && <Save size={16} />}</button><button className="secondary-button" type="button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
        </form>
        <section className="preferences-row"><div><span className="eyebrow">APPEARANCE</span><strong>Choose your look</strong><p>Your choice stays on this device.</p></div><ThemeToggle /></section>
        <div className="profile-account-note"><Check size={15} /> Signed in as <strong>@{user.username}</strong></div>
      </section>
    </main>
  )
}