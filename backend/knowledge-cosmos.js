// Cosmos DB + Azure OpenAI embeddings helper
// Follows Azure Cosmos DB best practices: singleton client, retries, hierarchical partition keys, and vector search
import 'dotenv/config'
import { CosmosClient } from '@azure/cosmos'

const {
  COSMOS_ENDPOINT,
  COSMOS_KEY,
  COSMOS_DB = 'hvac_knowledge',
  COSMOS_CONTAINER = 'knowledge',
  COSMOS_TENANT = 'public',
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT = 'text-embedding-3-small',
  AZURE_OPENAI_API_VERSION = '2024-02-15-preview',
} = process.env

if (!COSMOS_ENDPOINT || !COSMOS_KEY) {
  console.warn('[knowledge-cosmos] Missing COSMOS_ENDPOINT/COSMOS_KEY – vector features will be disabled until configured.')
}
if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
  console.warn('[knowledge-cosmos] Missing AZURE_OPENAI_* configuration – embeddings will fail until configured.')
}

let client
function getClient() {
  if (!client) {
    client = new CosmosClient({ endpoint: COSMOS_ENDPOINT, key: COSMOS_KEY })
  }
  return client
}

export async function ensureCosmos() {
  if (!COSMOS_ENDPOINT || !COSMOS_KEY) return { enabled: false }
  const c = getClient()
  // Create database if not exists
  const { database } = await c.databases.createIfNotExists({ id: COSMOS_DB })

  // Create container with Hierarchical Partition Keys and vector policy if not exists
  const { container } = await database.containers.createIfNotExists({
    id: COSMOS_CONTAINER,
    partitionKey: {
      // HPK: tenant -> source
      kind: 'MultiHash',
      paths: ['/tenantId', '/source'],
    },
    // Vector policy: store embeddings at path /vector
    vectorEmbeddingPolicy: {
      vectorEmbeddings: [
        {
          path: '/vector',
          dataType: 'float32',
          distanceFunction: 'cosine',
          dimensions: 1536,
        },
      ],
    },
    indexingPolicy: {
      indexingMode: 'consistent',
      includedPaths: [
        { path: '/*' },
      ],
    },
  })
  return { enabled: true, database, container }
}

async function embed(text) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    throw new Error('Embeddings not configured')
  }
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`
  // Retry basic 429 handling using exponential backoff
  let attempt = 0
  while (true) {
    attempt++
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({ input: text }),
    })
    if (resp.status === 429 && attempt <= 3) {
      const retryAfter = parseInt(resp.headers.get('retry-after') || '1', 10)
      await new Promise(r => setTimeout(r, (retryAfter || attempt) * 1000))
      continue
    }
    if (!resp.ok) {
      const msg = await resp.text().catch(()=> '')
      throw new Error(`Embeddings error ${resp.status}: ${msg}`)
    }
    const json = await resp.json()
    return json.data?.[0]?.embedding
  }
}

export async function upsertDocuments(docs) {
  const { enabled } = await ensureCosmos()
  if (!enabled) throw new Error('Cosmos not configured')
  const c = getClient()
  const container = c.database(COSMOS_DB).container(COSMOS_CONTAINER)

  const results = []
  for (const doc of docs) {
    const text = (doc.text || '').slice(0, 8000)
    const vector = await embed(text)
    const item = {
      id: doc.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tenantId: doc.tenantId || COSMOS_TENANT,
      source: doc.source || 'internal',
      url: doc.url || null,
      title: doc.title || (doc.source ? `${doc.source} doc` : 'doc'),
      lang: doc.lang || 'sl',
      text,
      vector,
      createdAt: new Date().toISOString(),
    }
    const { resource } = await container.items.upsert(item)
    results.push(resource)
  }
  return results
}

export async function vectorSearch({ query, k = 5, sources = [], tenantId = COSMOS_TENANT }) {
  const { enabled } = await ensureCosmos()
  if (!enabled) throw new Error('Cosmos not configured')
  const c = getClient()
  const container = c.database(COSMOS_DB).container(COSMOS_CONTAINER)

  const qv = await embed(query)
  const params = [
    { name: '@qv', value: qv },
    { name: '@tenantId', value: tenantId },
  ]
  let filterSrc = ''
  if (sources && sources.length > 0) {
    filterSrc = ' AND ARRAY_CONTAINS(@sources, c.source)'
    params.push({ name: '@sources', value: sources })
  }

  const sql = `SELECT TOP ${k} c.id, c.title, c.url, c.source, c.text, VectorDistance(c.vector, @qv) AS score
    FROM c WHERE c.tenantId = @tenantId${filterSrc}
    ORDER BY score ASC`

  const it = container.items.query({ query: sql, parameters: params }, { enableCrossPartitionQuery: true })
  const results = (await it.fetchAll()).resources || []
  return results.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    source: r.source,
    text: r.text,
    score: r.score,
  }))
}

export function sourceLabelToKey(label) {
  // Normalize UI labels to source keys
  const map = {
    'Annex 1': 'annex1',
    'ISO': 'iso',
    'MHRA': 'mhra',
    'PIC/S': 'pics',
    'WHO': 'who',
    'FDA': 'fda',
    'Internal': 'internal',
  }
  return map[label] || label?.toLowerCase?.() || 'internal'
}

export default {
  ensureCosmos,
  upsertDocuments,
  vectorSearch,
  sourceLabelToKey,
}
