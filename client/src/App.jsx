import React, { useState } from 'react'

function Copyable({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <div className="row">
      <input value={text} readOnly />
      <button onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</button>
    </div>
  )
}

export default function App() {
  const [longUrl, setLongUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const submitUrl = async (e) => {
    e.preventDefault()
    setError(''); setResult(null)
    if (!longUrl.trim()) {
      setError('Please enter a URL')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('https://url-shortener-6m22.onrender.com/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to shorten')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <p className="tag">Paste a long URL and I will condense its existential crisis.</p>

      <form onSubmit={submitUrl}>
        <div className="row">
          <input
            placeholder="https://www.example.com/some/very/long/path"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? 'Shortening...' : 'Shorten'}</button>
        </div>
      </form>

      {error && <p className="mt-3" style={{ color: '#fca5a5' }}>{error}</p>}

      {result && (
        <div className="mt-4">
          <h3>Short URL</h3>
          <Copyable text={result.shortUrl} />
          <p className="mt-2">Original: <a href={result.longUrl} target="_blank" rel="noreferrer">{result.longUrl}</a></p>
        </div>
      )}

      <div className="mt-4">
        <details>
          <summary>Admin</summary>
          <Admin />
        </details>
      </div>
    </div>
  )
}

function Admin() {
  const [key, setKey] = useState(import.meta.env.VITE_ADMIN_KEY || '')
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('https://url-shortener-6m22.onrender.com/api/admin/urls', {
        headers: { 'x-admin-key': key }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load')
      setRows(data)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <div className="row">
        <input placeholder="Admin key" value={key} onChange={e => setKey(e.target.value)} />
        <button onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Load URLs'}</button>
      </div>
      {err && <p className="mt-2" style={{ color: '#fca5a5' }}>{err}</p>}
      {rows.length > 0 && (
        <div className="mt-3">
          <table>
            <thead>
              <tr>
                <th>Short</th>
                <th>Long</th>
                <th>Clicks</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td><a href={r.shortUrl} target="_blank" rel="noreferrer">{r.shortCode}</a></td>
                  <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={r.longUrl} target="_blank" rel="noreferrer">{r.longUrl}</a>
                  </td>
                  <td><span className="pill">{r.clicks}</span></td>
                  <td>{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
