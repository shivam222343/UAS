import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CloudinaryService } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';

export default function EditResourceModal({ 
  isOpen, 
  onClose, 
  resource, 
  domain, 
  clubId, 
  onUpdateSuccess 
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    featured: false
  });
  const [newFile, setNewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        category: resource.category || '',
        featured: resource.featured || false
      });
    }
  }, [resource]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (newFile) {
      const fileExtension = '.' + newFile.name.split('.').pop().toLowerCase();
      if (!domain.allowedExtensions.includes(fileExtension)) {
        newErrors.file = `File type not allowed. Allowed types: ${domain.allowedExtensions.join(', ')}`;
      }
      
      // 50MB limit
      if (newFile.size > 50 * 1024 * 1024) {
        newErrors.file = 'File size must be less than 50MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      let updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        featured: formData.featured,
        updatedAt: new Date().toISOString()
      };

      // If new file is uploaded, handle Cloudinary upload
      if (newFile) {
        // Delete old file from Cloudinary if it exists
        if (resource.cloudinaryPublicId) {
          try {
            const resourceType = resource.fileType?.startsWith('image/') ? 'image' : 
                               resource.fileType?.startsWith('video/') ? 'video' : 'raw';
            await CloudinaryService.deleteFile(resource.cloudinaryPublicId, resourceType);
          } catch (error) {
            console.warn('Failed to delete old file from Cloudinary:', error);
          }
        }

        // Upload new file
        const uploadResult = await CloudinaryService.uploadFile(newFile, {
          folder: 'nexus',
          domain: domain.id
        });

        updateData = {
          ...updateData,
          fileUrl: uploadResult.secure_url,
          fileName: newFile.name,
          fileSize: newFile.size,
          fileType: newFile.type,
          cloudinaryPublicId: uploadResult.public_id,
          thumbnailUrl: newFile.type.startsWith('image/') ? 
            CloudinaryService.generateThumbnail(uploadResult.public_id) : null
        };
      }

      // Update Firestore document
      const resourceRef = doc(db, 'clubs', clubId, 'nexus', domain.id, 'resources', resource.id);
      await updateDoc(resourceRef, updateData);

      toast.success('Resource updated successfully!');
      onUpdateSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewFile(file);
    
    // Clear file error when new file is selected
    if (errors.file) {
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Resource
            </h2>
            <div
              onClick={onClose}
              className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full bg-white px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter resource title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-white px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter resource description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select a category</option>
                {domain.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm bg-white text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Replace File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Replace File (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept={domain.allowedExtensions.join(',')}
                  className="w-full text-sm bg-white text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Allowed types: {domain.allowedExtensions.join(', ')} (Max: 50MB)
                </p>
                {newFile && (
                  <p className="text-sm text-green-600 mt-2">
                    New file selected: {newFile.name}
                  </p>
                )}
              </div>
              {errors.file && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.file}
                </p>
              )}
            </div>

            {/* Featured */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mark as featured resource
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <div
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-400 text-white rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600  dark:text-gray-300 dark:bg-slate-800 text-center cursor-pointer hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Update Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
