import { ArrowLeft, MessageCircle, Search, Settings2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import Avatar from './Avatar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { assetUrl } from '../services/api.js'

function shortTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  return date.toDateString() === today.toDateString() ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatSidebar({ conversations, selectedId, onSelect, query, setQuery, results, searchLoading, onStartChat, onlineIds, onClose, onProfile }) {
  const { user } = useAuth()
  const [focused, setFocused] = useState(false)
  const showSearch = focused || query.length > 0
  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [conversations])

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="brand-mark"><MessageCircle size={19} strokeWidth={2.3} /></div>
        <span className="brand-word">commonroom<span>.</span></span>
        <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close conversations"><X size={18} /></button>
      </header>

      <div className="sidebar-intro"><span className="eyebrow">YOUR SPACE</span><h1>Conversations</h1><span className="conversation-total">{conversations.length.toString().padStart(2, '0')}</span></div>

      <div className={`search-box ${showSearch ? 'is-focused' : ''}`}>
        <Search size={17} />
        <input aria-label="Search people" placeholder="Find someone..." value={query} onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 120)} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}
      </div>

      <div className="conversation-list" aria-label="Conversations">
        {showSearch ? (
          <>
            <div className="list-label">PEOPLE</div>
            {searchLoading ? <div className="list-message"><span className="spinner spinner-small" /> Searching</div> : results.length ? results.map((person) => (
              <button className="person-result" type="button" key={person._id} onMouseDown={(event) => event.preventDefault()} onClick={() => { onStartChat(person); setQuery('') }}>
                <Avatar user={person} online={onlineIds.has(person._id)} />
                <span className="result-copy"><strong>{person.name}</strong><small>@{person.username}</small></span>
                <ArrowLeft className="result-arrow" size={16} />
              </button>
            )) : <p className="list-message">{query.length < 2 ? 'Type at least 2 characters' : 'No people found'}</p>}
          </>
        ) : (
          <>
            <div className="list-label">RECENT</div>
            {sortedConversations.map((conversation) => {
              const other = conversation.participants.find((participant) => participant._id !== user._id) || conversation.participants[0]
              const preview = conversation.lastMessage?.text || 'Start a conversation'
              return (
                <button className={`conversation-row ${selectedId === conversation._id ? 'is-selected' : ''}`} type="button" key={conversation._id} onClick={() => onSelect(conversation)}>
                  <Avatar user={other} size="lg" online={onlineIds.has(other?._id)} />
                  <span className="conversation-copy">
                    <span className="conversation-topline"><strong>{other?.name || 'Unknown user'}</strong><time>{shortTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</time></span>
                    <span className="conversation-bottomline"><span>{preview}</span>{conversation.unreadCount > 0 && <b className="unread-badge">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</b>}</span>
                  </span>
                </button>
              )
            })}
            {!sortedConversations.length && <div className="empty-list"><div className="empty-list-icon"><MessageCircle size={20} /></div><strong>Your room is quiet</strong><span>Search for someone to say hello.</span></div>}
          </>
        )}
      </div>

      <footer className="sidebar-footer">
        <button type="button" className="current-user" onClick={onProfile}>
          <Avatar user={user} size="md" />
          <span><strong>{user?.name}</strong><small>View your profile</small></span>
          <Settings2 size={17} />
        </button>
        <span className="sidebar-footnote"><span className="tiny-status" /> Messages are just between you two</span>
      </footer>
      <div className="sidebar-watermark" style={{ backgroundImage: user?.profilePicture ? `url(${assetUrl(user.profilePicture)})` : undefined }} />
    </aside>
  )
}