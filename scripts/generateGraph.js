#!/usr/bin/env node
/**
 * scripts/generateGraph.js
 *
 * Holt alle Posts aus Supabase, extrahiert Link-Syntax [[…]] und schreibt public/graph.json
 */

require('dotenv').config()

const { writeFileSync } = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Supabase-Admin-Client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Bitte SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in der Umgebung setzen.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Regex zum Extrahieren von [[Link|Alias]]
const LINK_REGEX = /\[\[([^\|\]]+)(?:\|[^\]]+)?\]\]/g

;(async () => {
  try {
    // 1) Alle Posts (id + content) laden
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, content')

    if (error) throw error

    // 2) Graph-Array bauen
    const graph = (posts || []).map(post => {
      const text = post.content || ''
      const links = []
      let m
      while ((m = LINK_REGEX.exec(text))) {
        links.push(m[1].trim())
      }
      return {
        id: String(post.id),
        connections: Array.from(new Set(links))
      }
    })

    // 3) In public/graph.json speichern
    const outPath = path.resolve(process.cwd(), 'public', 'graph.json')
    writeFileSync(outPath, JSON.stringify(graph, null, 2), 'utf8')
    console.log(`✅ public/graph.json erzeugt unter: ${outPath}`)
  } catch (err) {
    console.error('❌ Fehlschlag beim Generieren des Graphen:', err)
    process.exit(1)
  }
})()
