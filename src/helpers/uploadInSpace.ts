import { S3Client, S3ClientConfig, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import config from "../config";

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.access_key_id,
    secretAccessKey: config.aws.secret_access_key,
  },
} as S3ClientConfig);

const MAX_FILE_SIZE = 3000 * 1024 * 1024; // 3000 MB

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
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

    const uploadParams = {
      Bucket: config.aws.bucket_name,
      Key: `uploads/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 15)}${fileExtension}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    return `https://${config.aws.bucket_name}.s3.${config.aws.region}.amazonaws.com/${uploadParams.Key}`;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to upload file: ${error.message}`
        : "Failed to upload file to DigitalOcean Spaces"
    );
  }
};

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
