const pool = require('../db/postgres')
const { minioClient, BUCKET, getPublicUrl } = require('../db/minio')
const { v4: uuidv4 } = require('uuid')
const { Readable } = require('stream')

function mapMedia(row) {
  return {
    id: row.id, type: row.type, url: row.url, thumbnailUrl: row.thumbnail_url,
    title: row.title, description: row.description,
    date: row.date ? row.date.toISOString().split('T')[0] : null,
    personId: row.person_id, uploadedBy: row.uploaded_by,
    createdAt: row.created_at.toISOString(),
  }
}

const resolvers = {
  Query: {
    media: async (_, { personId }) => {
      const query = personId
        ? 'SELECT * FROM media WHERE person_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM media ORDER BY created_at DESC'
      const params = personId ? [personId] : []
      const { rows } = await pool.query(query, params)
      return rows.map(mapMedia)
    },
    mediaItem: async (_, { id }) => {
      const { rows } = await pool.query('SELECT * FROM media WHERE id = $1', [id])
      return rows[0] ? mapMedia(rows[0]) : null
    },
  },
  Mutation: {
    uploadMedia: async (_, { input }, context) => {
      let url = `https://placeholder.heritage.fr/${input.title}`

      if (input.fileBase64 && input.fileName) {
        const buffer = Buffer.from(input.fileBase64, 'base64')
        const objectName = `${uuidv4()}-${input.fileName}`
        const stream = Readable.from(buffer)
        await minioClient.putObject(BUCKET, objectName, stream, buffer.length, { 'Content-Type': input.mimeType || 'application/octet-stream' })
        url = getPublicUrl(objectName)
      }

      const { rows } = await pool.query(
        'INSERT INTO media (type, url, title, description, date, person_id, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [input.type, url, input.title, input.description || null, input.date || null, input.personId || null, context.userId || null]
      )
      return mapMedia(rows[0])
    },
    deleteMedia: async (_, { id }) => {
      const { rows } = await pool.query('SELECT url FROM media WHERE id = $1', [id])
      if (rows[0]) {
        try {
          const objectName = rows[0].url.split('/').pop()
          await minioClient.removeObject(BUCKET, objectName)
        } catch {}
        await pool.query('DELETE FROM media WHERE id = $1', [id])
      }
      return true
    },
    associateMedia: async (_, { mediaId, personId }) => {
      const { rows } = await pool.query('UPDATE media SET person_id = $1 WHERE id = $2 RETURNING *', [personId, mediaId])
      return mapMedia(rows[0])
    },
  },
  Media: {
    __resolveReference: async (ref) => {
      const { rows } = await pool.query('SELECT * FROM media WHERE id = $1', [ref.id])
      return rows[0] ? mapMedia(rows[0]) : null
    },
    person: async (media) => {
      if (!media.personId) return null
      // Return minimal person info — full data via service-tree
      return { id: media.personId, firstName: '', lastName: '' }
    },
  },
}

module.exports = resolvers

