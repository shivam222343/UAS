import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  UserPlus, 
  CalendarPlus, 
  QrCode, 
  CheckCircle,
  Users,
  Clock,
  Download,
  ArrowRight
} from 'lucide-react';

import { Link } from 'react-router-dom';
const Info = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Joining a Club",
      icon: <UserPlus className="w-8 h-8" />,
      content: [
        "Log in using your Google account",
        "Click 'Join a Club' in your dashboard",
        "Enter the access key provided by your club admin",
        "Get instant access to club meetings and features"
      ],
      animation: {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 }
      }
    },
    {
      title: "Requesting an Access Key",
      icon: <Key className="w-8 h-8" />,
      content: [
        "Contact your club administrator directly",
        "Provide your name and email for verification",
        "Admin generates a unique access key for you",
        "Key expires after 7 days for security"
      ],
      animation: {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
      }
    },
    {
      title: "Admin Generating Keys",
      icon: <Users className="w-8 h-8" />,
      content: [
        "Admins go to 'Manage Club' section",
        "Click 'Generate Access Key'",
        "Set expiration date (default 7 days)",
        "Share key securely with new members"
      ],
      animation: {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
      }
    },
    {
      title: "Creating Meetings",
      icon: <CalendarPlus className="w-8 h-8" />,
      content: [
        "Admins schedule meetings with details",
        "System generates unique Meeting ID",
        "QR code created with club+meeting info",
        "Display QR during meeting for attendance"
      ],
      animation: {
        hidden: { opacity: 0, rotate: -5 },
        visible: { opacity: 1, rotate: 0 }
      }
    },
    {
      title: "Marking Attendance",
      icon: <QrCode className="w-8 h-8" />,
      content: [
        "Open 'Mark Attendance' on your device",
        "Scan the displayed QR code",
        "System verifies your club membership",
        "Instant confirmation with timestamp"
      ],
      animation: {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 }
      }
    },
    {
      title: "Viewing Records",
      icon: <CheckCircle className="w-8 h-8" />,
      content: [
        "Admins see full attendance reports",
        "Filter by date range or member",
        "Export data as CSV/PDF",
        "Users view their personal history"
      ],
      animation: {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0 }
      }
    }
  ];

  const nextStep = () => {
    setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
  };

  const prevStep = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-800 dark:bg-gray-800 dark:text-white  py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold  dark:text-white text-gray-900 mb-4">
            Club Access System Guide
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Learn how to join clubs and manage attendance with access keys
          </p>
        </div>

        <div className="bg-white rounded-2xl dark:bg-gray-800 dark:text-white shadow-xl overflow-hidden">
          {/* Progress Indicator */}
          <div className="flex items-center dark:bg-gray-800 dark:text-white justify-center py-6 bg-gray-50">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => setActiveStep(index)}
                  className={`md:w-8 md:h-8 w-5 h-5 dark:bg-gray-600 dark:text-white rounded-full hover:text-white flex items-center justify-center ${activeStep === index ? 'bg-blue-600 text-white dakr:bg-blue-600 dark:text-white' : 'bg-gray-200 text-gray-600'}`}
                >
                  {index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div className="md:w-8 w-3 h-1 dark:bg-gray-700 dark:text-white bg-gray-200 mx-1"></div>
                )}
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={steps[activeStep].animation}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row items-center"
              >
                <div className="md:w-1/3 mb-8 md:mb-0 flex justify-center">
                  <div className="bg-blue-100 dark:bg-gray-600 dark:text-white p-6 rounded-full text-blue-600">
                    {steps[activeStep].icon}
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <h2 className="text-2xl font-bold dark:bg-gray-800 dark:text-white text-gray-900 mb-6">
                    {steps[activeStep].title}
                  </h2>
                  
                  <ul className="space-y-4">
                    {steps[activeStep].content.map((item, index) => (
                      <motion.li 
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="flex items-start"
                      >
                        <span className="flex-shrink-0 dark:bg-gray-800  dark:text-green-600 bg-green-100 text-green-600 p-1 rounded-full mr-3">
                          <CheckCircle className="w-4 h-4" />
                        </span>
                        <span className="text-gray-700 dark:text-gray-200">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-12">
              <button
                onClick={prevStep}
                className="flex items-center px-6 py-3 dark:bg-gray-700 dark:text-white bg-blue-600 text-white md:rounded-lg hover:bg-blue-700 transition-colorslors"
              >
                <ArrowRight className="w-5 h-5 rotate-180 mr-2" />
                Previous
              </button>
              <button
                onClick={nextStep}
                className="flex items-center px-6 py-3 dark:bg-gray-700 dark:text-white bg-blue-600 text-white md:rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 dark:text-white p-6 rounded-xl shadow-md"
          >
            <div className="bg-purple-100 dark:bg-gray-800 dark:text-purple-600 p-3 rounded-full w-12 h-12 flex items-center justify-center text-purple-600 mb-4">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Secure Access Keys</h3>
            <p className="text-gray-600 dark:text-white">
              Unique, expirable keys ensure only authorized members join your club
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 dark:text-white p-6 rounded-xl shadow-md"
          >
            <div className="bg-green-100 dark:bg-gray-800 dark:text-green-600 p-3 rounded-full w-12 h-12 flex items-center justify-center text-green-600 mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">QR Code Attendance</h3>
            <p className="text-gray-600  dark:text-white">
              Quick, contactless attendance marking with automatic verification
            </p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 dark:bg-gray-800 dark:text-white rounded-xl shadow-md"
          >
            <div className="bg-blue-100 p-3 dark:bg-gray-800 dark:text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-blue-600 mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Detailed Reports</h3>
            <p className="text-gray-600  dark:text-white">
              Export attendance data for record-keeping and analysis
            </p>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 dark:bg-gray-800 dark:text-blue-600 bg-blue-600 rounded-xl p-8 text-center text-white"
        >
          <h2 className="text-2xl text-white font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join a club today or contact your administrator for an access key
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/settings">
              <button className="px-6 py-3 dark:bg-gray-700 dark:text-white bg-blue-700 rounded-lg font-medium hover:bg-blue-800 transition-colors">
                Join a Club
              </button>
            </Link>
           <Link to="/members"> <button className="px-6 py-3 dark:bg-blue-700 dark:text-white bg-blue-700 rounded-lg font-medium hover:bg-blue-800 transition-colors">
              Contact Admin
            </button></Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Info;