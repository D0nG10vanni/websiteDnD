import os
import json
import networkx as nx

# 1. Projekt-Root bestimmen (eine Ebene über diesem Script)
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# 2. Pfade
IN_JSON  = os.path.join(BASE, 'public', 'graph.json')
OUT_JSON = os.path.join(BASE, 'public', 'graph_with_pos.json')

# 3. JSON laden
with open(IN_JSON, encoding='utf8') as f:
    raw = json.load(f)

# 4. Graph bauen wie gehabt…
G = nx.Graph()
for node in raw:
    G.add_node(node['id'])
for node in raw:
    for tgt in node['connections']:
        G.add_edge(node['id'], tgt)

pos = nx.spring_layout(G, k=0.5, iterations=100)

# 5. Ausgabe zusammenbauen
graph_with_pos = []
for node in raw:
    x, y = pos[node['id']]
    graph_with_pos.append({
        'id':          node['id'],
        'connections': node['connections'],
        'x':           float(x),
        'y':           float(y),
    })

# 6. Als UTF-8 speichern
with open(OUT_JSON, 'w', encoding='utf8') as f:
    json.dump(graph_with_pos, f, ensure_ascii=False, indent=2)

print(f"✅ graph_with_pos.json erzeugt unter: {OUT_JSON}")
