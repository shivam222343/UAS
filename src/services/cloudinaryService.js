// Cloudinary service for file uploads in Nexus
export class CloudinaryService {
  static cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  static uploadPreset = 'nexus_uploads'; // You need to create this in Cloudinary console

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
}
