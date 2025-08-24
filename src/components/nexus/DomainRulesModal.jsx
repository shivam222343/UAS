import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

const RULE_TEMPLATES = {
  documentation: [
    {
      title: 'Letter Format Guidelines',
      description: 'Standard format for official letters',
      content: `1. Use official letterhead\n2. Include date and reference number\n3. Proper salutation and closing\n4. Clear subject line\n5. Professional language only`,
      category: 'Letters',
      mandatory: true
    },
    {
      title: 'Report Structure',
      description: 'Standard structure for reports',
      content: `1. Executive Summary\n2. Introduction\n3. Methodology\n4. Findings\n5. Recommendations\n6. Conclusion\n7. Appendices`,
      category: 'Reports',
      mandatory: true
    },
    {
      title: 'File Naming Convention',
      description: 'Standard naming for documents',
      content: `Format: [Type]_[Date]_[Description]\nExample: LETTER_2024-01-15_Club_Registration\nUse underscores, no spaces\nDate format: YYYY-MM-DD`,
      category: 'General',
      mandatory: true
    }
  ],
  design: [
    {
      title: 'Brand Guidelines',
      description: 'Official brand colors and fonts',
      content: `Primary Colors:\n- Blue: #3B82F6\n- White: #FFFFFF\n- Gray: #6B7280\n\nFonts:\n- Headers: Inter Bold\n- Body: Inter Regular\n\nLogo placement: Top-left or center`,
      category: 'Branding',
      mandatory: true
    },
    {
      title: 'Poster Specifications',
      description: 'Standard sizes and formats for posters',
      content: `Sizes:\n- A4: 210×297mm (300 DPI)\n- A3: 297×420mm (300 DPI)\n- Social Media: 1080×1080px\n\nFormats: PNG, JPG, PDF\nMinimum resolution: 300 DPI for print`,
      category: 'Posters',
      mandatory: true
    },
    {
      title: 'Social Media Guidelines',
      description: 'Specifications for social media posts',
      content: `Instagram Post: 1080×1080px\nInstagram Story: 1080×1920px\nFacebook Post: 1200×630px\nLinkedIn Post: 1200×627px\n\nAlways include club logo\nUse consistent hashtags`,
      category: 'Social Media',
      mandatory: false
    }
  ],
  photography: [
    {
      title: 'Event Photography Standards',
      description: 'Guidelines for event photography',
      content: `1. Minimum 12MP resolution\n2. RAW + JPEG format\n3. Proper lighting and composition\n4. Include wide shots and close-ups\n5. Capture key moments and speakers\n6. Group photos with all participants`,
      category: 'Events',
      mandatory: true
    },
    {
      title: 'Photo Editing Guidelines',
      description: 'Standard editing practices',
      content: `1. Color correction and exposure adjustment\n2. Crop to standard ratios (16:9, 4:3, 1:1)\n3. Watermark with club logo\n4. Export in multiple sizes\n5. Maintain natural look, avoid over-processing`,
      category: 'Editing',
      mandatory: false
    }
  ],
  technical: [
    {
      title: 'Code Documentation Standards',
      description: 'Requirements for code documentation',
      content: `1. Include README.md file\n2. Comment complex functions\n3. Use meaningful variable names\n4. Include setup instructions\n5. List dependencies and versions\n6. Provide usage examples`,
      category: 'Code',
      mandatory: true
    },
    {
      title: 'API Documentation Format',
      description: 'Standard format for API docs',
      content: `1. Endpoint description\n2. HTTP method and URL\n3. Request parameters\n4. Response format\n5. Error codes\n6. Example requests/responses\n7. Authentication requirements`,
      category: 'APIs',
      mandatory: true
    }
  ]
};

export default function DomainRulesModal({ isOpen, onClose, domain, clubId, rules = {}, onRulesUpdate }) {
  const { userProfile, currentUser, checkAdminAccess } = useAuth();
  const [domainRules, setDomainRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    mandatory: false
  });
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (domain && rules) {
      const rulesList = Object.entries(rules).map(([id, rule]) => ({
        id,
        ...rule
      }));
      setDomainRules(rulesList);
    }
  }, [domain, rules]);

  const handleSaveRule = async (ruleData, ruleId = null) => {
    if (!isAdmin || !domain) return;

    try {
      setLoading(true);
      const rulesRef = collection(db, 'clubs', clubId, 'nexus', domain.id, 'rules');
      
      const ruleDoc = {
        ...ruleData,
        updatedAt: serverTimestamp(),
        updatedBy: {
          uid: currentUser?.uid,
          name: userProfile?.name || currentUser?.displayName,
          email: userProfile?.email || currentUser?.email
        }
      };

      if (ruleId) {
        // Update existing rule
        await updateDoc(doc(db, 'clubs', clubId, 'nexus', domain.id, 'rules', ruleId), ruleDoc);
      } else {
        // Create new rule
        ruleDoc.createdAt = serverTimestamp();
        ruleDoc.createdBy = {
          uid: currentUser?.uid,
          name: userProfile?.name || currentUser?.displayName,
          email: userProfile?.email || currentUser?.email
        };
        await addDoc(rulesRef, ruleDoc);
      }

      setEditingRule(null);
      setShowNewRuleForm(false);
      setNewRule({
        title: '',
        description: '',
        content: '',
        category: '',
        mandatory: false
      });
      
      onRulesUpdate();
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!isAdmin || !domain) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'clubs', clubId, 'nexus', domain.id, 'rules', ruleId));
      onRulesUpdate();
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTemplateRules = async () => {
    if (!isAdmin || !domain) return;

    try {
      setLoading(true);
      const templates = RULE_TEMPLATES[domain.id] || [];
      const rulesRef = collection(db, 'clubs', clubId, 'nexus', domain.id, 'rules');

      for (const template of templates) {
        const ruleDoc = {
          ...template,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: {
            uid: userProfile.uid,
            name: userProfile.name,
            email: userProfile.email
          },
          isTemplate: true
        };
        await addDoc(rulesRef, ruleDoc);
      }

      onRulesUpdate();
    } catch (error) {
      console.error('Error adding template rules:', error);
    } finally {
      setLoading(false);
    }
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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings className={`h-6 w-6 text-${domain.color}-500`} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {domain.name} Rules & Guidelines
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Manage domain-specific rules and guidelines
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {!isAdmin ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Admin Access Required
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Only administrators can manage domain rules and guidelines.
                </p>
              </div>
            ) : (
              <>
                {/* Action Buttons */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    onClick={() => setShowNewRuleForm(true)}
                    className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Rule
                  </div>
                  
                  {domainRules.length === 0 && (
                    <div
                      onClick={addTemplateRules}
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FileText className="h-4 w-4" />
                      Add Template Rules
                    </div>
                  )}
                </div>

                {/* New Rule Form */}
                {showNewRuleForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6"
                  >
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Add New Rule
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Rule Title"
                        value={newRule.title}
                        onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                        className="px-3 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      />
                      
                      <select
                        value={newRule.category}
                        onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      >
                        <option value="">Select Category</option>
                        {domain.categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Brief Description"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white mb-4"
                    />
                    
                    <textarea
                      placeholder="Rule Content (detailed guidelines)"
                      value={newRule.content}
                      onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
                      rows={6}
                      className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white mb-4"
                    />
                    
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newRule.mandatory}
                          onChange={(e) => setNewRule({ ...newRule, mandatory: e.target.checked })}
                          className="rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm bg-white text-gray-700 dark:text-gray-300">
                          Mandatory Rule
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveRule(newRule)}
                        disabled={loading || !newRule.title || !newRule.content}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        Save Rule
                      </button>
                      
                      <div
                        onClick={() => {
                          setShowNewRuleForm(false);
                          setNewRule({
                            title: '',
                            description: '',
                            content: '',
                            category: '',
                            mandatory: false
                          });
                        }}
                        className="px-4 cursor-pointer bg-gray-400 rounded-md text-white py-2 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Cancel
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rules List */}
                <div className="space-y-4">
                  {domainRules.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Rules Defined
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start by adding template rules or create custom rules for this domain.
                      </p>
                    </div>
                  ) : (
                    domainRules.map((rule) => (
                      <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                {rule.title}
                              </h4>
                              {rule.mandatory && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
                                  Mandatory
                                </span>
                              )}
                              {rule.category && (
                                <span className={`px-2 py-1 bg-${domain.color}-100 text-${domain.color}-800 dark:bg-${domain.color}-900 dark:text-${domain.color}-200 text-xs rounded-full`}>
                                  {rule.category}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {rule.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div
                              onClick={() => setEditingRule(rule)}
                              className="p-2 cursor-pointer text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit3 className="h-4 w-4" />
                            </div>
                            <div
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-2 cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                            {rule.content}
                          </pre>
                        </div>
                        
                        {rule.updatedAt && (
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            Last updated by {rule.updatedBy?.name} on{' '}
                            {new Date(rule.updatedAt.toDate()).toLocaleDateString()}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
