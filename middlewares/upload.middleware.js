const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  return cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// Optional upload middleware - handles file uploads optionally (files are not required)
const optionalUpload = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    // Check if request is multipart/form-data
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      // Use multer to handle file uploads (files are optional)
      // If no files are uploaded, req.files will be undefined or empty array
      return upload.array(fieldName, maxCount)(req, res, (err) => {
        if (err) {
          // If multer error, pass it to error handler
          return next(err);
        }
        // Ensure req.files is always an array (even if empty)
        if (!req.files) {
          req.files = [];
        }
        next();
      });
    } else {
      // For JSON requests, skip multer and continue
      req.files = [];
      next();
    }
  };
};

module.exports = { upload, optionalUpload };




