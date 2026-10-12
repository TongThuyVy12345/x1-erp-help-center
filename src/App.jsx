import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useData } from './state'
import { HomePage, GuidesPage, ArticlePage } from './pages/Public'
import LoginPage from './pages/Login'
import { Dashboard, ArticlesAdmin, CategoriesAdmin } from './pages/Admin'
import Editor from './pages/Editor'
import { Header, Empty, Alert, Footer } from './components/UI'
import { ShieldAlert } from 'lucide-react'

function RequireAdmin({ children }) {
  const { authReady, isAdmin, isConfigured, loading, session } = useData()
  if (!authReady) return <div className="loading-page">Đang kiểm tra phiên đăng nhập...</div>
  if (!isConfigured) return <><Header/><div className="container missing"><Alert kind="warning">Cần cấu hình Supabase trước khi có thể đăng nhập quản trị. Xem README.md trong dự án.</Alert></div><Footer/></>
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <><Header/><div className="container missing"><Empty icon={ShieldAlert} title="Không có quyền Quản trị" detail="Tài khoản này chỉ được phép xem hướng dẫn. Vui lòng nhờ Admin cấp quyền trong Supabase."/><Link to="/guides" className="btn btn-primary">Về cổng tài liệu</Link></div><Footer/></>
  return children
}
export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage/>}/><Route path="/guides" element={<GuidesPage/>}/><Route path="/guides/:slug" element={<ArticlePage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/admin" element={<RequireAdmin><Dashboard/></RequireAdmin>}/>
    <Route path="/admin/articles" element={<RequireAdmin><ArticlesAdmin/></RequireAdmin>}/>
    <Route path="/admin/categories" element={<RequireAdmin><CategoriesAdmin/></RequireAdmin>}/>
    <Route path="/admin/articles/new" element={<RequireAdmin><Editor/></RequireAdmin>}/>
    <Route path="/admin/articles/:id" element={<RequireAdmin><Editor/></RequireAdmin>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}
