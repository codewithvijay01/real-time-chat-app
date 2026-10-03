import { assetUrl } from '../services/api.js'

export default function Avatar({ user, size = 'md', online = false, className = '' }) {
  const name = user?.name || user?.username || 'Guest'
  return (
    <span className={`avatar avatar-${size} ${className}`}>
      {user?.profilePicture ? <img src={assetUrl(user.profilePicture)} alt="" /> : <span>{name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>}
      {online && <i className="avatar-presence" aria-label="Online" />}
    </span>
  )
}