import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 3000 * 1024 * 1024 }, // 3000 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mpeg",
      "video/mp4",
      "audio/mpeg",
      "audio/mp3",
      "video/x-matroska",
      "audio/mpeg",
      "application/zip",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("File type not allowed") as unknown as null, false);
    }
    cb(null, true);
  },
});

// upload single image
const profileImage = upload.single("profileImage");
const coverPhoto = upload.single("coverPhoto");

// upload multiple image
const uploadMultiple = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "classVideo", maxCount: 1 },
  { name: "galleryImages", maxCount: 5 },
  { name: "profileImage", maxCount: 1 },
  { name: "galleryImage1", maxCount: 1 },
  { name: "galleryImage2", maxCount: 1 },
  { name: "galleryImage3", maxCount: 1 },
  { name: "galleryImage4", maxCount: 1 },
  { name: "galleryImage5", maxCount: 1 },
  { name: "galleryImage6", maxCount: 1 },
  { name: "files", maxCount: 4 },
]);

export const fileUploader = {
  upload,
  uploadMultiple,
  profileImage,
  coverPhoto,
};
