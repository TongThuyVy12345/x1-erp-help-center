import React, { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, FolderTree, ShieldCheck, FileText, LockKeyhole, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { useData } from '../state'
import { Logo, Alert } from '../components/UI'

export default function LoginPage() {
  const { supabase, isConfigured, session, isAdmin, authReady } = useData()
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''); const nav = useNavigate()
  const login = async e => {
    e.preventDefault(); if (!supabase) return
    setBusy(true); setError('')
    const { data, error: signError } = await supabase.auth.signInWithPassword({ email, password })
    if (signError) { setError('Sai email, mật khẩu hoặc tài khoản chưa được kích hoạt.'); setBusy(false); return }
    const { data: record, error: roleError } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle()
    if (roleError) setError('Không kiểm tra được quyền tài khoản. Hãy kiểm tra bảng admin_users.')
    else nav(record ? '/admin' : '/guides', { replace: true })
    setBusy(false)
  }
  if (authReady && session) return <Navigate to={isAdmin ? '/admin' : '/guides'} replace />
  return <div className="login-page"><div className="login-box"><section className="login-brand"><div className="login-grid"/><div className="login-brand-top"><Logo/><h1>Chào mừng đến với <span>X1 Accounting</span></h1><p>Trung tâm hướng dẫn sử dụng và tra cứu nghiệp vụ phần mềm quản trị doanh nghiệp toàn diện.</p></div><div className="login-highlights"><div><FolderTree size={21}/><span><b>Cây chức năng đa cấp</b><small>Truy cập nhanh các quy trình theo từng phân hệ.</small></span></div><div><FileText size={21}/><span><b>Tài liệu Markdown & hình ảnh</b><small>Các bước nghiệp vụ kèm ảnh minh họa.</small></span></div><div><ShieldCheck size={21}/><span><b>Phân quyền người đọc và Admin</b><small>Chỉ quản trị viên được phép sửa và đăng nội dung.</small></span></div></div><small>© X1 Accounting  · Help Center & Docs</small></section><section className="login-form-wrap"><Link to="/" className="back-home">← Trở về cổng tài liệu</Link><div className="login-form-title"><span className="lock-circle"><LockKeyhole size={24}/></span><h2>Đăng nhập tài khoản</h2><p>Đăng nhập bằng tài khoản đã được tạo bởi quản trị hệ thống.</p></div><form onSubmit={login} className="login-form"><label htmlFor="email">Email đăng nhập</label><input id="email" type="email" value={email} autoComplete="username" onChange={e => setEmail(e.target.value)} placeholder="ketoan@congty.vn" required/><label htmlFor="password">Mật khẩu</label><div className="password-field"><input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required/><button type="button" onClick={() => setShow(!show)} aria-label="Ẩn/hiện mật khẩu">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{error && <Alert kind="error">{error}</Alert>}{!isConfigured && <Alert kind="warning">Chưa cấu hình Supabase. Hãy làm theo README.md trước khi đăng nhập.</Alert>}<button className="btn btn-primary login-submit" disabled={busy || !isConfigured} type="submit"><KeyRound size={17}/> {busy ? 'Đang xác thực...' : 'Đăng nhập'} <ArrowRight size={18}/></button></form><div className="login-note"><CheckCircle2 size={17}/><span>Khách xem tài liệu đã xuất bản <Link to="/guides">không cần đăng nhập</Link>. Tài khoản Admin phải được cấp quyền trong Supabase.</span></div></section></div></div>
}
