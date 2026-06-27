import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const [form, setForm] = useState({ company_name: '', email: '', password: '', name: '' })
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post(\`\${import.meta.env.VITE_API_URL}/auth/signup\`, form)
      navigate('/login')
    } catch (err) {
      alert(err.response?.data?.detail || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">Sign Up</h2>
        <input className="w-full p-2 mb-4 border rounded" placeholder="Company Name" onChange={e => setForm({...form, company_name: e.target.value})} required />
        <input className="w-full p-2 mb-4 border rounded" placeholder="Your Name" onChange={e => setForm({...form, name: e.target.value})} required />
        <input className="w-full p-2 mb-4 border rounded" type="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} required />
        <input className="w-full p-2 mb-4 border rounded" type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Create Account</button>
      </form>
    </div>
  )
}
