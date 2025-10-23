import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type IncomingFilePayload = {
  name: string;
  type: string | null | undefined;
  data: string;
};

const EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/gif': '.gif',
};

const sanitizeExtension = (value: string | null | undefined): string => {
  if (!value) return '';
  const normalized = value.startsWith('.') ? value.toLowerCase() : `.${value.toLowerCase()}`;
  if (/^[.][a-z0-9]+$/.test(normalized)) return normalized;
  return '';
};

const inferExtension = (file: IncomingFilePayload): string => {
  const fromName = sanitizeExtension(path.extname(file.name || ''));
  if (fromName) return fromName;
  const fromType = sanitizeExtension(EXTENSION_MAP[file.type ?? ''] ?? '');
  if (fromType) return fromType;
  return '.bin';
};

const ensureDirectory = async (targetDir: string) => {
  await mkdir(targetDir, { recursive: true });
};

export const saveBase64File = async (
  file: IncomingFilePayload,
  options: { folder?: string } = {},
): Promise<string> => {
  const folder = options.folder ?? 'documents';
  const extension = inferExtension(file);
  const uploadsRoot = path.resolve('uploads');
  const targetDir = path.join(uploadsRoot, folder);
  await ensureDirectory(targetDir);

  const baseName = path.basename(file.name || 'document', path.extname(file.name || 'document'));
  const safeName = baseName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'document';
  const filename = `${safeName}-${randomUUID()}${extension}`;
  const targetPath = path.join(targetDir, filename);

  const base64Data = file.data.includes(',') ? file.data.split(',').pop() ?? '' : file.data;
  if (!base64Data) {
    throw new Error('FILE_DATA_EMPTY');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  await writeFile(targetPath, buffer);

  return `/uploads/${folder}/${filename}`;
};
