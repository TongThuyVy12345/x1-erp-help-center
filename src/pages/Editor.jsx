import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, Save, Send, Eye, FileText, ImagePlus, Download, Upload, Bold, Italic, Link2, List, ListOrdered, Heading1, Heading2, Heading3, Code2, Quote, Table, Rows3, ArrowLeft, CheckCircle2, AlertCircle, Split, Clock3 } from 'lucide-react'
import { useData } from '../state'
import { AdminLayout, Alert, Empty } from '../components/UI'
import { Markdown } from '../components/Markdown'
import { slugify, humanDate } from '../lib/util'

const blank = {title:'',slug:'',excerpt:'',category_id:'',content:'# Tiêu đề hướng dẫn\n\n## 1. Mục đích\n\nMô tả mục đích của tính năng...\n\n## 2. Điều kiện thực hiện\n\n- Điều kiện 1\n\n## 3. Các bước thực hiện\n\n### Bước 1: ...\n\n## 4. Kết quả\n\n## 5. Lưu ý\n',status:'draft'}
export default function Editor() {
  const { id } = useParams();const [params] = useSearchParams()
  const { supabase, categories, articles, reload } = useData()
  const navigate = useNavigate(); const input = useRef(null), uploadInput = useRef(null)
  const [form,setForm] = useState({...blank,category_id:params.get('category') || ''})
  const [mode,setMode] = useState('split'), [busy,setBusy] = useState(false), [message,setMessage] = useState(''), [imageBusy,setImageBusy] = useState(false)
  const existing = articles.find(a=>a.id === id)
  useEffect(()=> { if (id && existing) setForm({title:existing.title,slug:existing.slug,excerpt:existing.excerpt||'',category_id:existing.category_id,content:existing.content||'',status:existing.status}) },[id,existing?.updated_at])

  const set = (k,v) => setForm(x=>({...x,[k]:v}))
  const apply = (prefix, suffix = '', placeholder = 'Nội dung') => {
    const el=input.current; if (!el) {set('content',form.content+'\n'+prefix+placeholder+suffix);return}
    const start=el.selectionStart,end=el.selectionEnd
    const selection=form.content.slice(start,end)||placeholder
    const updated=form.content.slice(0,start)+prefix+selection+suffix+form.content.slice(end)
    set('content',updated)
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(start+prefix.length,start+prefix.length+selection.length)})
  }
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
    else {const {data}=supabase.storage.from('article-images').getPublicUrl(fileName);apply(`\n![${file.name}](${data.publicUrl})\n`,'','');setMessage('Đã tải ảnh và chèn Markdown vào bài viết.')}
    setImageBusy(false)
  }
  const importMd=async e=>{const f=e.target.files?.[0];if(f){set('content',await f.text());setMessage('Đã nạp nội dung .md. Nhấn Lưu bản nháp hoặc Xuất bản để ghi dữ liệu lên hệ thống.')}e.target.value=''}
  const downloadMd=()=>{const blob=new Blob([form.content],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(slugify(form.slug||form.title)||'guide')+'.md';a.click();URL.revokeObjectURL(url)}
  const toolbar=[{label:'H1',Icon:Heading1,act:()=>apply('# ','','Tiêu đề')},{label:'H2',Icon:Heading2,act:()=>apply('## ','','Mục')},{label:'H3',Icon:Heading3,act:()=>apply('### ','','Bước')},{label:'Đậm',Icon:Bold,act:()=>apply('**','**')},{label:'Nghiêng',Icon:Italic,act:()=>apply('*','*')},{label:'Danh sách',Icon:List,act:()=>apply('- ','','Mục')},{label:'Danh sách số',Icon:ListOrdered,act:()=>apply('1. ','','Bước')},{label:'Liên kết',Icon:Link2,act:()=>apply('[','](https://example.com)','Tên liên kết')},{label:'Trích dẫn',Icon:Quote,act:()=>apply('> ','','Lưu ý')},{label:'Code',Icon:Code2,act:()=>apply('`','`','code')},{label:'Bảng',Icon:Table,act:()=>apply('\n| Trường | Nội dung |\n|---|---|\n| ',' | ... |\n','Tên trường')}]
  return <AdminLayout title={id ? 'Chỉnh sửa bài viết hướng dẫn' : 'Soạn bài viết mới'} detail="Trình soạn thảo Markdown, xem trước trực tiếp và đăng lên cổng người xem." action={<Link className="btn btn-outline" to="/admin/articles"><ArrowLeft size={17}/> Danh sách bài viết</Link>}>
    {id && !existing && <Alert kind="warning">Không tìm thấy bài viết. Có thể dữ liệu đang tải hoặc bài đã bị xóa.</Alert>}
    {message && <Alert kind={message.startsWith('Lỗi') || message.startsWith('Cần') || message.startsWith('Chỉ') ? 'error':'info'}>{message}</Alert>}
    <div className="editor-metadata panel"><div className="editor-fields"><label>Tiêu đề bài viết <span className="req">*</span><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value,slug:(!id||f.slug===slugify(f.title))?slugify(e.target.value):f.slug}))} placeholder="Ví dụ: Hướng dẫn lập phiếu thu"/></label><label>Đường dẫn (slug)<input value={form.slug} onChange={e=>set('slug',e.target.value)} placeholder="huong-dan-lap-phieu-thu"/></label><label>Chuyên mục <span className="req">*</span><select value={form.category_id} onChange={e=>set('category_id',e.target.value)}><option value="">— Chọn chuyên mục —</option>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label className="span-full">Mô tả ngắn<input value={form.excerpt} onChange={e=>set('excerpt',e.target.value)} placeholder="Giới thiệu ngắn hiển thị ở trang chủ và trang chi tiết"/></label></div><div className="editor-meta-footer"><span className={'status '+form.status}>{form.status==='published'?'Đã xuất bản':'Bản nháp'}</span>{existing?.published_at && <span><Clock3 size={15}/> Ngày đăng: {humanDate(existing.published_at)}</span>}<div className="editor-save-buttons"><button className="btn btn-outline" disabled={busy||imageBusy} onClick={()=>save('draft')}><Save size={17}/> Lưu bản nháp</button><button className="btn btn-primary" disabled={busy||imageBusy} onClick={()=>save('published')}><Send size={17}/>{busy?'Đang lưu...':'Xuất bản bài viết'}</button></div></div></div>
    <div className="panel editor-panel"><div className="editor-top"><div className="editor-tabs"><button className={mode==='edit'?'active':''} onClick={()=>setMode('edit')}><FileText size={17}/> Soạn thảo</button><button className={mode==='preview'?'active':''} onClick={()=>setMode('preview')}><Eye size={17}/> Xem trước</button><button className={mode==='split'?'active':''} onClick={()=>setMode('split')}><Split size={17}/> Hai cột</button></div><div className="editor-extras"><label className="btn btn-soft btn-sm" title="Nhập file Markdown"><Upload size={16}/> Nhập .md<input type="file" accept=".md,.markdown,text/markdown,text/plain" hidden onChange={importMd}/></label><button className="btn btn-soft btn-sm" onClick={downloadMd}><Download size={16}/> Xuất .md</button><button className="btn btn-outline btn-sm" disabled={imageBusy} onClick={()=>uploadInput.current?.click()}><ImagePlus size={16}/>{imageBusy?'Đang tải ảnh...':'Chèn ảnh'}</button><input ref={uploadInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={addImage}/></div></div>{mode!=='preview' && <div className="markdown-toolbar">{toolbar.map(({label,Icon,act})=><button title={label} aria-label={label} key={label} onClick={act}><Icon size={17}/></button>)}</div>}<div className={'editor-workspace '+(mode==='split'?'split-editor':'')}>
      {mode!=='preview' && <div className="editor-input"><div className="editor-pane-label">MARKDOWN</div><textarea ref={input} spellCheck={false} value={form.content} onChange={e=>set('content',e.target.value)} placeholder="# Tiêu đề hướng dẫn\n\n## 1. Mục đích..."/></div>}
      {mode!=='edit' && <div className="editor-preview"><div className="editor-pane-label">XEM TRƯỚC NỘI DUNG</div><div className="preview-scroll"><Markdown content={form.content}/></div></div>}
    </div><p className="editor-hint">Mẹo: Dùng <code>#</code>, <code>##</code>, <code>###</code> tạo tiêu đề; <code>![Chú thích](URL)</code> chèn ảnh. Lưu / xuất bản mới đồng bộ bài viết lên website.</p></div>
  </AdminLayout>
}
