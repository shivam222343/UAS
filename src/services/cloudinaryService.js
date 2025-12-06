// Cloudinary service for file uploads in Nexus and Chat
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export class CloudinaryService {
  static cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  static uploadPreset = 'MavericksGallery'; // Unsigned upload preset
  static chatUploadPreset = 'MavericksGallery'; // Use same preset for chat
  static maxFileSize = 5 * 1024 * 1024; // 5MB for chat
  static maxUploadsPerDay = 10;

  static async uploadFile(file, options = {}) {
    const {
      folder = 'nexus',
      domain = 'general',
      transformation = null
    } = options;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', `${folder}/${domain}`);

    // Add resource type based on file type
    if (file.type.startsWith('image/')) {
      formData.append('resource_type', 'image');

      // Add automatic transformations for images
      if (transformation) {
        formData.append('transformation', transformation);
      }
    } else if (file.type.startsWith('video/')) {
      formData.append('resource_type', 'video');
    } else {
      formData.append('resource_type', 'raw');
    }

    // Add tags for better organization
    formData.append('tags', `nexus,${domain},${file.type.split('/')[0]}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  static async deleteFile(publicId, resourceType = 'image') {
    try {
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('resource_type', resourceType);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  static generateThumbnail(publicId, options = {}) {
    const {
      width = 400,
      height = 300,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
  }

  static generateOptimizedUrl(publicId, options = {}) {
    const {
      width,
      height,
      crop = 'scale',
      quality = 'auto',
      format = 'auto'
    } = options;

    let transformation = `q_${quality},f_${format}`;

    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (width || height) transformation += `,c_${crop}`;

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  static getFileInfo(publicId, resourceType = 'image') {
    return fetch(
      `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${publicId}.json`
    ).then(response => response.json());
  }

  static validateEnvironment() {
    if (!this.cloudName) {
      throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not configured');
    }
    return true;
  }

  // ========== CHAT-SPECIFIC METHODS WITH LIMITS ==========

  /**
   * Check if user has exceeded daily upload limit
   */
  static async checkChatUploadLimit(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userUploadDoc = doc(db, 'userUploads', `${userId}_${today}`);
      const uploadData = await getDoc(userUploadDoc);

      if (uploadData.exists()) {
        const count = uploadData.data().count || 0;
        return {
          canUpload: count < this.maxUploadsPerDay,
          remaining: Math.max(0, this.maxUploadsPerDay - count),
          count
        };
      }

      return {
        canUpload: true,
        remaining: this.maxUploadsPerDay,
        count: 0
      };
    } catch (error) {
      console.error('Error checking upload limit:', error);
      return { canUpload: true, remaining: this.maxUploadsPerDay, count: 0 };
    }
  }

  /**
   * Increment user's daily upload count
   */
  static async incrementChatUploadCount(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userUploadDoc = doc(db, 'userUploads', `${userId}_${today}`);
      const uploadData = await getDoc(userUploadDoc);

      if (uploadData.exists()) {
        await updateDoc(userUploadDoc, {
          count: increment(1),
          lastUpload: serverTimestamp()
        });
      } else {
        await setDoc(userUploadDoc, {
          userId,
          date: today,
          count: 1,
          lastUpload: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error incrementing upload count:', error);
    }
  }

  /**
   * Upload image for chat (5MB limit, 10/day)
   */
  static async uploadChatImage(file, userId, onProgress = null) {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > this.maxFileSize) {
        throw new Error('Image size must be less than 5MB');
      }

      const limitCheck = await this.checkChatUploadLimit(userId);
      if (!limitCheck.canUpload) {
        throw new Error(`Daily upload limit reached (${this.maxUploadsPerDay}/day). ${limitCheck.remaining} remaining.`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.chatUploadPreset);
      formData.append('folder', `chat/${userId}`);
      formData.append('resource_type', 'image');

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            await this.incrementChatUploadCount(userId);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              type: 'image'
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading chat image:', error);
      throw error;
    }
  }

  /**
   * Upload file for chat (5MB limit, 10/day)
   */
  static async uploadChatFile(file, userId, onProgress = null) {
    try {
      if (file.size > this.maxFileSize) {
        throw new Error('File size must be less than 5MB');
      }

      const limitCheck = await this.checkChatUploadLimit(userId);
      if (!limitCheck.canUpload) {
        throw new Error(`Daily upload limit reached (${this.maxUploadsPerDay}/day). ${limitCheck.remaining} remaining.`);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.chatUploadPreset);
      formData.append('folder', `chat/${userId}`);
      formData.append('resource_type', 'raw');

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            await this.incrementChatUploadCount(userId);
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              type: 'file'
            });
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading chat file:', error);
      throw error;
    }
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
