import React from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { slugify } from '../lib/util'

const safeImageDataUrl = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/]+=*$/i
const markdownSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    // `data` is still validated by urlTransform below and is only accepted on
    // image src attributes for the bitmap formats supported by the editor.
    src: [...(defaultSchema.protocols?.src || []), 'data']
  }
}

function safeUrlTransform(url, key, node) {
  if (key === 'src' && node.tagName === 'img' && safeImageDataUrl.test(url)) return url
  return defaultUrlTransform(url)
}

function plain(children) { return React.Children.toArray(children).map(ch => typeof ch === 'string' ? ch : (ch?.props?.children ? plain(ch.props.children) : '')).join('') }
export function Markdown({ content = '' }) {
  const seen = new Map()
  const heading = (Tag) => function Heading({ children, ...props }) {
    const base = slugify(plain(children)); const n = seen.get(base) || 0; seen.set(base, n + 1)
    return <Tag id={n ? `${base}-${n}` : base} {...props}>{children}</Tag>
  }
  return <div className="markdown-body"><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, markdownSchema]]} urlTransform={safeUrlTransform}
    components={{
      h1: heading('h1'), h2: heading('h2'), h3: heading('h3'),
      // The CMS preview uses its own scroll container. Lazy images can remain
      // unloaded there even after their placeholder becomes visible.
      img: ({ src, alt }) => <figure><img src={src} alt={alt || 'Ảnh minh họa'} decoding="async"/>{alt && <figcaption>{alt}</figcaption>}</figure>,
      a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className="table-scroll"><table>{children}</table></div>
    }}>{content}</ReactMarkdown></div>
}
