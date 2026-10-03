import { ArrowDown, ArrowLeft, Check, CheckCheck, Ellipsis, LoaderCircle, Menu, MoreHorizontal, Send, Smile } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import ChatSidebar from '../components/ChatSidebar.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import api, { getErrorMessage } from '../services/api.js'
import { getSocket } from '../services/socket.js'

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatLastSeen(value) {
  if (!value) return 'Offline'
  const date = new Date(value)
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function DayDivider({ date }) {
  const value = new Date(date)
  const label = value.toDateString() === new Date().toDateString() ? 'TODAY' : value.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
  return <div className="day-divider"><span>{label}</span></div>
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const notify = useToast()
  const navigate = useNavigate()
  const token = localStorage.getItem('commonroom-token')
  const socket = useMemo(() => getSocket(token), [token])
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [sending, setSending] = useState(false)
  const [openMessageMenu, setOpenMessageMenu] = useState(null)
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineIds, setOnlineIds] = useState(new Set())
  const [lastSeenById, setLastSeenById] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const typingActive = useRef(false)
  const previousHeight = useRef(0)

  const refreshConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/conversations')
      setConversations(data.data.conversations)
    } catch (error) { notify(getErrorMessage(error), 'error') }
  }, [notify])

  useEffect(() => { refreshConversations() }, [refreshConversations])

  useEffect(() => {
    socket.connect()
    const onSnapshot = ({ onlineUserIds }) => setOnlineIds(new Set(onlineUserIds))
    const onOnline = ({ userId }) => setOnlineIds((current) => new Set(current).add(userId))
    const onOffline = ({ userId, lastSeen }) => {
      setOnlineIds((current) => { const next = new Set(current); next.delete(userId); return next })
      if (lastSeen) setLastSeenById((current) => ({ ...current, [userId]: lastSeen }))
    }
    const onReceive = ({ message }) => {
      setConversations((current) => current.map((item) => item._id === message.conversation ? { ...item, lastMessage: message, updatedAt: message.createdAt, unreadCount: item._id === selected?._id ? 0 : (item.unreadCount || 0) + 1 } : item))
      if (message.conversation === selected?._id) {
        setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message])
        api.put(`/messages/${message._id}/read`).then(() => socket.emit('message:read', { conversationId: message.conversation })).catch(() => {})
      }
    }
    const onSent = (message) => {
      setConversations((current) => current.map((item) => item._id === message.conversation ? { ...item, lastMessage: message, updatedAt: message.createdAt } : item))
      if (message.conversation === selected?._id) setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message])
    }
    const onTypingStart = ({ conversationId, userId }) => { if (conversationId === selected?._id && userId !== user._id) setTypingUsers((current) => new Set(current).add(userId)) }
    const onTypingStop = ({ conversationId, userId }) => { if (conversationId === selected?._id) setTypingUsers((current) => { const next = new Set(current); next.delete(userId); return next }) }
    const onRead = ({ conversationId, readerId }) => {
      if (readerId === user._id) return
      setMessages((current) => current.map((message) => message.conversation === conversationId && message.sender?._id === user._id ? { ...message, read: true } : message))
    }
    const onDeleted = ({ messageId, conversationId, scope }) => {
      setMessages((current) => current.filter((message) => message._id !== messageId))
      setOpenMessageMenu(null)
      if (scope !== 'me' && conversationId !== selected?._id) refreshConversations()
    }
    const onUnread = () => refreshConversations()
    socket.on('presence:snapshot', onSnapshot)
    socket.on('user:online', onOnline)
    socket.on('user:offline', onOffline)
    socket.on('message:receive', onReceive)
    socket.on('message:sent', onSent)
    socket.on('typing:start', onTypingStart)
    socket.on('typing:stop', onTypingStop)
    socket.on('message:read', onRead)
    socket.on('message:deleted', onDeleted)
    socket.on('unread:update', onUnread)
    return () => {
      socket.off('presence:snapshot', onSnapshot)
      socket.off('user:online', onOnline)
      socket.off('user:offline', onOffline)
      socket.off('message:receive', onReceive)
      socket.off('message:sent', onSent)
      socket.off('typing:start', onTypingStart)
      socket.off('typing:stop', onTypingStop)
      socket.off('message:read', onRead)
      socket.off('message:deleted', onDeleted)
      socket.off('unread:update', onUnread)
      socket.disconnect()
    }
  }, [socket, user._id, selected?._id, refreshConversations])

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) { setResults([]); return }
    let active = true
    setSearchLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await api.get('/users/search', { params: { q: query.trim() } })
        if (active) setResults(data.data.users)
      } catch (error) { if (active) notify(getErrorMessage(error), 'error') } finally { if (active) setSearchLoading(false) }
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query, notify])

  const loadMessages = useCallback(async (conversation, preserveScroll = false) => {
    setMessagesLoading(true)
    setMessages([])
    setHasMore(false)
    try {
      const { data } = await api.get(`/messages/${conversation._id}`)
      const page = data.data
      setMessages(page.messages)
      setHasMore(page.hasMore)
      if (preserveScroll) previousHeight.current = scrollRef.current?.scrollHeight || 0
      const unreadMessages = page.messages.filter((message) => message.receiver?._id === user._id && !message.read)
      await Promise.all(unreadMessages.map((message) => api.put(`/messages/${message._id}/read`).catch(() => null)))
      if (unreadMessages.length) socket.emit('message:read', { conversationId: conversation._id })
      setConversations((current) => current.map((item) => item._id === conversation._id ? { ...item, unreadCount: 0 } : item))
    } catch (error) { notify(getErrorMessage(error), 'error') } finally { setMessagesLoading(false) }
  }, [notify, socket, user._id])

  const selectConversation = (conversation) => {
    if (selected?._id && selected._id !== conversation._id) socket.emit('conversation:leave', selected._id)
    setSelected(conversation)
    setSidebarOpen(false)
  }

  useEffect(() => {
    if (!selected) return
    socket.emit('conversation:join', selected._id)
    setTypingUsers(new Set())
    loadMessages(selected)
    return () => socket.emit('conversation:leave', selected._id)
  }, [selected?._id, socket, loadMessages])

  useEffect(() => {
    if (!messagesLoading && !olderLoading) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, messagesLoading, olderLoading])

  useEffect(() => {
    if (olderLoading && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight - previousHeight.current
  }, [messages, olderLoading])

  const otherUser = selected?.participants.find((participant) => participant._id !== user._id) || selected?.participants[0]
  const isOnline = otherUser && onlineIds.has(otherUser._id)

  const startConversation = async (person) => {
    try {
      const { data } = await api.post('/conversations', { participantId: person._id })
      const conversation = data.data.conversation
      setConversations((current) => current.some((item) => item._id === conversation._id) ? current : [conversation, ...current])
      selectConversation(conversation)
    } catch (error) { notify(getErrorMessage(error), 'error') }
  }

  const loadOlder = async () => {
    if (!selected || !hasMore || olderLoading || !messages.length) return
    setOlderLoading(true)
    previousHeight.current = scrollRef.current?.scrollHeight || 0
    try {
      const { data } = await api.get(`/messages/${selected._id}`, { params: { before: messages[0]._id } })
      setMessages((current) => [...data.data.messages, ...current])
      setHasMore(data.data.hasMore)
    } catch (error) { notify(getErrorMessage(error), 'error') } finally { setOlderLoading(false) }
  }

  const stopTyping = () => {
    window.clearTimeout(typingTimer.current)
    if (typingActive.current && selected) socket.emit('typing:stop', { conversationId: selected._id })
    typingActive.current = false
  }

  const changeMessage = (value) => {
    setMessageText(value)
    if (!selected || !value.trim()) return stopTyping()
    if (!typingActive.current) {
      socket.emit('typing:start', { conversationId: selected._id })
      typingActive.current = true
    }
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(stopTyping, 1100)
  }

  const sendMessage = async (event) => {
    event?.preventDefault()
    const text = messageText.trim()
    if (!text || !selected || sending) return
    setSending(true)
    stopTyping()
    setMessageText('')
    try {
      const { data } = await api.post('/messages', { conversationId: selected._id, text })
      const message = data.data.message
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message])
      setConversations((current) => current.map((item) => item._id === selected._id ? { ...item, lastMessage: message, updatedAt: message.createdAt } : item))
    } catch (error) { setMessageText(text); notify(getErrorMessage(error), 'error') } finally { setSending(false) }
  }

  const deleteMessage = async (message, scope) => {
    if (scope === 'everyone' && !window.confirm('Delete this message for everyone?')) return
    try {
      await api.delete(`/messages/${message._id}`, { data: { scope } })
      setMessages((current) => current.filter((item) => item._id !== message._id))
      setOpenMessageMenu(null)
      notify(scope === 'everyone' ? 'Message deleted for everyone' : 'Message deleted for you')
      if (scope === 'everyone') refreshConversations()
    } catch (error) { notify(getErrorMessage(error), 'error') }
  }

  const signOut = async () => { await logout(); navigate('/login', { replace: true }) }
  const messageGroups = useMemo(() => {
    let previousDay = ''
    return messages.map((message) => {
      const day = new Date(message.createdAt).toDateString()
      const showDivider = day !== previousDay
      previousDay = day
      return { message, showDivider }
    })
  }, [messages])

  return (
    <main className="chat-shell">
      <div className="chat-ambient" />
      <ChatSidebar conversations={conversations} selectedId={selected?._id} onSelect={selectConversation} query={query} setQuery={setQuery} results={results} searchLoading={searchLoading} onStartChat={startConversation} onlineIds={onlineIds} onClose={() => setSidebarOpen(false)} onProfile={() => navigate('/profile')} />
      <section className={`chat-main ${selected ? 'has-selection' : ''}`}>
        {selected && otherUser ? (
          <>
            <header className="chat-header">
              <button type="button" className="icon-button mobile-menu" aria-label="Back to conversations" onClick={() => setSidebarOpen(true)}><ArrowLeft size={19} /></button>
              <Avatar user={otherUser} size="md" online={isOnline} />
              <div className="chat-header-copy"><strong>{otherUser.name}</strong><span>{typingUsers.has(otherUser._id) ? <><i className="typing-dots"><b /><b /><b /></i> typing</> : isOnline ? <><i className="tiny-status" /> Online now</> : formatLastSeen(lastSeenById[otherUser._id] || otherUser.lastSeen)}</span></div>
              <div className="header-actions"><span className="private-note"><span /> PRIVATE CHAT</span><ThemeToggle /><button className="icon-button" type="button" onClick={() => navigate('/profile')} title="Your profile" aria-label="Open profile"><MoreHorizontal size={20} /></button></div>
            </header>

            <div className="message-scroll" ref={scrollRef}>
              <div className="message-column">
                {hasMore && <button className="load-older" type="button" onClick={loadOlder} disabled={olderLoading}>{olderLoading ? <LoaderCircle size={15} className="spin" /> : <ArrowDown size={15} />} Load earlier messages</button>}
                {messagesLoading ? <div className="message-loading"><span className="spinner" /><span>Opening your conversation</span></div> : !messages.length ? (
                  <div className="conversation-welcome"><div className="welcome-portrait"><Avatar user={otherUser} size="xxl" online={isOnline} /></div><span className="eyebrow">A GOOD PLACE TO START</span><h2>Say hello to {otherUser.name.split(' ')[0]}.</h2><p>There’s no better time for a thoughtful message.</p><button type="button" onClick={() => document.querySelector('.message-input')?.focus()}>Write the first one <ArrowDown size={15} /></button></div>
                ) : messageGroups.map(({ message, showDivider }) => {
                  const own = message.sender?._id === user._id
                  return <div className="message-entry" key={message._id}>{showDivider && <DayDivider date={message.createdAt} />}<div className={`message-line ${own ? 'is-own' : ''}`}><div className="message-wrap"><div className="message-bubble"><p>{message.text}</p></div><div className="message-meta"><time>{formatTime(message.createdAt)}</time>{own && (message.read ? <CheckCheck className="read-check" size={14} aria-label="Read" /> : <Check size={14} aria-label="Sent" />)}</div></div><div className="message-actions"><button className="delete-message" type="button" onClick={() => setOpenMessageMenu((current) => current === message._id ? null : message._id)} aria-label="Message actions" title="Message actions" aria-expanded={openMessageMenu === message._id}><Ellipsis size={16} /></button>{openMessageMenu === message._id && <div className="message-action-menu" role="menu"><button type="button" role="menuitem" onClick={() => deleteMessage(message, 'me')}>Delete for me</button>{own && <button type="button" role="menuitem" onClick={() => deleteMessage(message, 'everyone')}>Delete for everyone</button>}</div>}</div></div></div>
                })}
                {typingUsers.has(otherUser._id) && <div className="typing-indicator"><Avatar user={otherUser} size="xs" /><span><i /><i /><i /></span></div>}
                <div ref={bottomRef} />
              </div>
            </div>

            <form className="composer" onSubmit={sendMessage}>
              <div className="composer-box"><textarea className="message-input" rows="1" maxLength="5000" placeholder={`Message ${otherUser.name.split(' ')[0]}...`} value={messageText} onChange={(event) => changeMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) sendMessage(event) }} aria-label="Write a message" /><div className="composer-controls"><span>SHIFT + ENTER FOR A NEW LINE</span><button type="button" className="composer-tool" title="Add a smile" aria-label="Add a smile" onClick={() => changeMessage(`${messageText}${messageText ? ' ' : ''}🙂`)}><Smile size={18} /></button><button type="submit" className="send-button" disabled={!messageText.trim() || sending} aria-label="Send message">{sending ? <LoaderCircle size={17} className="spin" /> : <Send size={17} />}</button></div></div>
              <div className="composer-foot"><span><span className="tiny-status" /> Only you and {otherUser.name.split(' ')[0]} can see this conversation</span><span>{messageText.length}/5000</span></div>
            </form>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-topline"><span className="welcome-status"><i className="tiny-status" /> YOUR ROOM IS READY</span><div><ThemeToggle /><button type="button" className="icon-button" onClick={() => navigate('/profile')} aria-label="Profile settings"><MoreHorizontal size={20} /></button></div></div>
            <div className="welcome-content"><div className="welcome-illustration"><div className="welcome-disc disc-back" /><div className="welcome-disc disc-front"><MessageCircleGraphic /></div><span className="welcome-spark spark-one" /><span className="welcome-spark spark-two" /></div><span className="eyebrow">A LITTLE SPACE TO CONNECT</span><h1>Good conversations<br />start <em>right here.</em></h1><p>Pick a familiar face on the left, or find someone new.<br />We’ll keep the room open.</p><button type="button" className="welcome-action" onClick={() => setSidebarOpen(true)}><Menu size={16} /> Find a conversation</button></div>
            <div className="welcome-bottom"><span>COMMONROOM <i>·</i> MADE FOR THE PEOPLE WHO MATTER</span><button type="button" onClick={signOut}>Sign out</button></div>
          </div>
        )}
      </section>
      {sidebarOpen && <button type="button" className="mobile-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
      <style>{sidebarOpen ? '.sidebar { transform: translateX(0) !important; }' : ''}</style>
    </main>
  )
}

function MessageCircleGraphic() {
  return <span className="graphic-bubbles"><i /><i /><i /></span>
}