import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Save, Send, Eye, FileText, ImagePlus, Download, Upload, Bold, Italic, Link2, List, ListOrdered, Heading1, Heading2, Heading3, Code2, Quote, Table, ArrowLeft, Split, Clock3 } from 'lucide-react'
import { useData } from '../state'
import { AdminLayout, Alert, Empty } from '../components/UI'
import { Markdown } from '../components/Markdown'
import { RichTextEditor } from '../components/RichTextEditor'
import { slugify, humanDate } from '../lib/util'
import '../editor.css'

const blank = {title:'',slug:'',excerpt:'',category_id:'',content:'# Tiêu đề hướng dẫn\n\n## 1. Mục đích\n\nMô tả mục đích của tính năng...\n\n## 2. Điều kiện thực hiện\n\n- Điều kiện 1\n\n## 3. Các bước thực hiện\n\n### Bước 1: ...\n\n## 4. Kết quả\n\n## 5. Lưu ý\n',status:'draft'}
const escapeHtml = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export default function Editor() {
  const { id } = useParams();const [params] = useSearchParams()
  const { supabase, categories, articles, reload } = useData()
  const navigate = useNavigate(); const input = useRef(null), uploadInput = useRef(null)
  const [form,setForm] = useState({...blank,category_id:params.get('category') || ''})
  const [mode,setMode] = useState('split'), [busy,setBusy] = useState(false), [message,setMessage] = useState(''), [imageBusy,setImageBusy] = useState(false)
  const existing = articles.find(a=>a.id === id)
  useEffect(()=> { if (id && existing) setForm({title:existing.title,slug:existing.slug,excerpt:existing.excerpt||'',category_id:existing.category_id,content:existing.content||'',status:existing.status}) },[id,existing?.updated_at])

  const set = (k,v) => setForm(x=>({...x,[k]:v}))
  const command = (name, value) => input.current?.command(name, value)
  const save = async (status='draft') => {
    if (!form.title.trim() || !form.category_id) {setMessage('Cần nhập tiêu đề và chọn chuyên mục trước khi lưu.');return}
    if (!form.content.trim()) {setMessage('Nội dung Markdown không được trống.');return}
    setBusy(true);setMessage('')
    const payload={title:form.title.trim(),slug:slugify(form.slug||form.title),excerpt:form.excerpt.trim(),category_id:form.category_id,content:form.content,status}
    const response = id ? await supabase.from('articles').update(payload).eq('id',id).select().single() : await supabase.from('articles').insert(payload).select().single()
    if(response.error) setMessage('Lỗi lưu bài: '+response.error.message)
    else {
      await reload();setForm(f=>({...f,status,slug:response.data.slug}));
      setMessage(status==='published' ? 'Đã xuất bản. Người xem có thể đọc bài tại cổng tài liệu.' : 'Đã lưu bản nháp. Người xem chưa nhìn thấy bài này.')
      if(!id) navigate(`/admin/articles/${response.data.id}`,{replace:true})
    }
    setBusy(false)
  }
  const addImage = async e => {
    const file=e.target.files?.[0]; if(!file || !supabase) return
    e.target.value='';
    const valid=['image/png','image/jpeg','image/webp','image/gif']
    if(!valid.includes(file.type) || file.size>5*1024*1024) {setMessage('Chỉ hỗ trợ PNG/JPEG/WEBP/GIF và tối đa 5MB.');return}
    setImageBusy(true);setMessage('')
    const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type]
    const fileName=`${crypto.randomUUID()}.${ext}`
    const {error}=await supabase.storage.from('article-images').upload(fileName,file,{upsert:false,contentType:file.type})
    if(error) setMessage('Không tải được ảnh: '+error.message)
    else {const {data}=supabase.storage.from('article-images').getPublicUrl(fileName);const safeName=escapeHtml(file.name);input.current?.insertHtml(`<figure><img src="${data.publicUrl}" alt="${safeName}"><figcaption>${safeName}</figcaption></figure><p><br></p>`);setMessage('Đã tải ảnh và chèn vào bài viết.')}
    setImageBusy(false)
  }
  const importMd=async e=>{const f=e.target.files?.[0];if(f){set('content',await f.text());setMessage('Đã nạp nội dung .md. Nhấn Lưu bản nháp hoặc Xuất bản để ghi dữ liệu lên hệ thống.')}e.target.value=''}
  const downloadMd=()=>{const blob=new Blob([form.content],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(slugify(form.slug||form.title)||'guide')+'.md';a.click();URL.revokeObjectURL(url)}
  const addLink=()=>{const url=window.prompt('Nhập địa chỉ liên kết (URL):','https://');if(url) command('createLink',url)}
  const toolbar=[{label:'Tiêu đề 1',Icon:Heading1,act:()=>command('formatBlock','h1')},{label:'Tiêu đề 2',Icon:Heading2,act:()=>command('formatBlock','h2')},{label:'Tiêu đề 3',Icon:Heading3,act:()=>command('formatBlock','h3')},{label:'Đậm',Icon:Bold,act:()=>command('bold')},{label:'Nghiêng',Icon:Italic,act:()=>command('italic')},{label:'Danh sách',Icon:List,act:()=>command('insertUnorderedList')},{label:'Danh sách số',Icon:ListOrdered,act:()=>command('insertOrderedList')},{label:'Liên kết',Icon:Link2,act:addLink},{label:'Trích dẫn',Icon:Quote,act:()=>command('formatBlock','blockquote')},{label:'Code',Icon:Code2,act:()=>command('formatBlock','pre')},{label:'Bảng',Icon:Table,act:()=>input.current?.insertHtml('<table><thead><tr><th>Trường</th><th>Nội dung</th></tr></thead><tbody><tr><td>Tên trường</td><td>...</td></tr></tbody></table><p><br></p>')}]
  return <AdminLayout title={id ? 'Chỉnh sửa bài viết hướng dẫn' : 'Soạn bài viết mới'} detail="Trình soạn thảo trực quan, tự động chuyển nội dung sang Markdown khi lưu." action={<Link className="btn btn-outline" to="/admin/articles"><ArrowLeft size={17}/> Danh sách bài viết</Link>}>
    {id && !existing && <Alert kind="warning">Không tìm thấy bài viết. Có thể dữ liệu đang tải hoặc bài đã bị xóa.</Alert>}
    {message && <Alert kind={message.startsWith('Lỗi') || message.startsWith('Cần') || message.startsWith('Chỉ') ? 'error':'info'}>{message}</Alert>}
    <div className="editor-metadata panel"><div className="editor-fields"><label>Tiêu đề bài viết <span className="req">*</span><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value,slug:(!id||f.slug===slugify(f.title))?slugify(e.target.value):f.slug}))} placeholder="Ví dụ: Hướng dẫn lập phiếu thu"/></label><label>Đường dẫn (slug)<input value={form.slug} onChange={e=>set('slug',e.target.value)} placeholder="huong-dan-lap-phieu-thu"/></label><label>Chuyên mục <span className="req">*</span><select value={form.category_id} onChange={e=>set('category_id',e.target.value)}><option value="">— Chọn chuyên mục —</option>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label className="span-full">Mô tả ngắn<input value={form.excerpt} onChange={e=>set('excerpt',e.target.value)} placeholder="Giới thiệu ngắn hiển thị ở trang chủ và trang chi tiết"/></label></div><div className="editor-meta-footer"><span className={'status '+form.status}>{form.status==='published'?'Đã xuất bản':'Bản nháp'}</span>{existing?.published_at && <span><Clock3 size={15}/> Ngày đăng: {humanDate(existing.published_at)}</span>}<div className="editor-save-buttons"><button className="btn btn-outline" disabled={busy||imageBusy} onClick={()=>save('draft')}><Save size={17}/> Lưu bản nháp</button><button className="btn btn-primary" disabled={busy||imageBusy} onClick={()=>save('published')}><Send size={17}/>{busy?'Đang lưu...':'Xuất bản bài viết'}</button></div></div></div>
    <div className="panel editor-panel"><div className="editor-top"><div className="editor-tabs"><button className={mode==='edit'?'active':''} onClick={()=>setMode('edit')}><FileText size={17}/> Soạn thảo</button><button className={mode==='preview'?'active':''} onClick={()=>setMode('preview')}><Eye size={17}/> Xem trước</button><button className={mode==='split'?'active':''} onClick={()=>setMode('split')}><Split size={17}/> Hai cột</button></div><div className="editor-extras"><label className="btn btn-soft btn-sm" title="Nhập file Markdown"><Upload size={16}/> Nhập .md<input type="file" accept=".md,.markdown,text/markdown,text/plain" hidden onChange={importMd}/></label><button className="btn btn-soft btn-sm" onClick={downloadMd}><Download size={16}/> Xuất .md</button><button className="btn btn-outline btn-sm" disabled={imageBusy} onClick={()=>uploadInput.current?.click()}><ImagePlus size={16}/>{imageBusy?'Đang tải ảnh...':'Chèn ảnh'}</button><input ref={uploadInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={addImage}/></div></div>{mode!=='preview' && <div className="markdown-toolbar">{toolbar.map(({label,Icon,act})=><button type="button" title={label} aria-label={label} key={label} onMouseDown={e=>e.preventDefault()} onClick={act}><Icon size={17}/></button>)}</div>}<div className={'editor-workspace '+(mode==='split'?'split-editor':'')}>
      {mode!=='preview' && <div className="editor-input"><div className="editor-pane-label">NỘI DUNG BÀI VIẾT</div><RichTextEditor ref={input} value={form.content} onChange={value=>set('content',value)}/></div>}
      {mode!=='edit' && <div className="editor-preview"><div className="editor-pane-label">XEM TRƯỚC NỘI DUNG</div><div className="preview-scroll"><Markdown content={form.content}/></div></div>}
    </div><p className="editor-hint">Soạn nội dung trực tiếp như trong Word. Hệ thống tự động chuyển sang Markdown khi lưu hoặc xuất file <code>.md</code>.</p></div>
  </AdminLayout>
}
