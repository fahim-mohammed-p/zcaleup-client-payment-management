import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw
} from 'lucide-react'
import { chatService } from '../api/chatService'

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Business Assistant. Ask me anything about clients, payments, due dates, or business metrics.'
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const quickPrompts = [
    'How many clients do we have?',
    'How much payment is pending?',
    'Which clients have overdue payments?',
    'What is our total received amount?'
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInputMessage('')
    setLoading(true)

    try {
      const historyPayload = newMessages.slice(-6)
      const data = await chatService.sendMessage(text, historyPayload)
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        'Unable to communicate with the AI assistant service. Please check your backend connection.'
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared. How can I assist you with your clients or payments today?'
      }
    ])
  }

  return (
    <>
      <button
        className="floating-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
        title="Open AI Business Assistant"
      >
        {isOpen ? <X size={24} /> : <Bot size={26} />}
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div
            className="p-3 border-bottom d-flex align-items-center justify-content-between"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#fff7ed',
                  color: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                  AI Financial Assistant
                </div>
                <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#10b981' }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block'
                    }}
                  />
                  Live DB Access
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                className="btn btn-sm btn-link text-muted p-1"
                onClick={handleReset}
                title="Reset conversation"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className="btn btn-sm btn-link text-muted p-1"
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-bot d-flex align-items-center gap-2">
                <Loader2 size={16} className="spinner-border spinner-border-sm text-primary" />
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Analyzing records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-3 pt-2 pb-1 d-flex flex-wrap gap-1 bg-white border-top">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  className="btn btn-sm btn-light py-0.5 px-2 text-start"
                  style={{ fontSize: '0.72rem', borderRadius: 12, borderColor: '#e2e8f0' }}
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="p-2.5 bg-white border-top">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="d-flex align-items-center gap-2"
            >
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-light"
                placeholder="Ask about clients, payments, totals..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ borderRadius: 10, fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                disabled={!inputMessage.trim() || loading}
                style={{ width: 36, height: 36, borderRadius: 10, padding: 0 }}
                aria-label="Send message"
              >
                {loading ? <Loader2 size={16} className="spinner-border spinner-border-sm" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
