import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sendYarnGPTMessage } from '../services/chatApi'

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! 👋 I\'m YarnGPT. How can I help you today?' }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const location = useLocation()

    const preferredLanguage = typeof navigator !== 'undefined' && navigator.language
        ? navigator.language
        : 'en'

    const inFlightRef = useRef(false)

    // Don't show widget on patient chat page (it has its own chat)
    if (location.pathname === '/chat') {
        return null
    }

    const quickActions = [
        'Check symptoms',
        'Book appointment',
        'View hours',
        'Contact clinic'
    ]

    const sendText = async (text) => {
        const trimmed = typeof text === 'string' ? text.trim() : ''
        if (!trimmed) return

        if (inFlightRef.current) {
            return
        }

        let conversation = []
        setMessages((prev) => {
            conversation = prev
                .slice(-8)
                .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }))
            return [...prev, { type: 'user', text: trimmed }]
        })

        setIsTyping(true)
        inFlightRef.current = true

        try {
            const result = await sendYarnGPTMessage({
                message: trimmed,
                preferredLanguage,
                conversation
            })

            setMessages((prev) => [...prev, { type: 'bot', text: result.response }])
        } catch (e2) {
            setMessages((prev) => [...prev, {
                type: 'bot',
                text: `Sorry — I couldn't reach YarnGPT right now. ${e2?.message ? `(${e2.message})` : ''}`
            }])
        } finally {
            setIsTyping(false)
            inFlightRef.current = false
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input.trim()
        setInput('')
        await sendText(userMessage)
    }

    const handleQuickAction = (action) => {
        sendText(action)
    }

    return (
        <>
            {/* Chat Panel */}
            <div className={`chat-widget-panel ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="chat-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <circle cx="9" cy="10" r="1" fill="currentColor" />
                            <circle cx="15" cy="10" r="1" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="chat-header-info">
                        <h3>YarnGPT</h3>
                        <p>Online • Replies in your language</p>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.type}`}>
                            {msg.text.split('\n').map((line, i) => (
                                <span key={i}>{line}<br /></span>
                            ))}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="chat-message bot" style={{ opacity: 0.7 }}>
                            <span style={{ display: 'inline-flex', gap: '4px' }}>
                                <span className="animate-pulse">●</span>
                                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                            </span>
                        </div>
                    )}
                </div>

                <div className="chat-quick-actions">
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="quick-action-btn"
                            onClick={() => handleQuickAction(action)}
                        >
                            {action}
                        </button>
                    ))}
                </div>

                <form className="chat-input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="chat-send-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Floating Button */}
            <button
                className="chat-widget-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>
        </>
    )
}

export default ChatWidget
