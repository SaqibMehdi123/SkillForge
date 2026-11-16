/**
 * Unified multer image-upload configuration (audit fixes S1 + C7 consolidation).
 *
 * Before this module there were FOUR divergent copies of upload config
 * (userRoutes, messageRoutes, mediaRoutes, practiceRoutes). The avatar and
 * message copies kept client-controlled extensions, so `evil.html` uploaded
 * with a spoofed `image/png` mimetype was stored as `avatar-*.html` and
 * served same-origin as text/html - stored XSS on the API origin. SVG was
 * also accepted (`image/svg+xml` starts with "image/"), which executes
 * scripts when opened directly.
 *
 * This module enforces, for every uploader:
 *   1. mimetype ALLOWLIST (png/jpeg/gif/webp) - no SVG, no text/*,
 *   2. filename ALWAYS generated server-side (uuid + ext derived from the
 *      allowlisted mimetype) - client input never touches the write path,
 *   3. per-context size cap,
 *   4. absolute destination resolved from this file (cwd-independent).
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const MIMETYPE_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

/**
 * @param {Object} options
 * @param {string} options.dir       - directory under server/ (e.g. 'uploads/avatars')
 * @param {number} [options.maxSizeMb] - file size cap in megabytes
 */
function imageUpload({ dir, maxSizeMb = 5 }) {
  const uploadDir = path.resolve(__dirname, '..', dir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = MIMETYPE_TO_EXT[file.mimetype];
      if (!ext) {
        // The fileFilter runs before filename, so this is a belt-and-braces guard.
        return cb(new Error('Unsupported image type'), false);
      }
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMb * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype && MIMETYPE_TO_EXT[file.mimetype]) {
        cb(null, true);
      } else {
        cb(new Error('Only PNG, JPEG, GIF or WebP images are allowed'), false);
      }
    },
  });
}

/**
 * Translate multer errors into 4xx responses instead of leaking a 500 stack.
 * Must be placed directly after upload.single(...) in the route chain.
 */
function handleUploadError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
}

module.exports = { imageUpload, handleUploadError, MIMETYPE_TO_EXT };
