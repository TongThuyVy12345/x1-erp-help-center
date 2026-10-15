import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, BookOpenCheck, LayoutDashboard, FolderTree, FileText, LogOut, Menu, Search, ShieldCheck, X, Eye, Plus, ChevronRight, ChevronDown, ShoppingCart, Package, Warehouse, Factory, Wrench, Wallet, Landmark, HandCoins, TrendingUp, ChartNoAxesCombined, CreditCard, ListTree, Home } from 'lucide-react'
import { useData } from '../state'
import { cleanSearch, getChildren } from '../lib/util'

export function Logo({ small = false }) { return <Link to="/" className="brand" aria-label="X1 Accounting"><img className="brand-logo" src="/x1-logo.png" alt=""/><span className="brand-text">X1 Accounting <b>{small ? 'Docs' : 'Help Center'}</b></span></Link> }

export function Header() {
  const { session, isAdmin, signOut } = useData()
  const [q, setQ] = useState(''), [mobile, setMobile] = useState(false)
  const nav = useNavigate()
  const submit = (e) => { e.preventDefault(); nav(`/guides?q=${encodeURIComponent(q)}`); setMobile(false) }
  const logout = async () => { await signOut(); nav('/') }
  return <header className="site-header"><div className="header-inner">
    <Logo />
    <nav className={'nav ' + (mobile ? 'nav-open' : '')}>
      <NavLink to="/" end onClick={() => setMobile(false)}>Trang chủ</NavLink>
      <NavLink to="/guides" onClick={() => setMobile(false)}>Hướng dẫn nghiệp vụ</NavLink>
      {isAdmin && <NavLink to="/admin" onClick={() => setMobile(false)}>Quản trị CMS</NavLink>}
    </nav>
    <form className="nav-search" onSubmit={submit}><Search size={18}/><input aria-label="Tìm tài liệu" placeholder="Tìm kiếm hướng dẫn sử dụng..." value={q} onChange={e => setQ(e.target.value)} /><kbd>Enter</kbd></form>
    {session && <div className="account-actions"><button className="btn btn-ghost btn-sm" onClick={logout}><LogOut size={17}/><span className="text-wide">Đăng xuất</span></button>{isAdmin && <Link className="avatar" to="/admin" title="Quản trị viên"><ShieldCheck size={19}/></Link>}</div>}
    <button className="mobile-menu" aria-label="Mở menu" onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</button>
  </div></header>
}

const icons = [ShoppingCart, Package, Warehouse, Factory, Wrench, Wallet, Landmark, HandCoins, TrendingUp, BookOpenCheck, ChartNoAxesCombined]
export function CatIcon({ position = 0, size = 23 }) { const Icon = icons[Math.abs(Number(position) || 0) % icons.length] || FolderTree; return <Icon size={size} strokeWidth={1.9}/> }

export function CategoryTree({ categories, articles = [], selected, onSelect, hrefMode = false, allowEmpty = true }) {
  const [expanded, setExpanded] = useState({}), [filter, setFilter] = useState('')
  const navigate = useNavigate()
  const matches = (c) => cleanSearch(c.title).includes(cleanSearch(filter)) || articles.some(a => a.category_id === c.id && cleanSearch(a.title).includes(cleanSearch(filter)))
  const show = (c) => !filter || matches(c) || getChildren(categories, c.id).some(show)
  const render = (c, depth = 0) => {
    if (!show(c)) return null
    const kids = getChildren(categories, c.id)
    const open = filter ? true : (expanded[c.id] !== false && (expanded[c.id] || depth === 0))
    const count = articles.filter(a => a.category_id === c.id).length
    return <div key={c.id} className="tree-row">
      <div className={'tree-item ' + (selected === c.id ? 'selected' : '')} style={{ paddingLeft: 9 + depth * 17 }}>
        <button className="tree-toggle" onClick={() => setExpanded(v => ({ ...v, [c.id]: !open }))} disabled={!kids.length} aria-label={open ? 'Thu gọn' : 'Mở rộng'}>{kids.length ? (open ? <ChevronDown size={15}/> : <ChevronRight size={15}/>) : <span className="tree-dot"/>}</button>
        <button className="tree-label" onClick={() => { if (hrefMode) navigate(`/guides?category=${c.id}`); else onSelect?.(c.id) }}><FolderTree size={17}/><span>{c.title}</span>{count > 0 && <span className="tree-count">{count}</span>}</button>
      </div>
      {open && kids.map(k => render(k, depth + 1))}
    </div>
  }
  return <div className="tree-panel"><div className="tree-panel-title"><ListTree size={19}/> Cây chức năng</div><div className="field-with-icon"><Search size={16}/><input placeholder="Lọc nghiệp vụ..." value={filter} onChange={e => setFilter(e.target.value)} /></div><div className="tree-scroll">{getChildren(categories).filter(show).map(c => render(c))}{!categories.length && allowEmpty && <p className="muted padded">Chưa có chuyên mục</p>}</div></div>
}

export function AdminLayout({ children, title, detail, action }) {
  const { signOut } = useData(); const nav = useNavigate()
  const logout = async () => { await signOut(); nav('/') }
  return <><Header/><div className="admin-shell"><aside className="admin-sidebar"><div className="sidebar-caption">QUẢN TRỊ NỘI DUNG</div>
    <NavLink to="/admin" end><LayoutDashboard size={19}/> Tổng quan CMS</NavLink>
    <NavLink to="/admin/articles"><FileText size={19}/> Quản lý bài viết</NavLink>
    <NavLink to="/admin/categories"><FolderTree size={19}/> Chuyên mục & Menu</NavLink>
    <div className="sidebar-caption with-separator">HỆ THỐNG</div>
    <Link to="/" ><Eye size={19}/> Chế độ người xem</Link>
    <button onClick={logout}><LogOut size={19}/> Đăng xuất</button>
    <div className="sidebar-bottom"><ShieldCheck size={18}/> Chế độ quản trị viên</div>
  </aside><main className="admin-main"><div className="page-intro"><div><div className="eyebrow">X1 Accounting  CMS PORTAL</div><h1>{title}</h1>{detail && <p className="muted">{detail}</p>}</div>{action}</div>{children}</main></div></>
}

export function Empty({ icon: Icon = BookOpen, title = 'Chưa có nội dung', detail = '' }) { return <div className="empty"><Icon size={34}/><h3>{title}</h3><p>{detail}</p></div> }
export function Alert({ children, kind = 'info' }) { return <div className={'alert alert-' + kind}>{children}</div> }
export function Footer() { return <footer className="footer"><div><Logo small/><p>Tài liệu hướng dẫn sử dụng kế toán X1</p></div><div className="footer-links"><Link to="/">Trang chủ</Link><Link to="/guides">Hướng dẫn</Link><Link to="/login">Đăng nhập</Link></div></footer> }
