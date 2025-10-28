import { env } from 'node:process'
import { Client } from 'minio'

const minioEndpoint = env.MINIO_ENDPOINT || 'localhost'
const minioPort = Number.parseInt(env.MINIO_PORT || '9000')
const minioAccessKey = env.MINIO_ACCESS_KEY || 'minioadmin'
const minioSecretKey = env.MINIO_SECRET_KEY || 'minioadmin'
const minioUseSSL = env.MINIO_USE_SSL === 'true'

export const minioClient = new Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey
})

// Bucket names
export const MINIO_BUCKETS = {
  ASSETS: 'assets',
  AUDIO: 'audio',
  EXPORTS: 'exports',
  THUMBNAILS: 'thumbnails',
  GENERAL: 'general'
} as const

// Initialize buckets
export async function initializeMinIOBuckets(): Promise<void> {
  try {
    for (const bucket of Object.values(MINIO_BUCKETS)) {
      const exists = await minioClient.bucketExists(bucket)
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1')
        console.info(`MinIO bucket created: ${bucket}`)

        // Set bucket policy for public read access for exports
        if (bucket === MINIO_BUCKETS.EXPORTS) {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`]
              }
            ]
          }
          await minioClient.setBucketPolicy(bucket, JSON.stringify(policy))
        }
      }
    }
    console.info('MinIO buckets initialized successfully')
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error)
  }
}
