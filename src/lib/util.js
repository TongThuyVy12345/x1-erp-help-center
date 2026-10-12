export function slugify(input = '') {
  return input.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'bai-viet'
}
export function humanDate(value) {
  if (!value) return 'Chưa đăng'
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
export function minutesToRead(text = '') { return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220)) }
export function cleanSearch(value = '') { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase() }
export function getChildren(categories, parentId = null) {
  return categories.filter(c => c.parent_id === parentId).sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'vi'))
}
export function descendants(categories, id) {
  const result = new Set(); const walk = (x) => { for (const c of categories.filter(t => t.parent_id === x)) { result.add(c.id); walk(c.id) } }
  walk(id); return result
}
export function familyIds(categories, id) { return new Set([id, ...descendants(categories, id)]) }
export function headings(md = '') {
  const seen = new Map();
  return md.split('\n').flatMap(line => {
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (!match) return []
    const title = match[2].replace(/\*|`|_/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    const key = slugify(title); const n = seen.get(key) || 0; seen.set(key, n + 1)
    return [{ title, depth: match[1].length, id: n ? `${key}-${n}` : key }]
  })
}
