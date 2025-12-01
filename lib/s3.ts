import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket) throw new Error("Falta AWS_S3_BUCKET en .env");
if (!region) throw new Error("Falta AWS_REGION en .env");
if (!accessKeyId) throw new Error("Falta AWS_ACCESS_KEY_ID en .env");
if (!secretAccessKey)
  throw new Error("Falta AWS_SECRET_ACCESS_KEY en .env");

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * SUBIR ARCHIVO A S3
 */
export async function uploadToS3({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(cmd);

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * ELIMINAR ARCHIVO DE S3
 */
export async function deleteFromS3(key: string) {
  const cmd = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3.send(cmd);

  return true;
}
