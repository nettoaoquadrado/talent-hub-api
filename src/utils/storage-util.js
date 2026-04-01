const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const config = require('../config/config');
const { AppException, NotFoundException } = require('./app-exception');

const s3ClientConfig = {
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
};

if (config.s3.endpoint) {
  s3ClientConfig.endpoint = config.s3.endpoint;
  s3ClientConfig.forcePathStyle = true;
}

const s3Client = new S3Client(s3ClientConfig);

const BUCKET_NAME = config.s3.bucketName;

async function upload(key, body, contentType = 'application/octet-stream') {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const protocol = config.app.env === 'production' ? 'https' : 'http';
    return `${protocol}://${config.app.host}:${config.app.port}/files/${key}`;
  } catch (error) {
    throw new AppException(`Erro ao fazer upload: ${error.message}`, 500, 'STORAGE_ERROR');
  }
}

function streamToBuffer(stream) {
  if (stream instanceof Readable) {
    const chunks = [];
    return (async () => {
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    })();
  }
  if (stream instanceof Uint8Array) return Promise.resolve(Buffer.from(stream));
  if (typeof stream === 'string') return Promise.resolve(Buffer.from(stream, 'utf8'));
  if (stream && typeof stream.transformToByteArray === 'function') {
    return stream.transformToByteArray().then((arr) => Buffer.from(arr));
  }
  return (async () => {
    const readable = Readable.from(/** @type {any} */ (stream));
    const chunks = [];
    for await (const chunk of readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  })();
}

async function getFile(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);
    const buffer = await streamToBuffer(result.Body);
    const contentType = result.ContentType ?? 'application/octet-stream';

    return { buffer, contentType };
  } catch (error) {
    const isNotFound =
      error.name === 'NoSuchKey' || error.Code === 'NoSuchKey';
    if (isNotFound) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    throw new AppException(`Erro ao obter arquivo: ${error.message}`, 500, 'STORAGE_ERROR');
  }
}

async function download(key) {
  try {
    const { buffer } = await getFile(key);
    return buffer;
  } catch (error) {
    throw new AppException(`Erro ao fazer download: ${error.message}`, 500, 'STORAGE_ERROR');
  }
}

module.exports = {
  upload,
  download,
  getFile,
  streamToBuffer,
};
