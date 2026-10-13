import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })
turndown.use(gfm)
turndown.addRule('figures', {
  filter: 'figure',
  replacement: (_content, node) => {
    const image = node.querySelector('img')
    if (!image) return ''
    const alt = (image.alt || '').replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]')
    const src = (image.getAttribute('src') || '').replaceAll('\\', '%5C').replaceAll('<', '%3C').replaceAll('>', '%3E')
    // Angle brackets preserve URLs containing spaces or parentheses when the
    // visual editor converts its HTML back to Markdown.
    return `\n\n![${alt}](<${src}>)\n\n`
  }
})

export function markdownToHtml(markdown) {
  const doc = new DOMParser().parseFromString(marked.parse(markdown || '', { gfm: true, breaks: true }), 'text/html')
  doc.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove())
  doc.body.querySelectorAll('*').forEach(node => [...node.attributes].forEach(attribute => {
    const name = attribute.name.toLowerCase(), value = attribute.value.trim().toLowerCase()
    if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) node.removeAttribute(attribute.name)
  }))
  return doc.body.innerHTML
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html || '').trim()
}

export const RichTextEditor = forwardRef(function RichTextEditor({ value = '', onChange }, ref) {
  const editor = useRef(null), lastMarkdown = useRef('')
  const sync = () => {
    if (!editor.current) return
    const markdown = htmlToMarkdown(editor.current.innerHTML)
    lastMarkdown.current = markdown
    onChange(markdown)
  }
  useEffect(() => {
    if (!editor.current || value === lastMarkdown.current) return
    editor.current.innerHTML = markdownToHtml(value)
    lastMarkdown.current = value
  }, [value])
  useImperativeHandle(ref, () => ({
    command(command, argument = null) { editor.current?.focus(); document.execCommand(command, false, argument); sync() },
    insertHtml(html) { editor.current?.focus(); document.execCommand('insertHTML', false, html); sync() }
  }))
  const pastePlainText = event => {
    event.preventDefault()
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'))
  }
  return <div ref={editor} className="rich-text-input markdown-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder="Bắt đầu viết nội dung bài hướng dẫn..." onInput={sync} onBlur={sync} onPaste={pastePlainText}/>
})
