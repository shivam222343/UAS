import { motion } from 'framer-motion';
import {
  Eye,
  Download,
  Calendar,
  User,
  Star,
  MoreVertical,
  FileText,
  Image,
  File
} from 'lucide-react';
import { useState } from 'react';

// The updated ResourceCard component with improved mobile alignment for the 'list' view.
function ResourceCard({ resource, domain, viewMode, onView, onDownload, isAdmin }) {
  const [showMenu, setShowMenu] = useState(false);

  // Function to determine the file icon based on file type.
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.includes('pdf') || fileType?.includes('document')) return FileText;
    return File;
  };

  // Function to format file size for display.
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Function to format the date for display.
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // List view with improved mobile alignment
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center sm:gap-4"
      >
        {/* Thumbnail/Icon section */}
        <div className="flex-shrink-0 mb-4 sm:mb-0">
          {resource.thumbnailUrl ? (
            <img
              src={resource.thumbnailUrl}
              alt={resource.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className={`w-16 h-16 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg flex items-center justify-center`}>
              {(() => {
                const IconComponent = getFileIcon(resource.fileType);
                return <IconComponent className={`h-8 w-8 text-${domain.color}-500`} />;
              })()}
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {resource.title}
            </h3>
            <span className={`px-2 py-1 bg-${domain.color}-100 text-${domain.color}-800 dark:bg-${domain.color}-900 dark:text-${domain.color}-200 text-xs rounded-full flex-shrink-0`}>
              {resource.category}
            </span>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
            {resource.description}
          </p>
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{resource.uploadedBy?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(resource.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{resource.views || 0} views</span>
            </div>
            <span>{formatFileSize(resource.fileSize)}</span>
          </div>
        </div>

        {/* Actions section */}
        <div className="flex-shrink-0 mt-4 sm:mt-0 flex justify-end sm:justify-start items-center gap-2">
          <div
            onClick={onView}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </div>
          
          <div
            onClick={onDownload}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </div>

          {resource.featured && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      </motion.div>
    );
  }

  // Grid view (unchanged)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail/Preview */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-${domain.color}-100 to-${domain.color}-200 dark:from-${domain.color}-900 dark:to-${domain.color}-800 flex items-center justify-center`}>
            {(() => {
              const IconComponent = getFileIcon(resource.fileType);
              return <IconComponent className={`h-16 w-16 text-${domain.color}-500`} />;
            })()}
          </div>
        )}
        
        {resource.featured && (
          <div className="absolute top-2 right-2">
            <Star className="h-5 w-5 text-yellow-500 fill-current" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 bg-${domain.color}-600 text-white text-xs rounded-full`}>
            {resource.category}
          </span>
        </div>

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="flex gap-2">
            <div
              onClick={onView}
              className="p-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="View"
            >
              <Eye className="h-5 w-5" />
            </div>
            
            <div
              onClick={onDownload}
              className="p-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
            {resource.title}
          </h3>
          
          <div className="relative">
            <div
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </div>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10 min-w-32">
                <div
                  onClick={() => {
                    onView();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  View Details
                </div>
                <div
                  onClick={() => {
                    onDownload();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  Download
                </div>
                {isAdmin && (
                  <>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <div className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                      Edit
                    </div>
                    <div className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer">
                      Delete
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {resource.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{resource.uploadedBy?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{resource.views || 0}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(resource.createdAt)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(resource.fileSize)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Main application component to demonstrate the card
export default function App() {
  const sampleResources = [
    {
      id: 1,
      title: 'Intro to React Hooks',
      description: 'A comprehensive guide to modern React development with functional components and hooks.',
      thumbnailUrl: 'https://placehold.co/600x400/22C55E/FFFFFF?text=React',
      category: 'Tutorial',
      uploadedBy: { name: 'Jane Doe' },
      createdAt: new Date('2023-01-15'),
      views: 125,
      fileSize: 1.2 * 1024 * 1024,
      fileType: 'application/pdf',
      featured: true
    },
    {
      id: 2,
      title: 'CSS Grid Layout Cheat Sheet',
      description: 'Quick reference for all CSS Grid properties and values, including real-world examples.',
      thumbnailUrl: 'https://placehold.co/600x400/06B6D4/FFFFFF?text=CSS',
      category: 'Reference',
      uploadedBy: { name: 'John Smith' },
      createdAt: new Date('2023-03-20'),
      views: 89,
      fileSize: 512 * 1024,
      fileType: 'image/png',
      featured: false
    },
    {
      id: 3,
      title: 'JavaScript Asynchronous Programming',
      description: 'A deep dive into Promises, async/await, and callbacks for effective async code in JS.',
      thumbnailUrl: null,
      category: 'Guide',
      uploadedBy: { name: 'Alex' },
      createdAt: new Date('2023-05-10'),
      views: 210,
      fileSize: 2.5 * 1024 * 1024,
      fileType: 'application/pdf',
      featured: true
    },
  ];

  const domains = {
    react: { color: 'green' },
    css: { color: 'cyan' },
    javascript: { color: 'yellow' },
    generic: { color: 'indigo' },
  };

  const commonProps = {
    onView: () => alert('View clicked!'),
    onDownload: () => alert('Download clicked!'),
    isAdmin: false
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans p-4 sm:p-8">
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-8">Resource List View</h1>
      <div className="space-y-4 max-w-4xl mx-auto">
        {sampleResources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            domain={
              index === 0
                ? domains.react
                : index === 1
                ? domains.css
                : domains.javascript
            }
            viewMode="list"
            {...commonProps}
          />
        ))}
      </div>
    </div>
  );
}
