import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Account() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const submit = async () => {
    setMsg('')
    const fn = mode === 'login' ? 'signInWithPassword' : 'signUp'
    const { error } = await supabase.auth[fn]({ email, password })
    if (error) setMsg(error.message)
    else if (mode === 'register') setMsg('Check your email to confirm your account.')
  }

  const signOut = () => supabase.auth.signOut()
  const google = () => supabase.auth.signInWithOAuth({ provider: 'google' })

  if (session) {
    return (
      <div className="container" style={{ maxWidth: 460, padding: '80px 24px', textAlign: 'center' }}>
        <h1 className="serif" style={{ fontSize: 38 }}>My Account</h1>
        <p style={{ color: 'var(--sub)', margin: '12px 0 26px' }}>{session.user.email}</p>
        <button className="btn btn-ghost" onClick={signOut}>Sign Out</button>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 420, padding: '70px 24px' }}>
      <div className="section-head" style={{ marginBottom: 28 }}>
        <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join us'}</div>
        <h2 style={{ fontSize: 38 }}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      </div>
      <div className="field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="field"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
      {msg && <p style={{ color: 'var(--gold)', fontSize: 13, marginBottom: 12 }}>{msg}</p>}
      <button className="btn btn-gold" style={{ width: '100%' }} onClick={submit}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </button>
      <button className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={google}>
        Continue with Google
      </button>
      <p style={{ textAlign: 'center', color: 'var(--sub)', marginTop: 18, fontSize: 14 }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button className="link-x" style={{ color: 'var(--gold)' }}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg('') }}>
          {mode === 'login' ? 'Register' : 'Sign In'}
        </button>
      </p>
    </div>
  )
}
