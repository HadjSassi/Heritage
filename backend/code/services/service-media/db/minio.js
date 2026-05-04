const Minio = require('minio')

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'heritage_access',
  secretKey: process.env.MINIO_SECRET_KEY || 'heritage_secret',
})

const BUCKET = process.env.MINIO_BUCKET || 'heritage-media'

async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET)
  if (!exists) {
    await minioClient.makeBucket(BUCKET, 'us-east-1')
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify({
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${BUCKET}/*`] }],
    }))
    console.log(`✅ MinIO bucket "${BUCKET}" created`)
  }
}

function getPublicUrl(objectName) {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
  const port = process.env.MINIO_PORT || '9000'
  return `http://${endpoint}:${port}/${BUCKET}/${objectName}`
}

module.exports = { minioClient, BUCKET, ensureBucket, getPublicUrl }

