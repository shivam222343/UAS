import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Download,
  Calendar,
  User,
  Star,
  MoreVertical,
  FileText,
  Image,
  File,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

export default function ResourceCard({
  resource,
  domain,
  viewMode,
  onView,
  onDownload,
  onEdit,
  onDelete,
  isAdmin,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) return Image;
    if (fileType?.includes("pdf") || fileType?.includes("document")) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // ✅ unified formatDate
  function formatDate(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";

    let date;
    if (typeof dateOrTimestamp.toDate === "function") {
      date = dateOrTimestamp.toDate();
    } else if (dateOrTimestamp.seconds) {
      date = new Date(
        dateOrTimestamp.seconds * 1000 + dateOrTimestamp.nanoseconds / 1000000
      );
    } else {
      date = new Date(dateOrTimestamp);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // --- Delete Confirmation Popup ---
  const DeleteConfirmModal = () => (
    <AnimatePresence>
      {confirmDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm w-full p-6 relative"
          >
            {/* Close button */}
            <div
              onClick={() => setConfirmDelete(false)}
              className="absolute top-3 cursor-pointer right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium">"{resource.title}"</span>? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(resource);
                  setConfirmDelete(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (viewMode === "list") {
    return (
      <>
        <DeleteConfirmModal />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {resource.thumbnailUrl ? (
                <img
                  src={resource.thumbnailUrl}
                  alt={resource.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div
                  className={`w-16 h-16 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg flex items-center justify-center`}
                >
                  {(() => {
                    const IconComponent = getFileIcon(resource.fileType);
                    return (
                      <IconComponent className={`h-8 w-8 text-${domain.color}-500`} />
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {resource.title}
                </h3>
                <span
                  className={`px-2 py-1 bg-${domain.color}-100 text-${domain.color}-800 dark:bg-${domain.color}-900 dark:text-${domain.color}-200 text-xs rounded-full`}
                >
                  {resource.category}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                {resource.description}
              </p>

              {/* Meta info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{resource.uploadedBy?.name || "Unknown"}</span>
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

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
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
          </div>
        </motion.div>
      </>
    );
  }

  // --- Grid card ---
  return (
    <>
      <DeleteConfirmModal />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 "
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
            <div
              className={`w-full h-full bg-gradient-to-br from-${domain.color}-100 to-${domain.color}-200 dark:from-${domain.color}-900 dark:to-${domain.color}-800 flex items-center justify-center`}
            >
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
            <span
              className={`px-2 py-1 bg-${domain.color}-600 text-white text-xs rounded-full`}
            >
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
                      <div
                        onClick={() => {
                          onEdit(resource);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </div>
                      <div
                        onClick={() => {
                          setConfirmDelete(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="h-3 w-3" />
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1 sm:space-y-0">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{resource.uploadedBy?.name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{resource.views || 0}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
            <span>{formatDate(resource.createdAt)}</span>
            <span>{formatFileSize(resource.fileSize)}</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
