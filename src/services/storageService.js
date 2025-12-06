import { CloudinaryService } from './cloudinaryService';

class StorageService {
    // Upload image using Cloudinary
    async uploadImage(file, conversationId, onProgress = null, userId = null) {
        try {
            if (!userId) {
                throw new Error('User ID is required for upload');
            }

            return await CloudinaryService.uploadChatImage(file, userId, onProgress);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // Upload file using Cloudinary
    async uploadFile(file, conversationId, onProgress = null, userId = null) {
        try {
            if (!userId) {
                throw new Error('User ID is required for upload');
            }

            return await CloudinaryService.uploadChatFile(file, userId, onProgress);
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    // Delete file (Cloudinary deletion requires backend)
    async deleteFile(publicId) {
        try {
            // Note: Cloudinary deletion requires API secret, implement via backend
            console.log('Delete file:', publicId);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    // Get download URL (already provided by Cloudinary)
    async getDownloadUrl(url) {
        return url; // Cloudinary URLs are already download URLs
    }

    // Format file size
    formatFileSize(bytes) {
        return CloudinaryService.formatFileSize(bytes);
    }

    // Check remaining uploads
    async getRemainingUploads(userId) {
        const limitCheck = await CloudinaryService.checkChatUploadLimit(userId);
        return limitCheck.remaining;
    }

    // Get upload limit info
    async getUploadLimitInfo(userId) {
        return await CloudinaryService.checkChatUploadLimit(userId);
    }
}

export const storageService = new StorageService();
export default storageService;
