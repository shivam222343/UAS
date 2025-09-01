import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Globe, Loader2, Upload } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

function detectProvider(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.includes('drive.google.com')) return { provider: 'Google Drive', category: 'Google Drive' };
    if (host.includes('docs.google.com')) return { provider: 'Google Docs', category: 'Google Docs' };
    if (host.includes('sheets.google.com') || (host.includes('docs.google.com') && u.pathname.includes('/spreadsheets'))) return { provider: 'Google Sheets', category: 'Google Sheets' };
    if (host.includes('canva.com')) return { provider: 'Canva', category: 'Canva' };
    if (host.includes('figma.com')) return { provider: 'Figma', category: 'Figma' };
    if (host.includes('notion.so') || host.includes('notion.site')) return { provider: 'Notion', category: 'Notion' };
    return { provider: host, category: 'Other' };
  } catch {
    return { provider: 'Unknown', category: 'Other' };
  }
}

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=128&domain=${u.hostname}`;
  } catch {
    return null;
  }
}

export default function LinkUploadModal({ isOpen, onClose, domain, clubId, onUploadSuccess }) {
  const { userProfile, currentUser } = useAuth();

  const [form, setForm] = useState({
    url: '',
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !domain) return null;

  const validateUrl = (val) => {
    try {
      const u = new URL(val);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAutoFill = () => {
    if (!form.url) return;
    const { provider, category } = detectProvider(form.url);
    const title = form.title || provider;
    const next = { ...form };
    if (!form.category) next.category = category;
    if (!form.title) next.title = title;
    setForm(next);
  };

  const handleSave = async () => {
    setError('');
    if (!form.url || !validateUrl(form.url) || !form.title || !form.category) {
      setError('Please provide a valid URL, Title, and Category');
      return;
    }

    try {
      setUploading(true);
      const { provider } = detectProvider(form.url);
      const resourceData = {
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        fileName: form.url,
        fileSize: 0,
        fileType: 'url',
        fileUrl: form.url,
        thumbnailUrl: getFavicon(form.url),
        uploadedBy: {
          uid: currentUser?.uid,
          name: userProfile?.name || currentUser?.displayName,
          email: userProfile?.email || currentUser?.email
        },
        provider,
        createdAt: serverTimestamp(),
        views: 0,
        downloads: 0,
        domain: domain.id
      };

      const resourcesRef = collection(db, 'clubs', clubId, 'nexus', domain.id, 'resources');
      await addDoc(resourcesRef, resourceData);

      onUploadSuccess?.();
      onClose();
      setForm({ url: '', title: '', description: '', category: '', tags: '' });
    } catch (e) {
      console.error('Error saving link:', e);
      setError('Failed to save link. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
              <Link2 className={`h-6 w-6 text-${domain.color}-500`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Link</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Store external resources like Google Drive/Docs, Sheets, Canva, etc.</p>
              </div>
            </div>
            <div onClick={onClose} className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-10 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                    onBlur={handleAutoFill}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleAutoFill}
                    className={`px-3 py-2 bg-${domain.color}-600 text-white rounded-lg hover:bg-${domain.color}-700`}
                    type="button"
                  >
                    Detect
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Sponsorship Drive Folder"
                  className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Category</option>
                  {domain.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional notes, access info, etc."
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Comma-separated tags"
                  className="w-full px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={onClose} disabled={uploading} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={uploading || !form.url || !form.title || !form.category} className={`flex items-center gap-2 px-6 py-2 bg-${domain.color}-600 text-white rounded-lg hover:bg-${domain.color}-700 disabled:opacity-50`}>
                  {uploading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<><Upload className="h-4 w-4" /> Save Link</>)}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
