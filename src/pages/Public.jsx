import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Search, BookOpen, CalendarDays, Clock3, ChevronRight, FolderOpen, Home, Link as LinkIcon, Printer, ThumbsUp, ThumbsDown, ShieldCheck, CheckCircle2, List, FileText, Edit3 } from 'lucide-react'
import { useData } from '../state'
import { Alert, CatIcon, CategoryTree, Empty, Footer, Header } from '../components/UI'
import { Markdown } from '../components/Markdown'
import { cleanSearch, familyIds, getChildren, headings, humanDate, minutesToRead } from '../lib/util'

function Articles({ list, categories }) {
  return <div className="article-grid">{list.map(a => <Link className="article-card" key={a.id} to={`/guides/${a.slug}`}><div className="article-card-icon"><FileText size={20}/></div><h3>{a.title}</h3><p>{a.excerpt || 'Xem hướng dẫn chi tiết và các bước thực hiện.'}</p><div className="article-bottom"><span><CalendarDays size={14}/> {humanDate(a.published_at)}</span><span>Đọc tiếp <ArrowRight size={15}/></span></div></Link>)}</div>
}

export function HomePage() {
  const { categories, articles, isConfigured, loading, error } = useData()
  const [q, setQ] = useState(''); const nav = useNavigate()
  const published = articles.filter(a => a.status === 'published').sort((a,b) => new Date(b.published_at) - new Date(a.published_at))
  const roots = getChildren(categories)
  const search = e => { e.preventDefault(); nav(`/guides?q=${encodeURIComponent(q)}`) }
  return <><Header/><main className="public-main"><section className="hero"><div className="hero-glow"/><div className="hero-inner"><span className="hero-badge"><span className="pulse"/> Cổng thông tin & Hướng dẫn chuẩn hóa X1 Accounting</span><h1>Trung tâm hướng dẫn sử dụng <span>X1 Accounting </span></h1><p>Tra cứu tài liệu quy trình và hướng dẫn chi tiết các nghiệp vụ kế toán, chuỗi cung ứng và quản trị trên hệ thống X1 Accounting .</p><form className="hero-search" onSubmit={search}><Search size={23}/><input placeholder="Bạn cần tìm hướng dẫn gì? Ví dụ: phiếu thu, kết chuyển..." value={q} onChange={e => setQ(e.target.value)} /><button type="submit" className="btn btn-primary">Tìm kiếm <ArrowRight size={17}/></button></form><div className="quick-search">Tìm kiếm nhanh: {['Mua hàng', 'Phiếu thu', 'Kết chuyển', 'Kho'].map(term => <button key={term} onClick={() => nav(`/guides?q=${encodeURIComponent(term)}`)}>{term}</button>)}</div></div></section>
  <div className="container"><section className="section"><div className="section-heading"><div><div className="eyebrow">DANH MỤC NGHIỆP VỤ</div><h2>Khám phá hướng dẫn theo nghiệp vụ</h2><p>Chọn phân hệ để xem các tài liệu và tính năng tương ứng.</p></div><Link to="/guides" className="text-link">Xem tất cả <ArrowRight size={17}/></Link></div><div className="category-grid">{roots.map((c,i) => <Link className="category-card" key={c.id} to={`/guides?category=${c.id}`}><div className={'category-icon color-'+(i%5)}><CatIcon position={i} size={24}/></div><h3>{c.title}</h3><p>{c.description || 'Xem tài liệu hướng dẫn nghiệp vụ'}</p><span>Xem hướng dẫn <ArrowRight size={16}/></span></Link>)}</div>{!roots.length && !loading && <Empty title="Chưa có chuyên mục"/>}</section>
  <section className="section"><div className="section-heading"><div><div className="eyebrow">THƯ VIỆN TÀI LIỆU</div><h2>Bài viết mới cập nhật</h2><p>Các hướng dẫn được quản trị viên xuất bản gần đây.</p></div><Link to="/guides" className="text-link">Tất cả bài viết <ArrowRight size={17}/></Link></div><Articles list={published.slice(0,6)} categories={categories}/>{!published.length && !loading && <Empty title="Chưa có bài viết xuất bản" detail="Admin có thể đăng bài đầu tiên tại trang quản trị."/>}</section>
  {!isConfigured && <Alert>Đang xem <strong>giao diện mẫu (chỉ đọc)</strong>. Để dữ liệu lưu thực tế, hãy cấu hình Supabase theo file README.md.</Alert>}
  {error && <Alert kind="error">Lỗi tải dữ liệu: {error}</Alert>}</div></main><Footer/></>
}

export function GuidesPage() {
  const { categories, articles, loading, error } = useData()
  const [params, setParams] = useSearchParams()
  const category = params.get('category'), q = params.get('q') || ''
  const shown = useMemo(() => {
    const permitted = category ? familyIds(categories, category) : null
    return articles.filter(a => a.status === 'published' && (!permitted || permitted.has(a.category_id)) && (!q || cleanSearch(`${a.title} ${a.excerpt} ${a.content}`).includes(cleanSearch(q))))
      .sort((a,b) => new Date(b.published_at) - new Date(a.published_at))
  }, [articles, categories, q, category])
  const selected = categories.find(c => c.id === category)
  return <><Header/><main className="public-main"><div className="container guide-layout"><aside><CategoryTree categories={categories} articles={articles.filter(a => a.status === 'published')} selected={category} hrefMode/><div className="guide-side-note"><BookOpen size={21}/><b>Hỗ trợ nghiệp vụ</b><p>Chọn chuyên mục hoặc tìm kiếm hướng dẫn phù hợp với công việc.</p></div></aside><section className="guide-content"><div className="breadcrumbs"><Link to="/">Trang chủ</Link><ChevronRight size={14}/> Hướng dẫn nghiệp vụ</div><div className="guide-heading"><div><div className="eyebrow">THƯ VIỆN QUY TRÌNH</div><h1>{selected ? selected.title : 'Hướng dẫn nghiệp vụ X1 Accounting '}</h1><p>{selected?.description || 'Cây nghiệp vụ và tài liệu hướng dẫn sử dụng Odoo 19'}</p></div><span className="count-pill">{shown.length} bài viết</span></div><form className="large-search" onSubmit={e => e.preventDefault()}><Search size={20}/><input value={q} onChange={e => { const x = new URLSearchParams(params); if (e.target.value) x.set('q',e.target.value); else x.delete('q'); setParams(x) }} placeholder="Tìm theo tiêu đề hoặc nội dung hướng dẫn..." />{q && <button type="button" onClick={() => { const x = new URLSearchParams(params); x.delete('q'); setParams(x) }}>Xóa lọc</button>}</form><Articles list={shown} categories={categories}/>{!shown.length && !loading && <Empty title="Không tìm thấy bài viết" detail="Thử từ khóa khác hoặc chọn chuyên mục khác."/>}{error && <Alert kind="error">{error}</Alert>}</section></div></main><Footer/></>
}

export function ArticlePage() {
  const { slug } = useParams()
  const { categories, articles, isAdmin, loading } = useData()
  const [feedback, setFeedback] = useState(null), [copied,setCopied] = useState(false)
  const item = articles.find(a => a.slug === slug && (a.status === 'published' || isAdmin))
  useEffect(() => { setFeedback(null); setCopied(false) }, [slug])
  if (!item && loading) return <><Header/><div className="container loading">Đang tải nội dung...</div></>
  if (!item) return <><Header/><div className="container missing"><Empty title="Không tìm thấy tài liệu" detail="Bài viết có thể chưa được xuất bản hoặc đường dẫn không tồn tại."/><Link className="btn btn-primary" to="/guides">Về danh sách tài liệu</Link></div><Footer/></>
  const category = categories.find(c => c.id === item.category_id)
  const toc = headings(item.content)
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true) } catch { setCopied(false) } }
  return <><Header/><main className="public-main"><div className="reading-grid"><aside className="reading-left"><CategoryTree categories={categories} articles={articles.filter(a => a.status === 'published')} selected={item.category_id} hrefMode/></aside><article className="reading-article"><div className="breadcrumbs"><Link to="/">Trang chủ</Link><ChevronRight size={14}/><Link to="/guides">Hướng dẫn</Link><ChevronRight size={14}/>{category?.title}</div><div className="reading-heading"><div className="eyebrow"><ShieldCheck size={15}/> HƯỚNG DẪN NGHIỆP VỤ</div><h1>{item.title}</h1><div className="meta-row"><span><CalendarDays size={16}/> Ngày đăng: <b>{humanDate(item.published_at)}</b></span><span><Clock3 size={16}/> Cập nhật: <b>{humanDate(item.updated_at)}</b></span><span><BookOpen size={16}/> {minutesToRead(item.content)} phút đọc</span><span className="meta-category">{category?.title || 'Chưa phân loại'}</span></div>{item.excerpt && <blockquote className="intro-note">{item.excerpt}</blockquote>}<div className="document-actions"><button className="btn btn-outline btn-sm" onClick={copy}><LinkIcon size={16}/>{copied ? 'Đã sao chép' : 'Sao chép link'}</button><button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={16}/> In / lưu PDF</button>{isAdmin && <Link className="btn btn-soft btn-sm" to={`/admin/articles/${item.id}`}><Edit3 size={16}/> Chỉnh sửa CMS</Link>}</div></div><Markdown content={item.content}/><div className="reading-feedback"><div><b>Bài viết này có hữu ích với bạn không?</b><p>Đánh giá chỉ hiển thị trong phiên duyệt này, chưa được lưu lên máy chủ.</p></div><div className="feedback-actions"><button className={'btn btn-outline ' + (feedback === 'yes' ? 'active-feedback' : '')} onClick={() => setFeedback('yes')}><ThumbsUp size={17}/> Có, hữu ích</button><button className={'btn btn-outline ' + (feedback === 'no' ? 'active-feedback' : '')} onClick={() => setFeedback('no')}><ThumbsDown size={17}/> Cần bổ sung</button></div></div></article><aside className="toc"><div className="toc-title"><List size={18}/> TRONG BÀI VIẾT</div>{toc.filter(h => h.depth > 1).map(h => <a key={h.id} className={'toc-link depth-' + h.depth} href={'#' + h.id}>{h.title}</a>)}<button className="toc-up" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>↑ Về đầu trang</button></aside></div></main><Footer/></>
}
