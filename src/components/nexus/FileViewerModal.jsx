import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
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
  const [copied, setCopied] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (isOpen && resource && !viewTracked) {
      trackView();
      setViewTracked(true);
    }
    if (!isOpen) setViewTracked(false);
  }, [isOpen, resource]);

  const trackView = async () => {
    if (!resource) return;
    try {
      const resourceRef = doc(db, 'nexus', resource.domain, 'resources', resource.id);
      await updateDoc(resourceRef, { views: increment(1) });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleCopyLink = () => {
    try {
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
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ✅ unified formatDate
  function formatDate(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";

    let date;
    try {
      if (typeof dateOrTimestamp.toDate === "function") {
        // Firestore Timestamp object
        date = dateOrTimestamp.toDate();
      } else if (dateOrTimestamp?.seconds) {
        // Firestore timestamp fields
        date = new Date(
          dateOrTimestamp.seconds * 1000 +
          (dateOrTimestamp.nanoseconds || 0) / 1000000
        );
      } else {
        // Fallback: normal Date or ISO string
        date = new Date(dateOrTimestamp);
      }
    } catch (err) {
      console.error("Invalid date:", dateOrTimestamp, err);
      return "";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }


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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button (mobile) */}
          <div className="absolute top-4 right-4 md:hidden z-10">
            <motion.div
              onClick={onClose}
              className="p-2 text-blue-600  hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </motion.div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center md:min-h-[60vh]">
            {isImage ? (
              <img
                src={resource.fileUrl}
                alt={resource.title}
                className="max-w-full max-h-full object-contain p-2 md:p-6"
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

          {/* Info Panel (scrollable only on mobile) */}
          <div className="w-full md:w-80 bg-white dark:bg-gray-800 md:border-l border-gray-200 dark:border-gray-700 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto p-6">
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
                <div className="hidden md:block">
                  <motion.div
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                </div>
              </div>
            </div>

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

            {/* File Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                File Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">File Size</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatFileSize(resource.fileSize)}
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
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(resource.createdAt)}
                    </span>

                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      Upload date
                    </p>
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
