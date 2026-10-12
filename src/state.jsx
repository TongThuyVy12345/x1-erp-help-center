import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase'
import { demoCategories, demoArticles } from './lib/demo'

const Context = createContext(null)
export function DataProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isConfigured)
  const [isAdmin, setIsAdmin] = useState(false)
  const [categories, setCategories] = useState(isConfigured ? [] : demoCategories)
  const [articles, setArticles] = useState(isConfigured ? [] : demoArticles)
  const [loading, setLoading] = useState(isConfigured)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return
    let live = true
    const check = async (activeSession) => {
      if (!live) return
      setAuthReady(false)
      setSession(activeSession)
      if (activeSession?.user?.id) {
        const { data, error: memberError } = await supabase.from('admin_users').select('user_id').eq('user_id', activeSession.user.id).maybeSingle()
        if (live) { setIsAdmin(!memberError && Boolean(data)); setAuthReady(true) }
      } else { setIsAdmin(false); setAuthReady(true) }
    }
    supabase.auth.getSession().then(({ data }) => check(data.session)).catch(() => { if (live) setAuthReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      // Tránh đợi truy vấn Supabase ngay trong callback auth: hẹn microtask.
      setTimeout(() => { if (live) check(s) }, 0)
    })
    return () => { live = false; subscription.unsubscribe() }
  }, [])

  const reload = useCallback(async () => {
    if (!supabase) return
    setLoading(true); setError('')
    try {
      const [c, a] = await Promise.all([
        supabase.from('categories').select('*').order('position', { ascending: true }),
        supabase.from('articles').select('*').order('updated_at', { ascending: false })
      ])
      if (c.error) throw c.error
      if (a.error) throw a.error
      setCategories(c.data || []); setArticles(a.data || [])
    } catch (e) { setError(e.message || 'Không tải được dữ liệu. Hãy kiểm tra SQL và biến môi trường.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { if (authReady) reload() }, [authReady, isAdmin, reload])

  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setIsAdmin(false) }
  return <Context.Provider value={{ session, authReady, isAdmin, isConfigured, supabase, categories, articles, loading, error, reload, signOut }}>
    {children}
  </Context.Provider>
}
export function useData() { return useContext(Context) }
