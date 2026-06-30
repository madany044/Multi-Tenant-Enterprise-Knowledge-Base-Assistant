// src/components/Dashboard.jsx
import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const fileInputRef = useRef(null)

  // Fetch documents from backend on mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoadingDocs(true)
    try {
      const res = await axios.get('/api/v1/documents/')
      setDocuments(res.data || [])
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      // Don't show error for list — it's ok to start empty
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setError('')
      setUploadSuccess(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setError('')
      setUploadSuccess(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.md', '.csv']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedExts.includes(ext)) {
      setError('Unsupported file type. Please upload PDF, DOC, DOCX, TXT, MD, or CSV files.')
      return
    }

    setUploading(true)
    setError('')
    setUploadSuccess(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      await axios.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })

      setUploadSuccess(true)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // Refresh the document list
      fetchDocuments()
    } catch (err) {
      console.error('Upload error:', err)
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Authentication required. The backend may still have auth enabled.')
            break
          case 404:
            setError('Upload endpoint not found. Verify the backend is running on port 8000.')
            break
          case 413:
            setError('File too large. Please upload a file under 50MB.')
            break
          default:
            setError(`Upload failed (${err.response.status}): ${err.response.data?.detail || 'Unknown error'}`)
        }
      } else if (err.code === 'ECONNABORTED') {
        setError('Upload timed out. The file may be too large.')
      } else {
        setError('Cannot connect to the backend. Make sure it is running on port 8000.')
      }
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError('')
    setUploadSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await axios.delete(`/api/v1/documents/${docId}`)
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            Indexed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
            Processing
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            {status || 'Uploaded'}
          </span>
        )
    }
  }

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop().toLowerCase()
    if (ext === 'pdf') return 'text-red-400 bg-red-500/10'
    if (['doc', 'docx'].includes(ext)) return 'text-blue-400 bg-blue-500/10'
    if (['txt', 'md'].includes(ext)) return 'text-slate-400 bg-slate-500/10'
    if (ext === 'csv') return 'text-green-400 bg-green-500/10'
    return 'text-slate-400 bg-slate-500/10'
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* Header */}
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400 text-base">Upload and manage your knowledge base documents for AI-powered retrieval.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — Upload Area */}
          <div className="lg:col-span-2">
            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] p-6">
              <h2 className="text-white font-semibold text-lg mb-1">Upload Document</h2>
              <p className="text-slate-500 text-sm mb-6">PDF, DOCX, TXT, MD, CSV (max 50MB)</p>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-400/[0.05]'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-500/[0.03]'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.md,.csv"
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{file.name}</p>
                      <p className="text-slate-500 text-xs mt-1">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile() }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                      dragOver ? 'bg-cyan-400/10' : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
                    }`}>
                      <svg className={`w-7 h-7 transition-colors ${dragOver ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm font-medium">
                        {dragOver ? 'Drop file here' : 'Drag & drop your file here'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">or click to browse</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Success */}
              {uploadSuccess && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-emerald-300 text-sm">Document uploaded successfully!</p>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  !file || uploading
                    ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.06]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right — Document List */}
          <div className="lg:col-span-3">
            <div className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">Documents</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Your knowledge base</p>
                </div>
                <div className="flex items-center gap-2">
                  {documents.filter(d => d.status === 'indexed').length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {documents.filter(d => d.status === 'indexed').length} indexed
                    </span>
                  )}
                  {documents.filter(d => d.status === 'processing').length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {documents.filter(d => d.status === 'processing').length} processing
                    </span>
                  )}
                </div>
              </div>

              {/* Table Header */}
              <div className="px-6 py-3 border-b border-white/[0.04] grid grid-cols-12 gap-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {/* Document Rows */}
              {loadingDocs ? (
                <div className="px-6 py-12 text-center">
                  <svg className="animate-spin w-6 h-6 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-slate-500 text-sm">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 text-sm">No documents yet</p>
                  <p className="text-slate-600 text-xs mt-1">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {documents.map((doc) => (
                    <div key={doc.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.02] transition-colors group">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${getFileIcon(doc.filename)}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <span className="text-white text-sm truncate">{doc.filename}</span>
                      </div>
                      <div className="col-span-2 text-slate-400 text-sm">{formatDate(doc.created_at)}</div>
                      <div className="col-span-3">{getStatusBadge(doc.status)}</div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 p-1"
                          title="Delete document"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-[#111827] rounded-xl border border-white/[0.06] p-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total</p>
                <p className="text-2xl font-bold text-white">{documents.length}</p>
              </div>
              <div className="bg-[#111827] rounded-xl border border-white/[0.06] p-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Indexed</p>
                <p className="text-2xl font-bold text-emerald-400">{documents.filter(d => d.status === 'indexed').length}</p>
              </div>
              <div className="bg-[#111827] rounded-xl border border-white/[0.06] p-5">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Processing</p>
                <p className="text-2xl font-bold text-amber-400">{documents.filter(d => d.status === 'processing').length}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}