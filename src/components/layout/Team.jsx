import React, { useState } from 'react';
import { Github, Linkedin, Instagram, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Add extra fields to teamData
const teamData = [
  {
    name: "Aakash Desai",
    position: "Team Member",
    email: "aakkidesai4567@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370541/IMG_0384_vc6oui.jpg",
    bio: "Passionate about web development and AI.",
    contact: "9876543210",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/aakashdesai",
    linkedin: "https://linkedin.com/in/aakashdesai",
    instagram: "https://instagram.com/aakashdesai"
  },
  {
    name: "Aaryan Yerudkar",
    position: "Team Member",
    email: "aaryanyerudkar@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Enthusiastic about technology and programming.",
    contact: "9876543211",
    year: "SY",
    department: "Information Technology",
    github: "https://github.com/aaryanyerudkar",
    linkedin: "https://linkedin.com/in/aaryanyerudkar",
    instagram: "https://instagram.com/aaryanyerudkar"
  },
  {
    name: "Aditya Gawai",
    position: "Team Member",
    email: "adityagawai@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890690/IMG_3976_c9dana.jpg",
    bio: "Aspiring full-stack developer.",
    contact: "9876543212",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/adityagawai",
    linkedin: "https://linkedin.com/in/adityagawai",
    instagram: "https://instagram.com/adityagawai"
  },
  {
    name: "Advait Kulkarni",
    position: "Team Member",
    email: "kulkarniadvait108@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370573/IMG_20250225_092849_mlkqi5.jpg",
    bio: "Tech enthusiast and AI researcher.",
    contact: "9876543213",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/advaitkulkarni",
    linkedin: "https://linkedin.com/in/advaitkulkarni",
    instagram: "https://instagram.com/advaitkulkarni"
  },
  {
    name: "Aryada Kajrekar",
    position: "Team Member",
    email: "aryadakajrekar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754427091/IMG-20250701-WA0045_folujt.jpg",
    bio: "Frontend developer and design enthusiast.",
    contact: "9876543214",
    year: "SY",
    department: "Information Technology",
    github: "https://github.com/aryadakajrekar",
    linkedin: "https://linkedin.com/in/aryadakajrekar",
    instagram: "https://instagram.com/aryadakajrekar"
  },
  {
    name: "Ashka Chauhan",
    position: "Team Member",
    email: "ashkachauhan@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Creative thinker and problem solver.",
    contact: "9876543215",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/ashkachauhan",
    linkedin: "https://linkedin.com/in/ashkachauhan",
    instagram: "https://instagram.com/ashkachauhan"
  },
  {
    name: "Bhakti Huddar",
    position: "Team Member",
    email: "bhaktihuddar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886588/IMG_3967_crgnlb.jpg",
    bio: "Backend developer with a passion for databases.",
    contact: "9876543216",
    year: "SY",
    department: "Information Technology",
    github: "https://github.com/bhaktihuddar",
    linkedin: "https://linkedin.com/in/bhaktihuddar",
    instagram: "https://instagram.com/bhaktihuddar"
  },
  {
    name: "Bhavesh Ahuja",
    position: "Team Member",
    email: "bhaveshahuja0302@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370439/Screenshot_2025-02-19_140653_ivu7gx.png",
    bio: "Open-source enthusiast and web developer.",
    contact: "9876543217",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/bhaveshahuja",
    linkedin: "https://linkedin.com/in/bhaveshahuja",
    instagram: "https://instagram.com/bhaveshahuja"
  },
  {
    name: "Chinmayee Pawar",
    position: "Team Member",
    email: "chinmayeepawar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370438/chinmayi_nabc2z.jpg",
    bio: "UI/UX designer and frontend developer.",
    contact: "9876543218",
    year: "SY",
    department: "Information Technology",
    github: "https://github.com/chinmayeepawar",
    linkedin: "https://linkedin.com/in/chinmayeepawar",
    instagram: "https://instagram.com/chinmayeepawar"
  },
  {
    name: "Haripriya Patil",
    position: "Team Member",
    email: "haripriyapatil@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Data science enthusiast and Python developer.",
    contact: "9876543219",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/haripriyapatil",
    linkedin: "https://linkedin.com/in/haripriyapatil",
    instagram: "https://instagram.com/haripriyapatil"
  },
  {
    name: "Hrushikesh Tamhankar",
    position: "Team Member",
    email: "hvttamhankar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370536/IMG_8576_pvc6yx.jpg",
    bio: "Enthusiastic about cloud computing and DevOps.",
    contact: "9876543220",
    year: "SY",
    department: "Information Technology",
    github: "https://github.com/hrushikesh",
    linkedin: "https://linkedin.com/in/hrushikesh",
    instagram: "https://instagram.com/hrushikesh"
  },
  {
    name: "Ishwari Ambrale",
    position: "Team Member",
    email: "ambraleishwari2912@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Aspiring data analyst and SQL lover.",
    contact: "9876543221",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/ishwariambrale",
    linkedin: "https://linkedin.com/in/ishwariambrale",
    instagram: "https://instagram.com/ishwariambrale"
  },
  {
    name: "Jayesh Jagatkar",
    position: "Team Member",
    email: "jayeshjagatkar55@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370515/_SSG2451_s45lnd.jpg",
    bio: "Machine learning enthusiast and Python developer.",
    contact: "9876543222",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/jayeshjagatkar",
    linkedin: "https://linkedin.com/in/jayeshjagatkar",
    instagram: "https://instagram.com/jayeshjagatkar"
  },
  {
    name: "Karan Gitte",
    position: "Team Member",
    email: "karangitte@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Blockchain enthusiast and developer.",
    contact: "9876543223",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/karangitte",
    linkedin: "https://linkedin.com/in/karangitte",
    instagram: "https://instagram.com/karangitte"
  },
  {
    name: "Karan Patil",
    position: "Team Member",
    email: "karanvpatil703@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370543/IMG-20250721-WA0025_faerp6.jpg",
    bio: "Cybersecurity enthusiast and ethical hacker.",
    contact: "9876543224",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/karanpatil",
    linkedin: "https://linkedin.com/in/karanpatil",
    instagram: "https://instagram.com/karanpatil"
  },
  {
    name: "Ketan Shingana",
    position: "Team Member",
    email: "ketanshingana12@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370542/IMG_20241207_084901_srqrmc.jpg",
    bio: "Enthusiastic about IoT and embedded systems.",
    contact: "9876543225",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/ketanshingana",
    linkedin: "https://linkedin.com/in/ketanshingana",
    instagram: "https://instagram.com/ketanshingana"
  },
  {
    name: "Maithili Dhopate",
    position: "Team Member",
    email: "maithilidhopate@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20241031-WA0126_efztab.jpg",
    bio: "Tech blogger and web developer.",
    contact: "9876543226",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/maithilidhopate",
    linkedin: "https://linkedin.com/in/maithilidhopate",
    instagram: "https://instagram.com/maithilidhopate"
  },
  {
    name: "Mahika Savardekar",
    position: "Team Member",
    email: "mahikasavardekar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886365/IMG_3908_voefsa.jpg",
    bio: "AI and ML enthusiast.",
    contact: "9876543227",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/mahikasavardekar",
    linkedin: "https://linkedin.com/in/mahikasavardekar",
    instagram: "https://instagram.com/mahikasavardekar"
  },
  {
    name: "Mangeresh Prabhavalkar",
    position: "Team Member",
    email: "mangereshprabhavalkar@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Enthusiastic about software development and AI.",
    contact: "9876543228",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/mangereshprabhavalkar",
    linkedin: "https://linkedin.com/in/mangereshprabhavalkar",
    instagram: "https://instagram.com/mangereshprabhavalkar"
  },
  {
    name: "Neha Jagtap",
    position: "Team Member",
    email: "nehajagtap@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Aspiring software engineer and tech enthusiast.",
    contact: "9876543229",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/nehajagtap",
    linkedin: "https://linkedin.com/in/nehajagtap",
    instagram: "https://instagram.com/nehajagtap"
  },
  {
    name: "Niranjan Ambi",
    position: "Team Member",
    email: "niranjanambi154@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Passionate about open-source and web technologies.",
    contact: "9876543230",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/niranjanambi",
    linkedin: "https://linkedin.com/in/niranjanambi",
    instagram: "https://instagram.com/niranjanambi"
  },
  {
    name: "Om Mali",
    position: "Team Member",
    email: "om542058@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370551/ommalis_edits-20250721-0001_fuuy5q.jpg",
    bio: "DevOps enthusiast and cloud architect.",
    contact: "9876543231",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/ommali",
    linkedin: "https://linkedin.com/in/ommali",
    instagram: "https://instagram.com/ommali"
  },
  {
    name: "Parth Chavan",
    position: "Team Member",
    email: "parthchavan@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886577/IMG_3966_qr4jts.jpg",
    bio: "Enthusiastic about mobile app development.",
    contact: "9876543232",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/parthchavan",
    linkedin: "https://linkedin.com/in/parthchavan",
    instagram: "https://instagram.com/parthchavan"
  },
  {
    name: "Piyush Jadhav",
    position: "Team Member",
    email: "jadhavpiyush2927@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Tech enthusiast and software developer.",
    contact: "9876543233",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/piyushjadhav",
    linkedin: "https://linkedin.com/in/piyushjadhav",
    instagram: "https://instagram.com/piyushjadhav"
  },
  {
    name: "Pranali Bedkyale",
    position: "Team Member",
    email: "pranalibedkyale@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753887058/IMG_3940_ve0otw.jpg",
    bio: "Aspiring web developer and designer.",
    contact: "9876543234",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/pranalibedkyale",
    linkedin: "https://linkedin.com/in/pranalibedkyale",
    instagram: "https://instagram.com/pranalibedkyale"
  },
  {
    name: "Rahul Patil",
    position: "Team Member",
    email: "rahulpatil@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753892014/IMG_3907_hefnxm.jpg",
    bio: "Cybersecurity analyst and ethical hacking enthusiast.",
    contact: "9876543235",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/rahulpatil",
    linkedin: "https://linkedin.com/in/rahulpatil",
    instagram: "https://instagram.com/rahulpatil"
  },
  {
    name: "Sakshi Gaikwad",
    position: "Team Member",
    email: "sakshi5@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370582/IMG_0315_wziwfk.jpg",
    bio: "Passionate about software development and AI.",
    contact: "9876543236",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/sakshigaikwad",
    linkedin: "https://linkedin.com/in/sakshigaikwad",
    instagram: "https://instagram.com/sakshigaikwad"
  },
  {
    name: "Sangram Nevase",
    position: "Team Member",
    email: "sangram.nvaes35@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370569/Sangram_Nevase_b2ppek.jpg",
    bio: "Enthusiastic about web development and design.",
    contact: "9876543237",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/sangramnevase",
    linkedin: "https://linkedin.com/in/sangramnevase",
    instagram: "https://instagram.com/sangramnevase"
  },
  {
    name: "Sarthaki Dixit",
    position: "Team Member",
    email: "sarthakidixit@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886575/IMG_3954_uk9sya.jpg",
    bio: "Tech enthusiast and software developer.",
    contact: "9876543238",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/sarthakidixit",
    linkedin: "https://linkedin.com/in/sarthakidixit",
    instagram: "https://instagram.com/sarthakidixit"
  },
  {
    name: "Sayali Koshti",
    position: "Team Member",
    email: "koshtisayali5@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Aspiring software engineer and tech enthusiast.",
    contact: "9876543239",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/sayalikoshti",
    linkedin: "https://linkedin.com/in/sayalikoshti",
    instagram: "https://instagram.com/sayalikoshti"
  },
  {
    name: "Sayali Shinde",
    position: "Team Member",
    email: "sayalishinde@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370456/Sayali_Shinde_ciuees.jpg",
    bio: "Frontend developer and design enthusiast.",
    contact: "9876543240",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/sayalishinde",
    linkedin: "https://linkedin.com/in/sayalishinde",
    instagram: "https://instagram.com/sayalishinde"
  },
  {
    name: "Shivam Dombe",
    position: "Team Member",
    email: "dombeshivam80@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754424841/Untitled-1_m2dc2w.png",
    bio: "Full-stack developer and tech enthusiast.",
    contact: "9876543241",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/shivam222343",
    linkedin: "https://www.linkedin.com/in/shivam-dombe-390798296/",
    instagram: "https://www.instagram.com/shivam_dombe0077/"
  },
  {
    name: "Shreeya Dhond",
    position: "Team Member",
    email: "shreeyadhond@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Aspiring software developer and tech enthusiast.",
    contact: "9876543242",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/shreeyadhond",
    linkedin: "https://linkedin.com/in/shreeyadhond",
    instagram: "https://instagram.com/shreeyadhond"
  },
  {
    name: "Shruti Narke",
    position: "Team Member",
    email: "shrutinarke1007@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20230709-WA0007_oyt5to.jpg",
    bio: "Tech enthusiast and software developer.",
    contact: "9876543243",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/shrutinarke",
    linkedin: "https://linkedin.com/in/shrutinarke",
    instagram: "https://instagram.com/shrutinarke"
  },
  {
    name: "Shruti Powar",
    position: "Team Member",
    email: "shrutipowar1144@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370571/IMG-20241214-WA0180_ck3rmq.jpg",
    bio: "Aspiring data scientist and AI enthusiast.",
    contact: "9876543244",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/shrutipowar",
    linkedin: "https://linkedin.com/in/shrutipowar",
    instagram: "https://instagram.com/shrutipowar"
  },
  {
    name: "Siddhant Sadalage",
    position: "Team Member",
    email: "siddhant@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "Passionate about software development and AI.",
    contact: "9876543245",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/siddhantsadalage",
    linkedin: "https://linkedin.com/in/siddhantsadalage",
    instagram: "https://instagram.com/siddhantsadalage"
  },
  {
    name: "Siddhi Kumbhar",
    position: "Team Member",
    email: "siddhikumbhar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Tech enthusiast and software developer.",
    contact: "9876543246",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/siddhikumbhar",
    linkedin: "https://linkedin.com/in/siddhikumbhar",
    instagram: "https://instagram.com/siddhikumbhar"
  },
  {
    name: "Siya Yernalkar",
    position: "Team Member",
    email: "siyayernalkar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Aspiring software engineer and tech enthusiast.",
    contact: "9876543247",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/siyayernalkar",
    linkedin: "https://linkedin.com/in/siyayernalkar",
    instagram: "https://instagram.com/siyayernalkar"
  },
  {
    name: "Sneha Inamdar",
    position: "Team Member",
    email: "snehainamdar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Passionate about web development and AI.",
    contact: "9876543248",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/snehainamdar",
    linkedin: "https://linkedin.com/in/snehainamdar",
    instagram: "https://instagram.com/snehainamdar"
  },
  {
    name: "Swati Sanap",
    position: "Team Member",
    email: "swatisanap@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "Enthusiastic about software development and AI.",
    contact: "9876543249",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/swatisanap",
    linkedin: "https://linkedin.com/in/swatisanap",
    instagram: "https://instagram.com/swatisanap"
  },
  {
    name: "Venu Kamble",
    position: "Team Member",
    email: "venukamble@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890758/IMG_3949_vgn5jm.jpg",
    bio: "Cloud computing enthusiast and developer.",
    contact: "9876543250",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/venukamble",
    linkedin: "https://linkedin.com/in/venukamble",
    instagram: "https://instagram.com/venukamble"
  },
  {
    name: "Veer Metri",
    position: "Team Member",
    email: "veermetri05@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370441/Veer_Metri_w67cwt.jpg",
    bio: "Software developer and tech enthusiast.",
    contact: "9876543251",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/veermetri",
    linkedin: "https://linkedin.com/in/veermetri",
    instagram: "https://instagram.com/veermetri"
  },
  {
    name: "Vinayak Tale",
    position: "Team Member",
    email: "vinayaktale@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886364/IMG_3946_ev1lsf.jpg",
    bio: "Passionate about software development and AI.",
    contact: "9876543252",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/vinayaktale",
    linkedin: "https://linkedin.com/in/vinayaktale",
    instagram: "https://instagram.com/vinayaktale"
  },
  {
    name: "Yashraj Kulgude",
    position: "Team Member",
    email: "yashrajkulgude1045@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370509/DSC_8482_1_yxocoi.jpg",
    bio: "Aspiring software engineer and tech enthusiast.",
    contact: "9876543253",
    year: "SY",
    department: "Computer Engineering",
    github: "https://github.com/yashrajkulgude",
    linkedin: "https://linkedin.com/in/yashrajkulgude",
    instagram: "https://instagram.com/yashrajkulgude"
  }
];

const Team = () => {
  const [selectedMember, setSelectedMember] = useState(null);

  const handleInfoClick = (member) => {
    setSelectedMember(member);
    // Remove this line to prevent scrolling to top
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closePopup = () => {
    setSelectedMember(null);
  };

  return (
    <div
      className="min-h-screen py-10 px-6 bg-white dark:bg-gray-900 transition-colors duration-300"
      style={{ scrollBehavior: 'smooth' }} // Smooth scrolling
    >
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">Meet Our Team</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {teamData.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            <img
              src={member.img}
              alt={member.name}
              className="w-full rounded-lg h-80 object-cover"
              loading="lazy" // Lazy loading for images
            />
            <div className="flex justify-between">
              <div className='p-4'>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-3">{member.position}</p>
                <div className="flex gap-4 text-xl text-gray-700 dark:text-gray-300">
                  <a className='cursor-pointer hover:text-pink-600 ' href={member.github} target="_blank" rel="noopener noreferrer"><Github size={20} /></a>
                  <a className='cursor-pointer hover:text-pink-600 ' href={member.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>
                  <a className='cursor-pointer hover:text-pink-600 ' href={member.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>
                </div>
              </div>
              <div
                onClick={() => handleInfoClick(member)}
                className='mr-3 duration-200 hover:text-green-600 cursor-pointer mt-6 text-blue-400'
              >
                <Info />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Popup for member info */}
      <AnimatePresence>
        {selectedMember && (
          <div
            className="fixed px-2 md:px-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full relative"
            >
              <div
                onClick={closePopup}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
              >
                <X size={24} />
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={selectedMember.img}
                  alt={selectedMember.name}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                  loading="lazy" // Lazy loading for popup image
                />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedMember.name}</h2>
                <p className="text-lg text-blue-500 dark:text-blue-300 mb-2">{selectedMember.position}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedMember.bio}</p>
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Email:</span> {selectedMember.email}
                </div>
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Contact:</span> {selectedMember.contact}
                </div>
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Year:</span> {selectedMember.year}
                </div>
                <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Department:</span> {selectedMember.department}
                </div>
                <div className="flex gap-4 mt-4 text-xl text-gray-700 dark:text-gray-300">
                  <a className='cursor-pointer hover:text-pink-600 ' href={selectedMember.github} target="_blank" rel="noopener noreferrer"><Github size={20} /></a>
                  <a className='cursor-pointer hover:text-pink-600 ' href={selectedMember.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>
                  <a className='cursor-pointer hover:text-pink-600 ' href={selectedMember.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Team;
