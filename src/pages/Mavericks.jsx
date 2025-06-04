import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Lightbulb, 
  Calendar, 
  Trophy, 
  Globe, 
  School,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Mavericks = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      id: 'about',
      icon: <BookOpen size={20} />,
      title: 'About Team Mavericks',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">Who We Are</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Team Mavericks is a dynamic student organization from KIT's College of Engineering, Kolhapur. 
              Founded on August 13, 2016, we're dedicated to student development through innovative events 
              and workshops with our motto "Learning with Fun".
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-purple-600 dark:text-purple-400">Our History</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Established by senior students to enhance student persona and emphasize individual and social growth. 
                We've grown into a central committee dedicated to student development activities.
              </p>
            </div>
            
            <div className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Our Vision</h4>
              <p className="text-gray-700 dark:text-gray-300">
                We foster innovation, creativity, and collaboration through diverse technical and non-technical events. 
                Like true Mavericks, we encourage unorthodox thinking and independent growth.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'events',
      icon: <Calendar size={20} />,
      title: 'Our Events',
      content: (
        <div className="space-y-8">
          <div className="text-center py-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Learning with Fun</h3>
            <p className="text-gray-600 dark:text-gray-400">For the Students, By the Students!</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'BODHANTRA',
                description: '5-day orientation for first-years with technical/non-technical sessions, competitions, and team-building activities.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                name: 'INVICTA',
                description: 'Workshop series covering web development, ethical hacking, soft skills, and mental health for all skill levels.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                name: 'CARNIVAL',
                description: 'IIT Techfest-inspired event with games, exhibits, and competitions to foster creativity and connections.',
                color: 'from-green-500 to-green-600'
              },
              {
                name: 'ARCANE',
                description: 'Virtual treasure hunt promoting critical thinking and teamwork through challenging rounds.',
                color: 'from-amber-500 to-amber-600'
              },
              {
                name: 'SCHOOL VISIT',
                description: 'Rural outreach program introducing AI, robotics, and career guidance to school students.',
                color: 'from-red-500 to-red-600'
              }
            ].map((event, index) => (
              <motion.div
                key={event.name}
                whileHover={{ y: -5 }}
                className={`bg-gradient-to-br ${event.color} p-1 rounded-lg shadow-lg`}
              >
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg h-full">
                  <h4 className="font-bold text-lg mb-2">{event.name}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'achievements',
      icon: <Trophy size={20} />,
      title: 'Achievements',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '50+', label: 'Events Organized' },
              { value: '1000+', label: 'Participants' },
              { value: '20+', label: 'Workshops' },
              { value: '5+', label: 'School Visits' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm text-center border border-gray-200 dark:border-gray-700"
              >
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</p>
                <p className="text-gray-700 dark:text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Impact</h3>
            <ul className="space-y-3 list-disc pl-5 text-gray-700 dark:text-gray-300">
              <li>Transformed first-year student orientation through BODHANTRA</li>
              <li>Bridged urban-rural tech gap with school outreach programs</li>
              <li>Created platform for 1000+ students to develop technical and soft skills</li>
              <li>Fostered culture of innovation and independent thinking</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'outreach',
      icon: <Globe size={20} />,
      title: 'Community Outreach',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-green-600 dark:text-green-400">School Visits</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Our rural outreach program brings technology education to schools in Kolhapur district, 
              covering AI, robotics, blockchain, and career guidance through interactive workshops.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 flex items-center">
                <School className="mr-2 text-amber-500" /> Our Approach
              </h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Hands-on demonstrations</li>
                <li>• Interactive Q&A sessions</li>
                <li>• Career path guidance</li>
                <li>• Follow-up mentorship</li>
              </ul>
            </div>
            
            <div className="p-5 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Impact</h4>
              <p className="text-gray-700 dark:text-gray-300">
                Since 2018, we've reached 15+ rural schools, inspiring 500+ students to explore 
                STEM fields and modern technology careers.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const navigate = (direction) => {
    setCurrentPage(prev => {
      if (direction === 'next') {
        return prev === pages.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? pages.length - 1 : prev - 1;
      }
    });
  };

  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6">
      {/* Navigation Bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center mb-8 sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-full shadow-sm"
      >
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate('prev')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700  text-gray-700 dark:text-gray-300  hover:bg-blue-500 hover:text-white"
            title="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(index)}
              className={`p-2 rounded-full ${currentPage === index ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:text-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              title={page.title}
            >
              {page.icon}
            </button>
          ))}
          
          <button 
            onClick={() => navigate('next')}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white"
            title="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>

      {/* Page Content */}
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, x: currentPage > pages.findIndex(p => p.id === pages[currentPage].id) ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: currentPage > pages.findIndex(p => p.id === pages[currentPage].id) ? -50 : 50 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center justify-center">
          {pages[currentPage].icon}
          <span className="ml-2">{pages[currentPage].title}</span>
        </h2>
        
        {pages[currentPage].content}
      </motion.div>

      {/* Page Indicator */}
      <div className="flex justify-center items-center space-x-2">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`w-3 h-3 rounded-full ${currentPage === index ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            aria-label={`Go to page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Mavericks;