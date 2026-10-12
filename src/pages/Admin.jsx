import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, FileText, FolderTree, BookOpenCheck, Plus, ArrowRight, Pencil, Trash2, ChevronUp, ChevronDown, Save, AlertCircle, Search, Eye, Clock3, ShieldCheck } from 'lucide-react'
import { useData } from '../state'
import { AdminLayout, Alert, CategoryTree, Empty } from '../components/UI'
import { getChildren, humanDate, slugify, descendants, cleanSearch } from '../lib/util'

export function Dashboard() {
  const { categories, articles, session } = useData()
  const counts = [{name:'Tổng bài viết', number: articles.length, icon:FileText},{name:'Đã xuất bản', number:articles.filter(a => a.status === 'published').length,icon:BookOpenCheck},{name:'Bản nháp', number:articles.filter(a => a.status === 'draft').length,icon:Clock3},{name:'Chuyên mục', number:categories.length,icon:FolderTree}]
  return <AdminLayout title="Tổng quan CMS" detail="Quản lý nội dung và xuất bản tài liệu hướng dẫn X1 ERP." action={<Link className="btn btn-primary" to="/admin/articles/new"><Plus size={17}/> Viết bài mới</Link>}><div className="stat-grid">{counts.map(({name,number,icon:Icon}) => <div className="stat-card" key={name}><div className="stat-icon"><Icon size={24}/></div><span>{name}</span><strong>{number}</strong></div>)}</div><div className="admin-columns"><section className="panel"><div className="panel-heading"><h2>Bài viết cập nhật gần đây</h2><Link className="text-link" to="/admin/articles">Xem tất cả <ArrowRight size={17}/></Link></div>{articles.slice(0,7).map(a => <Link className="recent-row" key={a.id} to={`/admin/articles/${a.id}`}><span className="article-mini-icon"><FileText size={19}/></span><span><b>{a.title}</b><small>{humanDate(a.updated_at)} · {categories.find(c => c.id === a.category_id)?.title || 'Chưa phân loại'}</small></span><span className={'status ' + a.status}>{a.status === 'published' ? 'Đã đăng' : 'Bản nháp'}</span></Link>)}{!articles.length && <Empty title="Chưa có bài viết" detail="Nhấn Viết bài mới để tạo hướng dẫn đầu tiên."/>}</section><section className="panel"><div className="panel-heading"><h2>Thao tác nhanh</h2></div><div className="quick-actions"><Link to="/admin/articles/new"><Plus size={23}/><span><b>Tạo bài viết</b><small>Soạn thảo Markdown và xuất bản</small></span><ArrowRight size={17}/></Link><Link to="/admin/categories"><FolderTree size={23}/><span><b>Quản lý chuyên mục</b><small>Tạo cây chức năng cha – con</small></span><ArrowRight size={17}/></Link><Link to="/guides"><Eye size={23}/><span><b>Xem như người đọc</b><small>Kiểm tra giao diện đã xuất bản</small></span><ArrowRight size={17}/></Link></div><div className="admin-info"><ShieldCheck size={17}/> Đăng nhập: {session?.user?.email}</div></section></div></AdminLayout>
}

export function ArticlesAdmin() {
  const { articles, categories, supabase, reload } = useData()
  const [term, setTerm] = useState(''), [status,setStatus] = useState('all'), [notice,setNotice] = useState(''), [busy,setBusy] = useState(false)
  const visible = articles.filter(a => (status === 'all' || a.status === status) && cleanSearch(a.title).includes(cleanSearch(term)))
  const remove = async (a) => {
    if (!window.confirm(`Xóa vĩnh viễn bài viết “${a.title}”?`)) return
    setBusy(true)
    const { error } = await supabase.from('articles').delete().eq('id',a.id)
    setNotice(error ? 'Lỗi xóa: '+error.message : 'Đã xóa bài viết')
    if (!error) await reload(); setBusy(false)
  }
  return <AdminLayout title="Quản lý bài viết" detail="Tạo, chỉnh sửa, lưu nháp và xuất bản hướng dẫn dạng Markdown." action={<Link to="/admin/articles/new" className="btn btn-primary"><Plus size={18}/> Thêm bài viết</Link>}><div className="panel"><div className="filter-bar"><div className="field-with-icon"><Search size={18}/><input placeholder="Tìm bài viết..." value={term} onChange={e => setTerm(e.target.value)}/></div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="published">Đã đăng</option><option value="draft">Bản nháp</option></select></div>{notice && <Alert>{notice}</Alert>}<div className="table-scroll"><table className="data-table"><thead><tr><th>Tên bài viết</th><th>Chuyên mục</th><th>Trạng thái</th><th>Ngày đăng</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{visible.map(a => <tr key={a.id}><td><Link className="strong-link" to={`/admin/articles/${a.id}`}>{a.title}</Link><div className="slug-caption">/{a.slug}</div></td><td>{categories.find(c => c.id === a.category_id)?.title || '—'}</td><td><span className={'status '+a.status}>{a.status === 'published'?'Đã đăng':'Bản nháp'}</span></td><td>{humanDate(a.published_at)}</td><td>{humanDate(a.updated_at)}</td><td className="table-actions"><Link title="Sửa" to={`/admin/articles/${a.id}`}><Pencil size={18}/></Link>{a.status === 'published' && <Link title="Xem" to={`/guides/${a.slug}`}><Eye size={18}/></Link>}<button title="Xóa" disabled={busy} onClick={() => remove(a)}><Trash2 size={18}/></button></td></tr>)}</tbody></table></div>{!visible.length && <Empty title="Không có bài viết phù hợp"/>}</div></AdminLayout>
}

const EMPTY_FORM = { title:'',slug:'',description:'',parent_id:'',position:0 }
export function CategoriesAdmin() {
  const { categories, articles, supabase, reload } = useData()
  const [selected,setSelected] = useState(null), [form,setForm] = useState(EMPTY_FORM), [msg,setMsg] = useState(''), [busy,setBusy] = useState(false)
  const editing = categories.find(c => c.id === selected)
  const pick = (id) => { const c = categories.find(v=>v.id===id); setSelected(id); setForm(c ? {title:c.title,slug:c.slug,description:c.description,parent_id:c.parent_id||'',position:c.position} : EMPTY_FORM); setMsg('') }
  const newCategory = (parentId='') => {setSelected(null);setForm({...EMPTY_FORM,parent_id:parentId,position:getChildren(categories,parentId||null).length + 1});setMsg('')}
  const excludeParents = editing ? new Set([editing.id, ...descendants(categories, editing.id)]) : new Set()
  const save = async e => {
    e.preventDefault(); if (!supabase) return
    if (!form.title.trim() || !form.slug.trim()) { setMsg('Vui lòng nhập tên và đường dẫn.'); return }
    setBusy(true); setMsg('')
    const payload = {title:form.title.trim(),slug:slugify(form.slug), description:form.description.trim(),parent_id:form.parent_id||null,position:Number(form.position)||0}
    const resp = editing ? await supabase.from('categories').update(payload).eq('id',editing.id).select().single() : await supabase.from('categories').insert(payload).select().single()
    if (resp.error) setMsg('Không lưu được: '+resp.error.message)
    else { setSelected(resp.data.id); setForm({title:resp.data.title,slug:resp.data.slug,description:resp.data.description,parent_id:resp.data.parent_id||'',position:resp.data.position}); await reload(); setMsg('Đã lưu chuyên mục thành công.') }
    setBusy(false)
  }
  const remove = async () => {
    if (!editing || !window.confirm(`Xóa chuyên mục “${editing.title}”? (Phải xóa bài viết và chuyên mục con trước)`)) return
    setBusy(true)
    const {error} = await supabase.from('categories').delete().eq('id',editing.id)
    if (error) setMsg('Không thể xóa: '+error.message)
    else { await reload(); newCategory(); setMsg('Đã xóa chuyên mục.') }
    setBusy(false)
  }
  const move = async dir => {
    if (!editing) return
    const siblings = getChildren(categories, editing.parent_id)
    const idx = siblings.findIndex(c=>c.id===editing.id); const other=siblings[idx+dir]
    if (!other) return
    setBusy(true);setMsg('')
    // Dùng vị trí mới duy nhất rồi cập nhật lại tất cả anh em một lần.
    const ordered = [...siblings]; [ordered[idx],ordered[idx+dir]] = [ordered[idx+dir],ordered[idx]]
    for (let i=0;i<ordered.length;i++) {
      const {error}=await supabase.from('categories').update({position:i+1}).eq('id',ordered[i].id)
      if(error) {setMsg('Lỗi lưu thứ tự: '+error.message);break}
    }
    await reload();setBusy(false)
  }
  return <AdminLayout title="Quản lý Cây chức năng & Chuyên mục nghiệp vụ" detail="Tổ chức thư mục đa cấp hiển thị trên cổng hướng dẫn X1 ERP." action={<div className="row-buttons"><button onClick={()=>newCategory()} className="btn btn-soft"><Plus size={17}/> Thêm chức năng cha</button><button onClick={()=>newCategory(selected||'')} className="btn btn-primary"><Plus size={17}/> Thêm chức năng con</button></div>}><div className="category-admin-grid"><div className="panel no-padding"><CategoryTree categories={categories} articles={articles} selected={selected} onSelect={pick}/></div><div className="panel"><div className="panel-heading"><h2>{editing ? `Chi tiết chuyên mục: ${editing.title}` : 'Tạo chuyên mục mới'}</h2>{editing && <div className="row-buttons"><button className="icon-btn" disabled={busy} title="Đẩy lên" onClick={()=>move(-1)}><ChevronUp size={19}/></button><button className="icon-btn" disabled={busy} title="Đẩy xuống" onClick={()=>move(1)}><ChevronDown size={19}/></button></div>}</div>{msg && <Alert kind={msg.includes('Không') || msg.includes('Lỗi') ? 'error':'info'}>{msg}</Alert>}<form onSubmit={save} className="form-stack"><label>Tên chức năng / chuyên mục <span className="req">*</span><input value={form.title} maxLength={150} onChange={e=>setForm(f=>({...f,title:e.target.value,slug:(!editing || f.slug===slugify(f.title)) ? slugify(e.target.value):f.slug}))} placeholder="Ví dụ: Nhập kho mua hàng" required/></label><label>Đường dẫn (slug) <span className="req">*</span><input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} required/></label><label>Chuyên mục cha<select value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))}><option value="">— Gốc (chức năng cha) —</option>{categories.filter(c=>!excludeParents.has(c.id)).map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Mô tả<textarea rows={3} placeholder="Mô tả nhóm chức năng này..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></label><label>Thứ tự hiển thị<input type="number" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))}/></label><div className="form-actions"><button className="btn btn-primary" disabled={busy} type="submit"><Save size={17}/>{busy?'Đang lưu...':'Lưu chuyên mục'}</button>{editing && <button type="button" className="btn btn-danger-outline" disabled={busy} onClick={remove}><Trash2 size={17}/> Xóa</button>}</div></form>{editing && <div className="category-related"><h3>Danh sách bài viết trực thuộc</h3>{articles.filter(a=>a.category_id===editing.id).map(a=><Link className="recent-row" to={`/admin/articles/${a.id}`} key={a.id}><FileText size={17}/><span>{a.title}</span><span className={'status '+a.status}>{a.status==='published'?'Đã đăng':'Nháp'}</span></Link>)}{!articles.some(a=>a.category_id===editing.id) && <p className="muted">Chưa có bài viết.</p>}<Link className="btn btn-outline btn-sm" to={`/admin/articles/new?category=${editing.id}`}><Plus size={16}/> Tạo bài trong chuyên mục</Link></div>}</div></div></AdminLayout>
}
