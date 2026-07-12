import { S3Client, S3ClientConfig, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import path from "path";

const DO_CONFIG = {
  endpoint: "https://api.zenexcloud.com",
  region: "s3v4",
  useSSL: false,
  credentials: {
    accessKeyId: "Be7vSXLGn1EuMzy55jLO",
    secretAccessKey: "Gw2pW1gqVAG0GH8SXzrRJXi1036IMv5dBdgcwJme",
  },
  spaceName: "emdadullah",
};

const s3Config: S3ClientConfig = {
  endpoint: DO_CONFIG.endpoint,
  region: DO_CONFIG.region,
  credentials: DO_CONFIG.credentials,
  forcePathStyle: true,
};

const s3 = new S3Client(s3Config);

const MAX_FILE_SIZE = 3000 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/avif",
  "video/mpeg",
  "video/mp4",
  "video/x-matroska",
  "audio/mpeg",
  "application/zip",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Uploads a file buffer to DigitalOcean Spaces and returns the file URL.
 * @param {Express.Multer.File} file - The file object from multer
 * @returns {Promise<string>} - The URL of the uploaded file
 * @throws {Error} - If file validation fails or upload fails
 */
export const uploadInSpace = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error("File type not allowed");
    }

    // Generate a unique filename with original extension
    const fileExtension = path.extname(file.originalname);
    const fileName = `uploads/${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}${fileExtension}`;

    const uploadParams = {
      Bucket: DO_CONFIG.spaceName,
      Key: fileName,
      Body: file.buffer,
      ACL: "public-read" as ObjectCannedACL,
      ContentType: file.mimetype,
    };

    const upload = new Upload({
      client: s3,
      params: uploadParams,
    });

    await upload.done();

    const fileUrl = `${DO_CONFIG.endpoint}/${DO_CONFIG.spaceName}/${fileName}`;

    return fileUrl;
  } catch (error) {
    // console.error("Error uploading file to DigitalOcean Spaces:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file to DigitalOcean Spaces"
    );
  }
};



// import { S3Client, S3ClientConfig, PutObjectCommand } from "@aws-sdk/client-s3";
// import path from "path";
// import config from "../config";

// const s3 = new S3Client({
//   region: config.aws.region,
//   credentials: {
//     accessKeyId: config.aws.access_key_id,
//     secretAccessKey: config.aws.secret_access_key,
//   },
// } as S3ClientConfig);

// const MAX_FILE_SIZE = 3000 * 1024 * 1024; // 3000 MB

// // Allowed MIME types
// const ALLOWED_MIME_TYPES = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/gif",
//   "image/webp",
//   "video/mpeg",
//   "video/mp4",
//   "audio/mpeg",
//   "audio/mp3",
//   "video/x-matroska",
//   "audio/mpeg",
//   "application/zip",
//   "application/pdf",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
// ];

// export const uploadInSpace = async (
//   file: Express.Multer.File,
//   folder: string
// ): Promise<string> => {
//   try {
//     if (!file) {
//       throw new Error("No file provided");
//     }

//     // Validate file size
//     if (file.size > MAX_FILE_SIZE) {
//       throw new Error(
//         `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
//       );
//     }

//     // Validate file type
//     if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
//       throw new Error("File type not allowed");
//     }

//     // Generate a unique filename with original extension
//     const fileExtension = path.extname(file.originalname);

//     const uploadParams = {
//       Bucket: config.aws.bucket_name,
//       Key: `uploads/${folder}/${Date.now()}-${Math.random()
//         .toString(36)
//         .substring(2, 15)}${fileExtension}`,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//     };

//     await s3.send(new PutObjectCommand(uploadParams));

//     return `https://${config.aws.bucket_name}.s3.${config.aws.region}.amazonaws.com/${uploadParams.Key}`;
//   } catch (error) {
//     throw new Error(
//       error instanceof Error
//         ? `Failed to upload file: ${error.message}`
//         : "Failed to upload file to DigitalOcean Spaces"
//     );
//   }
// };

// S3 Bucket Policy to allow public read access to uploads folder
// {
//     "Version": "2012-10-17",
//     "Statement": [
//         {
//             "Sid": "PublicReadUploads",
//             "Effect": "Allow",
//             "Principal": "*",
//             "Action": "s3:GetObject",
//             "Resource": "arn:aws:s3:::playspark-bucket/uploads/*"
//         }
//     ]
// }
