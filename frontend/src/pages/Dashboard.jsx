import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [file, setFile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const chatEndRef = useRef(null)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    await axios.post(\`\${import.meta.env.VITE_API_URL}/documents/upload\`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', 'Authorization': \`Bearer \${token}\` }
    })
    alert('File uploaded successfully!')
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!input) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')

    // SSE Stream Mock
    const eventSource = new EventSource(\`\${import.meta.env.VITE_API_URL}/chat/sessions/mock/messages?query=\${input}\`)
    // Note: In production, use fetch with POST and ReadableStream for SSE with Auth headers.
    // This is a simplified mock for the scaffold.
    
    setTimeout(() => {
      setMessages(prev => {
        const newArr = [...prev]
        newArr[newArr.length - 1].content = "This is a mocked RAG response. [Source: doc.pdf, Page 1]"
        return newArr
      })
    }, 1000)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-4">RAG SaaS</h1>
        <div className="mb-8">
          <h2 className="text-sm mb-2 text-gray-400">Upload Document</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-2">
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="text-sm" />
            <button className="bg-blue-600 py-1 rounded text-sm">Upload</button>
          </form>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <header className="p-4 border-b font-semibold">Chat with your Knowledge Base</header>
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={\`mb-4 flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
              <div className={\`p-3 rounded-lg max-w-xl \${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'\`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleChat} className="p-4 border-t flex">
          <input className="flex-1 p-2 border rounded-l" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question..." />
          <button className="bg-blue-600 text-white px-4 rounded-r">Send</button>
        </form>
      </div>
    </div>
  )
}
