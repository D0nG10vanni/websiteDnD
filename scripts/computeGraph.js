#!/usr/bin/env node
/**
 * scripts/computeGraph.js
 *
 * Liest public/graph.json, berechnet Force-Directed-Layout über d3-force
 * und schreibt public/graph_with_pos.json
 */

require('dotenv').config()

const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const { forceSimulation, forceManyBody, forceLink, forceCenter } = require('d3-force')

// Pfade
const IN_PATH  = path.resolve(process.cwd(), 'public', 'graph.json')
const OUT_PATH = path.resolve(process.cwd(), 'public', 'graph_with_pos.json')

// 1) Rohdaten laden
const raw = JSON.parse(readFileSync(IN_PATH, 'utf8'))

// 2) Knoten & Kanten für Simulation vorbereiten
const nodes = raw.map(node => ({ id: node.id }))
const links = raw.flatMap(node =>
  node.connections.map(target => ({ source: node.id, target }))
)

// 3) Simulation konfigurieren
const sim = forceSimulation(nodes)
  .force('link', forceLink(links).id(d => d.id).distance(100).strength(1))
  .force('charge', forceManyBody().strength(-200))
  .force('center', forceCenter(0, 0))
  .stop()

// 4) Festes Ticking (z. B. 300 Iterationen)
sim.tick(300)

// 5) Ausgabe-Array zusammenbauen
const graphWithPos = raw.map(node => {
  const found = nodes.find(n => n.id === node.id)
  return {
    id:          node.id,
    connections: node.connections,
    x:           found.x,
    y:           found.y
  }
})

// 6) In public/graph_with_pos.json speichern
writeFileSync(OUT_PATH, JSON.stringify(graphWithPos, null, 2), 'utf8')
console.log(`✅ public/graph_with_pos.json erzeugt unter: ${OUT_PATH}`)
