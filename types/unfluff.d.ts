declare module 'unfluff' {
  interface UnfluffData {
    title?: string
    text?: string
    description?: string
    author?: string | string[]
    publisher?: string
    image?: string
    date?: string
    lang?: string
    favicon?: string
    canonicalLink?: string
    tags?: string[]
    videos?: any[]
  }

  function unfluff(html: string, language?: string): UnfluffData
  export = unfluff
}


