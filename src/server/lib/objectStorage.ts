import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  contentType: string;
  sizeBytes: number;
}

const toBool = (value?: string) => value === 'true' || value === '1';

const getS3Config = () => {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || 'fsn1';
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const forcePathStyle = toBool(process.env.S3_FORCE_PATH_STYLE);
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    endpoint,
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    publicBaseUrl,
  };
};

const buildPublicUrl = (endpoint: string, bucket: string, key: string, forcePathStyle: boolean, publicBaseUrl?: string) => {
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  const url = new URL(endpoint);
  if (forcePathStyle) {
    return `${url.origin}/${bucket}/${key}`;
  }

  return `${url.protocol}//${bucket}.${url.host}/${key}`;
};

export async function uploadToObjectStorage(buffer: Buffer, key: string, contentType: string): Promise<UploadResult | null> {
  const config = getS3Config();
  if (!config) {
    return null;
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });

  await client.send(command);

  return {
    key,
    url: buildPublicUrl(config.endpoint, config.bucket, key, config.forcePathStyle, config.publicBaseUrl),
    bucket: config.bucket,
    contentType,
    sizeBytes: buffer.length,
  };
}
