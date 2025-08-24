import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  File, 
  Image, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Loader2,
  Cloud
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

// Cloudinary upload function
const uploadToCloudinary = async (file, domain) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.CLOUDINARY_UPLOAD_PRESET || 'MavericksGallery');
  formData.append('folder', `nexus/${domain.id}`);
  
  // Add resource type based on file type
  if (file.type.startsWith('image/')) {
    formData.append('resource_type', 'image');
  } else if (file.type.startsWith('video/')) {
    formData.append('resource_type', 'video');
  } else {
    formData.append('resource_type', 'raw');
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return await response.json();
};

export default function FileUploadModal({ isOpen, onClose, domain, clubId, onUploadSuccess }) {
  const { userProfile, currentUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    featured: false
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    setError('');
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!domain.allowedExtensions.includes(fileExtension)) {
      setError(`File type not allowed. Allowed types: ${domain.allowedExtensions.join(', ')}`);
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename
    if (!uploadData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setUploadData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.title || !uploadData.category) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(selectedFile, domain);
      setUploadProgress(70);

      // Create thumbnail URL for images
      let thumbnailUrl = null;
      if (selectedFile.type.startsWith('image/')) {
        thumbnailUrl = cloudinaryResult.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/');
      }

      // Save to Firestore
      const resourceData = {
        title: uploadData.title,
        description: uploadData.description,
        category: uploadData.category,
        tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured: uploadData.featured,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        fileUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        thumbnailUrl,
        uploadedBy: {
          uid: currentUser?.uid,
          name: userProfile?.name || currentUser?.displayName,
          email: userProfile?.email || currentUser?.email
        },
        createdAt: serverTimestamp(),
        views: 0,
        downloads: 0,
        domain: domain.id
      };

      const resourcesRef = collection(db, 'clubs', clubId, 'nexus', domain.id, 'resources');
      await addDoc(resourcesRef, resourceData);
      
      setUploadProgress(100);
      
      // Reset form
      setSelectedFile(null);
      setUploadData({
        title: '',
        description: '',
        category: '',
        tags: '',
        featured: false
      });
      
      onUploadSuccess();
      onClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen || !domain) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Cloud className={`h-6 w-6 text-${domain.color}-500`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Upload to {domain.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Allowed formats: {domain.allowedExtensions.join(', ')}
                </p>
              </div>
            </div>
            <div
              onClick={onClose}
              className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-10 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                dragActive
                  ? `border-${domain.color}-500 bg-${domain.color}-50 dark:bg-${domain.color}-900/20`
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-4">
                  {(() => {
                    const IconComponent = getFileIcon(selectedFile);
                    return <IconComponent className={`h-12 w-12 text-${domain.color}-500`} />;
                  })()}
                  <div className="text-left">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <div
                    onClick={() => setSelectedFile(null)}
                    className="p-2 cursor-pointer text-gray-400 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={`h-12 w-12 text-${domain.color}-400 mx-auto mb-4`} />
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Maximum file size: 50MB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-6 py-2 bg-${domain.color}-600 text-white rounded-lg hover:bg-${domain.color}-700`}
                  >
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={domain.allowedExtensions.join(',')}
                    onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                  />
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-6">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Upload Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <label className="block bg-white text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {domain.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block bg-white text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Brief description of the resource"
                />
              </div>

              <div>
                <label className="block bg-white text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Comma-separated tags"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={uploadData.featured}
                  onChange={(e) => setUploadData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">
                  Mark as featured resource
                </label>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Uploading... {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`bg-${domain.color}-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 cursor-pointer bg-gray-400 text-white rounded-md hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                Cancel
              </div>
              
              <div
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !uploadData.title || !uploadData.category}
                className={`flex cursor-pointer items-center gap-2 px-6 py-2 bg-${domain.color}-600 text-white rounded-lg hover:bg-${domain.color}-700 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Resource
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
