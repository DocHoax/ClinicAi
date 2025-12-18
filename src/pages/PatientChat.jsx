import { useEffect, useRef, useState } from 'react'
import { sendYarnGPTMessage } from '../services/chatApi'

function PatientChat() {
    const preferredLanguage = typeof navigator !== 'undefined' && navigator.language
        ? navigator.language
        : 'en'

    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: 'Hello! 👋 I\'m YarnGPT. I can help you with:\n\n• Symptom guidance (not diagnosis)\n• Booking appointments\n• Clinic services and hours\n\nHow can I help you today?'
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    const quickActions = [
        { label: '🩺 Check Symptoms', message: 'I want to check my symptoms' },
        { label: '📅 Book Appointment', message: 'I\'d like to book an appointment' },
        { label: '⏰ Clinic Hours', message: 'What are your clinic hours?' },
        { label: '🏥 Services', message: 'What services do you offer?' },
    ]

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async (userMessage) => {
        const trimmed = typeof userMessage === 'string' ? userMessage.trim() : ''
        if (!trimmed) return

        setIsTyping(true)

        let conversation = []
        setMessages((prev) => {
            conversation = prev
                .slice(-10)
                .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }))
            return [...prev, { type: 'user', text: trimmed }]
        })

        try {
            const result = await sendYarnGPTMessage({
                message: trimmed,
                preferredLanguage,
                conversation
            })

            setMessages(prev => [...prev, { type: 'bot', text: result.response }])
        } catch (e) {
            setMessages(prev => [...prev, {
                type: 'bot',
                text: `Sorry — I couldn\'t reach YarnGPT right now. ${e?.message ? `(${e.message})` : ''}`
            }])
        } finally {
            setIsTyping(false)
        }
    }

    const handleSend = (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMessage = input.trim()
        setInput('')
        sendMessage(userMessage)
    }

    const handleQuickAction = (message) => {
        sendMessage(message)
    }

    return (
        <div className="patient-chat">
            <div className="patient-chat-container">
                <div className="patient-chat-header">
                    <h1>YarnGPT</h1>
                    <p>Available 24/7 • Replies in your language ({preferredLanguage})</p>
                </div>

                <div className="patient-chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.type}`}>
                            {msg.text.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line.startsWith('**') && line.endsWith('**')
                                        ? <strong>{line.slice(2, -2)}</strong>
                                        : line.startsWith('• ')
                                            ? <span>• {line.slice(2)}</span>
                                            : line
                                    }
                                    <br />
                                </span>
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

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div style={{
                    padding: 'var(--spacing-4)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-2)',
                    justifyContent: 'center',
                    borderTop: '1px solid var(--border-light)'
                }}>
                    {quickActions.map((action, index) => (
                        <button
                            key={index}
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleQuickAction(action.message)}
                            style={{ fontSize: 'var(--font-size-sm)' }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>

                <div className="patient-chat-input">
                    <form className="patient-chat-input-form" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Type your message here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            Send
                        </button>
                    </form>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{
                textAlign: 'center',
                padding: 'var(--spacing-3)',
                background: 'var(--background)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)'
            }}>
                ⚠️ This AI assistant provides guidance only — not medical diagnoses. For emergencies, call 911.
            </div>
        </div>
    )
}

export default PatientChat
