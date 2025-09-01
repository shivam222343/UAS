import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  FileText, 
  Palette, 
  Camera, 
  Code, 
  Settings, 
  Upload, 
  Eye, 
  Users,
  BarChart3,
  BookOpen,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Link2
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, where, doc, getDoc, getDocs, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CloudinaryService } from '../services/cloudinaryService';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import DomainRulesModal from '../components/nexus/DomainRulesModal';
import FileUploadModal from '../components/nexus/FileUploadModal';
import LinkUploadModal from '../components/nexus/LinkUploadModal';
import FileViewerModal from '../components/nexus/FileViewerModal';
import DomainCard from '../components/nexus/DomainCard';
import ResourceCard from '../components/nexus/ResourceCard';
import DomainAnalytics from '../components/nexus/DomainAnalytics';
import DomainTemplates from '../components/nexus/DomainTemplates';
import AccessControlModal from '../components/nexus/AccessControlModal';
import EditResourceModal from '../components/nexus/EditResourceModal';
import Loader from '../components/Loader';

const DOMAINS = [
  {
    id: 'documentation',
    name: 'Documentation',
    icon: FileText,
    color: 'blue',
    description: 'Letters, reports, guidelines and official documents',
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    categories: ['Letters', 'Reports', 'Guidelines', 'Templates', 'Policies']
  },
  {
    id: 'design',
    name: 'Design',
    icon: Palette,
    color: 'purple',
    description: 'Posters, logos, banners and creative assets',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ai', '.psd', '.figma'],
    categories: ['Posters', 'Logos', 'Banners', 'Social Media', 'Print Materials']
  },
  {
    id: 'photography',
    name: 'Photography',
    icon: Camera,
    color: 'green',
    description: 'Event photos, portraits and visual documentation',
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.raw', '.tiff'],
    categories: ['Events', 'Portraits', 'Campus', 'Activities', 'Official']
  },
  {
    id: 'technical',
    name: 'Technical',
    icon: Code,
    color: 'orange',
    description: 'Code snippets, technical docs and development resources',
    allowedExtensions: ['.js', '.jsx', '.py', '.java', '.cpp', '.html', '.css', '.json', '.xml'],
    categories: ['Code', 'Tutorials', 'APIs','Documentation', 'Tools']
  }
  ,
  {
    id: 'links',
    name: 'Links',
    icon: Link2,
    color: 'teal',
    description: 'Save Google Drive/Docs/Sheets, Canva and other useful URLs in one place',
    allowedExtensions: ['url'],
    categories: ['Google Drive', 'Google Docs', 'Google Sheets', 'Google Slides', 'Google Forms', 'Canva', 'Figma', 'Notion', 'Dropbox', 'OneDrive', 'GitHub', 'Trello', 'Slack', 'Airtable', 'Miro', 'Other']
  }
];

export default function Nexus() {
  const { userProfile, currentUser, checkAdminAccess } = useAuth();
  const [selectedClub, setSelectedClub] = useState(null);
  const [userClubs, setUserClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [resources, setResources] = useState([]);
  const [domainRules, setDomainRules] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('resources');
  
  // Modal states
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceToEdit, setResourceToEdit] = useState(null);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userClubsData = userDoc.data()?.clubsJoined || {};
        const clubIds = Object.keys(userClubsData);
        
        const clubsDetails = [];
        for (const clubId of clubIds) {
          const clubDoc = await getDoc(doc(db, 'clubs', clubId));
          if (clubDoc.exists()) {
            clubsDetails.push({
              id: clubId,
              name: clubDoc.data().name,
              ...clubDoc.data()
            });
          }
        }
        
        setUserClubs(clubsDetails);
        if (clubsDetails.length > 0 && !selectedClub) {
          setSelectedClub(clubsDetails[0].id);
        }
      } catch (error) {
        console.error('Error fetching user clubs:', error);
      } finally {
        setClubsLoading(false);
      }
    };

  const handleCopyLink = async (resource) => {
    try {
      if (!resource?.fileUrl) return;
      await navigator.clipboard.writeText(resource.fileUrl);
      toast.success('Link copied to clipboard');
    } catch (e) {
      console.error('Copy failed', e);
      toast.error('Failed to copy link');
    }
  };
    
    fetchUserClubs();
  }, [currentUser]);

  // Fetch resources for selected domain and club
  useEffect(() => {
    if (!selectedDomain || !selectedClub) {
      setResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const resourcesRef = collection(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'resources');
    const q = query(resourcesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResources(resourcesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDomain, selectedClub]);

  // Fetch domain rules
  const fetchDomainRules = async () => {
    if (!selectedDomain || !selectedClub) return;
    
    try {
      const rulesRef = collection(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'rules');
      const rulesSnapshot = await getDocs(rulesRef);
      const rules = {};
      
      rulesSnapshot.docs.forEach(doc => {
        rules[doc.id] = doc.data();
      });
      
      setDomainRules(rules);
    } catch (error) {
      console.error('Error fetching domain rules:', error);
    }
  };

  useEffect(() => {
    fetchDomainRules();
  }, [selectedDomain, selectedClub]);

  const handleResourceView = async (resource) => {
    // If Links domain, open URL directly
    if (selectedDomain?.id === 'links') {
      try {
        const resourceRef = doc(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'resources', resource.id);
        await updateDoc(resourceRef, {
          views: increment(1),
          lastViewed: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating view count:', error);
      }
      if (resource.fileUrl) {
        window.open(resource.fileUrl, '_blank', 'noopener');
      }
      return;
    }

    // Default behavior (files) -> open viewer modal
    try {
      const resourceRef = doc(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'resources', resource.id);
      await updateDoc(resourceRef, {
        views: increment(1),
        lastViewed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }
    setSelectedResource(resource);
    setShowViewerModal(true);
  };

  const handleResourceDownload = async (resource) => {
    try {
      const resourceRef = doc(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'resources', resource.id);
      await updateDoc(resourceRef, {
        downloads: increment(1),
        lastDownloaded: new Date().toISOString()
      });

      // For links, just open the URL
      if (selectedDomain?.id === 'links') {
        if (resource.fileUrl) window.open(resource.fileUrl, '_blank', 'noopener');
        return;
      }

      // For files, proceed with download
      const link = document.createElement('a');
      link.href = resource.fileUrl;
      link.download = resource.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const handleResourceEdit = (resource) => {
    setResourceToEdit(resource);
    setShowEditModal(true);
  };

  const handleResourceDelete = async (resource) => {
    if (!window.confirm(`Are you sure you want to delete "${resource.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from Cloudinary if public ID exists
      if (resource.cloudinaryPublicId) {
        const resourceType = resource.fileType?.startsWith('image/') ? 'image' : 
                           resource.fileType?.startsWith('video/') ? 'video' : 'raw';
        await CloudinaryService.deleteFile(resource.cloudinaryPublicId, resourceType);
      }

      // Delete from Firestore
      const resourceRef = doc(db, 'clubs', selectedClub, 'nexus', selectedDomain.id, 'resources', resource.id);
      await deleteDoc(resourceRef);

      toast.success('Resource deleted successfully!');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource. Please try again.');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name':
        return a.title.localeCompare(b.title);
      case 'popular':
        return (b.views || 0) - (a.views || 0);
      default:
        return 0;
    }
  });

  if (clubsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (userClubs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6"
      >
        <div className="text-center py-12">
          <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No clubs joined
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Join a club to access Nexus resources
          </p>
        </div>
      </motion.div>
    );
  }

  if (!selectedDomain) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-6"
      >
        {/* Club Selector */}
        {userClubs.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Club
            </label>
            <select
              value={selectedClub || ''}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full bg-white sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {userClubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Nexus - Domain Management
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {DOMAINS.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onClick={() => setSelectedDomain(domain)}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                <p className="text-gray-600 dark:text-gray-400">Total Resources</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
                <p className="text-gray-600 dark:text-gray-400">This Month</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1.2k</p>
                <p className="text-gray-600 dark:text-gray-400">Total Views</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6"
    >
      {/* Club Selector */}
      {userClubs.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedClub || ''}
            onChange={(e) => setSelectedClub(e.target.value)}
            className="w-full bg-white sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {userClubs.map(club => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            onClick={() => setSelectedDomain(null)}
            className="p-2  text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 sm:hidden cursor-pointer"
          >
            ←
          </div>
          <div
            onClick={() => setSelectedDomain(null)}
            className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
          >
            ← Back
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <selectedDomain.icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${selectedDomain.color}-500`} />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDomain.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hidden sm:block">
                {selectedDomain.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <div
                onClick={() => setShowRulesModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Rules</span>
              </div>
              
              <div
                onClick={() => setShowAccessModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm cursor-pointer"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Access</span>
              </div>
            </>
          )}
          
          <div
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 sm:mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
            {[
              { id: 'resources', name: 'Resources', icon: FileText },
              { id: 'templates', name: 'Templates', icon: BookOpen },
              { id: 'analytics', name: 'Analytics', icon: BarChart3 }
            ].map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? `border-${selectedDomain.color}-500 text-${selectedDomain.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 sm:gap-2 min-w-0 cursor-pointer`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.name}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Tab Content Controls */}
        {activeTab === 'resources' && (
          <div className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search and Category Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option className='bg-white' value="all">All Categories</option>
                  {selectedDomain.categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort and View Controls Row */}
              <div className="flex items-center justify-between gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm flex-1 sm:flex-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="popular">Most Popular</option>
                </select>

                <div className="flex border border-gray-300 rounded-lg dark:border-gray-600">
                  <div
                    onClick={() => setViewMode('grid')}
                    className={`p-2 cursor-pointer ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </div>
                  <div
                    onClick={() => setViewMode('list')}
                    className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    <List className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader size="medium" />
              </div>
            ) : sortedResources.length === 0 ? (
              <div className="text-center py-12">
                <selectedDomain.icon className={`h-16 w-16 text-${selectedDomain.color}-300 mx-auto mb-4`} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No resources found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Be the first to upload a resource'}
                </p>
                <div
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Upload Resource
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                : 'space-y-3 sm:space-y-4'
              }>
                {sortedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    domain={selectedDomain}
                    viewMode={viewMode}
                    onView={() => handleResourceView(resource)}
                    onDownload={() => handleResourceDownload(resource)}
                    onCopy={() => handleCopyLink(resource)}
                    onEdit={handleResourceEdit}
                    onDelete={handleResourceDelete}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Templates Tab */}
        <DomainTemplates 
          domain={selectedDomain}
          isVisible={activeTab === 'templates'}
        />

        {/* Analytics Tab */}
        <DomainAnalytics 
          domain={selectedDomain}
          isVisible={activeTab === 'analytics'}
          clubId={selectedClub}
        />
      </div>

      {/* Modals */}
      <DomainRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        domain={selectedDomain}
        clubId={selectedClub}
        rules={domainRules}
        onRulesUpdate={fetchDomainRules}
      />

      {selectedDomain?.id === 'links' ? (
        <LinkUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          domain={selectedDomain}
          clubId={selectedClub}
          onUploadSuccess={() => {}}
        />
      ) : (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          domain={selectedDomain}
          clubId={selectedClub}
          onUploadSuccess={() => {}}
        />
      )}

      <FileViewerModal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        resource={selectedResource}
        onDownload={() => selectedResource && handleResourceDownload(selectedResource)}
      />

      <AccessControlModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        domain={selectedDomain}
        clubId={selectedClub}
      />

      <EditResourceModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setResourceToEdit(null);
        }}
        resource={resourceToEdit}
        domain={selectedDomain}
        clubId={selectedClub}
        onUpdateSuccess={() => {
          setShowEditModal(false);
          setResourceToEdit(null);
        }}
      />
    </motion.div>
  );
}
