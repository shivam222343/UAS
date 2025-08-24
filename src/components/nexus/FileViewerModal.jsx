import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Eye, 
  ExternalLink,
  FileText,
  Image,
  File,
  Calendar,
  User,
  Tag,
  Star,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function FileViewerModal({ isOpen, onClose, resource, onDownload }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (isOpen && resource && !viewTracked) {
      trackView();
      setViewTracked(true);
    }
    
    if (!isOpen) {
      setViewTracked(false);
    }
  }, [isOpen, resource]);

  const trackView = async () => {
    if (!resource) return;
    
    try {
      const resourceRef = doc(db, 'nexus', resource.domain, 'resources', resource.id);
      await updateDoc(resourceRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Using document.execCommand('copy') for better compatibility in iframe environments
      const tempInput = document.createElement('textarea');
      tempInput.value = resource.fileUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: resource.fileUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.includes('pdf') || fileType?.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = resource?.fileType?.startsWith('image/');
  const isPDF = resource?.fileType?.includes('pdf');
  const isViewable = isImage || isPDF;

  if (!isOpen || !resource) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          // Main modal container: flex-col on mobile, flex-row on desktop
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button for mobile */}
          <div className="absolute top-4 right-4 md:hidden z-10">
            <motion.div
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </motion.div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-auto min-h-[30vh] md:min-h-[60vh]">
            {isImage ? (
              <img
                src={resource.fileUrl}
                alt={resource.title}
                className="max-w-full max-h-full object-contain p-4 md:p-8"
                loading="lazy"
              />
            ) : isPDF ? (
              <iframe
                src={`${resource.fileUrl}#view=FitH`}
                className="w-full h-full min-h-[50vh] md:min-h-[60vh]"
                title={resource.title}
              />
            ) : (
              <div className="text-center p-8">
                {(() => {
                  const IconComponent = getFileIcon(resource.fileType);
                  return <IconComponent className="h-24 w-24 text-gray-400 mx-auto mb-4" />;
                })()}
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This file type cannot be previewed in the browser
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <div
                    onClick={onDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </div>
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="w-full md:w-80 bg-white dark:bg-gray-800 md:border-l border-gray-200 dark:border-gray-700 flex flex-col p-6">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {resource.title}
                  </h2>
                  {resource.featured && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">Featured</span>
                    </div>
                  )}
                </div>
                {/* Close button for desktop */}
                <div className="hidden md:block">
                  <motion.div
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <div
                  onClick={onDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download
                </div>
                
                <div
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                </div>
                
                <div
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto">
              {/* Description */}
              {resource.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {resource.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  File Information
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {resource.category}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">File Size</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatFileSize(resource.fileSize)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">File Type</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {resource.fileName?.split('.').pop()?.toUpperCase() || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Views</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {resource.views || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Upload Information
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {resource.uploadedBy?.name || 'Unknown User'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {resource.uploadedBy?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {formatDate(resource.createdAt)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        Upload date
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
