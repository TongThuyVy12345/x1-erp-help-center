import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { slugify } from '../lib/util'

function plain(children) { return React.Children.toArray(children).map(ch => typeof ch === 'string' ? ch : (ch?.props?.children ? plain(ch.props.children) : '')).join('') }
export function Markdown({ content = '' }) {
  const seen = new Map()
  const heading = (Tag) => function Heading({ children, ...props }) {
    const base = slugify(plain(children)); const n = seen.get(base) || 0; seen.set(base, n + 1)
    return <Tag id={n ? `${base}-${n}` : base} {...props}>{children}</Tag>
  }
  return <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}
    components={{
      h1: heading('h1'), h2: heading('h2'), h3: heading('h3'),
      img: ({ src, alt }) => <figure><img src={src} alt={alt || 'Ảnh minh họa'} loading="lazy"/><figcaption>{alt}</figcaption></figure>,
      a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className="table-scroll"><table>{children}</table></div>
    }}>{content}</ReactMarkdown></div>
}
