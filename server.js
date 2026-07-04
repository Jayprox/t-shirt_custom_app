const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Where uploaded images live on disk. On Railway, mount a Volume at this
// same path (see README) so images survive redeploys and restarts.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const DATA_FILE = path.join(UPLOAD_DIR, 'images.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function readImages() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.warn('Could not read images.json, starting fresh:', e.message);
    return [];
  }
}

function writeImages(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

// Simple abuse guard since this is a public, unauthenticated demo.
const MAX_IMAGES = 300;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = crypto.randomUUID();
    const ext = (path.extname(file.originalname) || '.png').toLowerCase();
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// List every image anyone has uploaded (shared across all visitors).
app.get('/api/images', (req, res) => {
  res.json(readImages());
});

// Accept a single image upload and add it to the shared list.
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const images = readImages();

  if (images.length >= MAX_IMAGES) {
    fs.unlink(req.file.path, () => {});
    return res.status(429).json({ error: 'Upload limit reached for this demo' });
  }

  const item = {
    id: path.parse(req.file.filename).name,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString()
  };

  images.push(item);
  writeImages(images);
  res.json(item);
});

// Remove a shared image (removes it for everyone).
app.delete('/api/images/:id', (req, res) => {
  const images = readImages();
  const idx = images.findIndex(img => img.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const [removed] = images.splice(idx, 1);
  writeImages(images);

  fs.unlink(path.join(UPLOAD_DIR, removed.filename), () => {});
  res.json({ ok: true });
});

// Basic error handler (bad file type, file too large, etc.)
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`T-shirt designer server running on port ${PORT}`);
  console.log(`Serving uploads from: ${UPLOAD_DIR}`);
});
