import sanitizeHtml from 'sanitize-html'

export const sanitizeString = (value: string): string => {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()
}
