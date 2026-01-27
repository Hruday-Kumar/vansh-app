/**
 * 🪷 FILE UPLOAD MIDDLEWARE - Multer Configuration
 */

import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directories exist
const directories = ['memories', 'kathas', 'avatars', 'documents'];
directories.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'documents';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = file.fieldname === 'avatar' ? 'avatars' : 'memories';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'kathas';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'memories';
    }
    
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac',
    'audio/wav',
    'audio/webm',
    'application/pdf',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '50000000'), // 50MB
  },
});

export const uploadMemory = upload.single('file');
export const uploadAudio = upload.single('audio');
export const uploadAvatar = upload.single('avatar');
export const uploadMultiple = upload.array('files', 10);
