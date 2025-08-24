import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Download, 
  Eye, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function DomainAnalytics({ domain, isVisible }) {
  const [analytics, setAnalytics] = useState({
    totalResources: 0,
    totalViews: 0,
    totalDownloads: 0,
    activeUsers: 0,
    topResources: [],
    categoryBreakdown: {},
    recentActivity: [],
    monthlyUploads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible && domain) {
      fetchAnalytics();
    }
  }, [isVisible, domain]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch all resources for this domain
      const resourcesRef = collection(db, 'nexus', domain.id, 'resources');
      const resourcesSnapshot = await getDocs(resourcesRef);
      
      const resources = resourcesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Calculate analytics
      const totalResources = resources.length;
      const totalViews = resources.reduce((sum, r) => sum + (r.views || 0), 0);
      const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads || 0), 0);
      
      // Get unique uploaders
      const uniqueUploaders = new Set(resources.map(r => r.uploadedBy?.uid).filter(Boolean));
      const activeUsers = uniqueUploaders.size;

      // Top resources by views
      const topResources = resources
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

      // Category breakdown
      const categoryBreakdown = {};
      resources.forEach(r => {
        if (r.category) {
          categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
        }
      });

      // Monthly uploads (last 6 months)
      const monthlyUploads = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthResources = resources.filter(r => 
          r.createdAt >= month && r.createdAt < nextMonth
        );
        
        monthlyUploads.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: monthResources.length
        });
      }

      // Recent activity (last 10 activities)
      const recentActivity = resources
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          type: 'upload',
          title: r.title,
          user: r.uploadedBy?.name || 'Unknown',
          timestamp: r.createdAt,
          category: r.category
        }));

      setAnalytics({
        totalResources,
        totalViews,
        totalDownloads,
        activeUsers,
        topResources,
        categoryBreakdown,
        recentActivity,
        monthlyUploads
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className={`p-3 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg`}>
              <BarChart3 className={`h-6 w-6 text-${domain.color}-600`} />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalResources}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Resources</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalViews.toLocaleString()}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Views</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.totalDownloads.toLocaleString()}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Downloads</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.activeUsers}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Contributors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Popular Resources
          </h3>
          <div className="space-y-3">
            {analytics.topResources.map((resource, index) => (
              <div key={resource.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg flex items-center justify-center`}>
                    <span className={`text-${domain.color}-600 font-medium text-sm`}>
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {resource.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {resource.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {resource.views || 0} views
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {resource.downloads || 0} downloads
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resources by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`bg-${domain.color}-500 h-2 rounded-full`}
                      style={{
                        width: `${(count / analytics.totalResources) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Upload Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upload Trend (Last 6 Months)
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {analytics.monthlyUploads.map((month, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className={`w-full bg-${domain.color}-500 rounded-t-lg transition-all duration-300 hover:bg-${domain.color}-600`}
                style={{
                  height: `${Math.max((month.count / Math.max(...analytics.monthlyUploads.map(m => m.count))) * 100, 5)}%`
                }}
                title={`${month.count} uploads`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                {month.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {analytics.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3">
              <div className={`p-2 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg`}>
                <Activity className={`h-4 w-4 text-${domain.color}-600`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.user}</span> uploaded{' '}
                  <span className="font-medium">{activity.title}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.category} • {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
