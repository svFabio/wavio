import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadBase64Image = async (base64Str: string, folder: string): Promise<string> => {
  const uploadResponse = await cloudinary.uploader.upload(base64Str, {
    folder,
  });
  return uploadResponse.secure_url;
};
