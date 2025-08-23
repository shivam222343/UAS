import React, { useState } from 'react';
import { Github, Linkedin, Instagram, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Team = () => {
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Birthday messages array
  const birthdayMessages = [
    "🎉 Happy Birthday!",
    "🥳 Wishing you a fantastic birthday!",
    "🎂 Have a wonderful birthday!",
    "🌟 Cheers to your special day!",
    "🎈 Celebrate and enjoy your day!",
  ];

  const teamData = [
  {
    name: "Aakash Desai",
    position: "Team Member",
    email: "aakkidesai4567@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370541/IMG_0384_vc6oui.jpg",
    bio: "A creative soul who finds joy in music as much as in coding. Always up for deep conversations about life and technology.",
    contact: "+91 97679 94567",
    year: "Third Year",
    department: "Computer Science and Business System",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/aakashdesai22/",
    dateOfBirth: "2005-12-22"
  },
  {
    name: "Aaryada Kajarekar",
    position: "Team Member",
    email: "aaryadakajarekar126@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754427091/IMG-20250701-WA0045_folujt.jpg",
    bio: "A vibrant personality with an eye for design. Brings creativity to everything from code to casual conversations.",
    contact: "+91 87889 21683",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/aaryada_22/",
    dateOfBirth: "2006-11-22"
  },
  {
    name: "Aaryan Yerudkar",
    position: "Team Member",
    email: "yerudkaraaryan@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754764778/IMG_3919_pbjcii.jpg",
    bio: "A cheerful team player who brings positive energy everywhere. Loves outdoor activities and is always ready for an adventure.",
    contact: "+91 72191 68635",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-12-01"
  },
  {
    name: "Aditya Gawai",
    position: "Team Member",
    email: "adityagawai9d@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890690/IMG_3976_c9dana.jpg",
    bio: "A thoughtful observer who notices the little things. Enjoys quiet evenings with books as much as lively coding sessions.",
    contact: "+91 91306 40827",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "https://github.com/aditya-gawai",
    linkedin: "https://www.linkedin.com/in/aditya-gawai-a4373532a/",
    instagram: "https://www.instagram.com/aditya__gawai/",
    dateOfBirth: "2006-06-12"
  },
  {
    name: "Advait Kulkarni",
    position: "Team Member",
    email: "kulkarniadvait108@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370573/IMG_20250225_092849_mlkqi5.jpg",
    bio: "A curious mind who's always asking 'why'. Finds equal excitement in solving puzzles and exploring new technologies.",
    contact: "+91 95791 51448",
    year: "Third Year",
    department: "Electronics and Telecommunication",
    github: "",
    linkedin: "https://www.linkedin.com/in/advait-kulkarni-2617392b4/",
    instagram: "https://www.instagram.com/advait_kulkarni_47/",
    dateOfBirth: "2006-06-14"
  },
  {
    name: "Ashka Chauhan",
    position: "Team Member",
    email: "ashkachauhan3204@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754764390/IMG-20240912-WA0010_tv6xql.jpg",
    bio: "A warm presence who makes everyone feel included. Finds joy in both solving complex problems and simple pleasures.",
    contact: "+91 87674 92566",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-10-08"
  },
  {
    name: "Bhakti Huddar",
    position: "Team Member",
    email: "phuddarbhakti06@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886588/IMG_3967_crgnlb.jpg",
    bio: "A determined spirit with a gentle heart. Approaches challenges with both analytical thinking and emotional intelligence.",
    contact: "+91 70224 29830",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-06-13"
  },
  {
    name: "Bhavesh Ahuja",
    position: "Team Member",
    email: "bhaveshahuja0302@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370439/Screenshot_2025-02-19_140653_ivu7gx.png",
    bio: "A natural leader who inspires those around him. Balances big-picture thinking with attention to detail.",
    contact: "+91 77448 83100",
    year: "Btech",
    department: "Artificial Intelligence and Data Science",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/bhavesh.0326/",
    dateOfBirth: "2004-07-03"
  },
  {
    name: "Chinmayee Pawar",
    position: "Team Member",
    email: "chinmayeepawar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370438/chinmayi_nabc2z.jpg",
    bio: "An artistic soul who sees beauty in structure and design. Equally passionate about aesthetics and functionality.",
    contact: "+91 96998 31071",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/chiiinmayi/",
    dateOfBirth: "2005-06-30"
  },
  {
    name: "Haripriya Patil",
    position: "Team Member",
    email: "saeepatil1895@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A cheerful optimist who brightens every room. Approaches challenges with enthusiasm and a can-do attitude.",
    contact: "+91 79724 54737",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "https://github.com/haripriyapatil",
    linkedin: "https://linkedin.com/in/haripriyapatil",
    instagram: "https://instagram.com/haripriyapatil",
    dateOfBirth: "2005-09-18"
  },
  {
    name: "Hrushikesh Tamhankar",
    position: "Team Member",
    email: "hvttamhankar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370536/IMG_8576_pvc6yx.jpg",
    bio: "A calm presence with a sharp mind. Enjoys both technical challenges and quiet moments of reflection.",
    contact: "9876543220",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/hrushis_photography/",
    dateOfBirth: "2005-12-29"
  },
  {
    name: "Ishwari Ambrale",
    position: "Team Member",
    email: "ambraleishwari2912@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754575660/WhatsApp_Image_2025-08-07_at_19.36.22_f06a77db_trjv64.jpg",
    bio: "A thoughtful listener who offers insightful perspectives. Values both logical analysis and human connection.",
    contact: "9876543221",
    year: "Third Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin:"https://www.linkedin.com/in/ishwari-ambrale-099b26320/",
    instagram: "https://www.instagram.com/ishwari_2924/",
    dateOfBirth: "2005-12-29"
  },
  {
    name: "Jayesh Jagatkar",
    position: "Team Member",
    email: "jayeshjagatkar55@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370515/_SSG2451_s45lnd.jpg",
    bio: "An energetic go-getter who thrives on challenges. Brings passion to both work and play.",
    contact: "+91 77748 45855",
    year: "Btech",
    department: "Biotechnology",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2001-07-18"
  },
  {
    name: "Karan Gitte",
    position: "Team Member",
    email: "karangitte8@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754574376/Untitled_design_5_f5lhat.png",
    bio: "A loyal friend and reliable team player. Values honesty and brings authenticity to every interaction.",
    contact: "+91 74209 03112",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/its_karan158/",
    dateOfBirth: "2006-08-08"
  },
  {
    name: "Karan Patil",
    position: "Team Member",
    email: "karanvpatil703@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370543/IMG-20250721-WA0025_faerp6.jpg",
    bio: "A strategic thinker with a playful side. Knows when to be serious and when to lighten the mood.",
    contact: "+91 83295 75701",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/karanpatil_03_/",
    dateOfBirth: "2004-07-24"
  },
  {
    name: "Ketan Shingana",
    position: "Team Member",
    email: "ketanshingana12@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370542/IMG_20241207_084901_srqrmc.jpg",
    bio: "A patient mentor who enjoys helping others grow. Combines technical knowledge with teaching skills.",
    contact: "+91 74984 94963",
    year: "Third Year",
    department: "Electrical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-03-12"
  },
  {
    name: "Maithili Dhopate",
    position: "Team Member",
    email: "maithilidhopate@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20241031-WA0126_efztab.jpg",
    bio: "An expressive communicator who connects ideas and people. Loves sharing knowledge through writing and speaking.",
    contact: "+91 95183 88040",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/dhopate_maithili9/",
    dateOfBirth: "2005-02-09"
  },
  {
    name: "Mahika Savardekar",
    position: "Team Member",
    email: "mahikasavardekar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886365/IMG_3908_voefsa.jpg",
    bio: "A confident individual with a balanced perspective. Values both technical excellence and personal growth.",
    contact: "+91 72769 14050",
    year: "Second Year",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-07-02"
  },
  {
    name: "Mangeresh Prabhavalkar",
    position: "Team Member",
    email: "mangereshprabhavalkar@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "An innovative thinker who connects seemingly unrelated ideas. Finds inspiration in both technology and nature.",
    contact: "9876543228",
    year: "Second Year",
    department: "Computer Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "Not specified"
  },
  {
    name: "Neha Jagtap",
    position: "Team Member",
    email: "jagtapneha54@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A diligent learner with a cheerful disposition. Finds balance between academic rigor and creative expression.",
    contact: "+91 86688 65503",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-10-01"
  },
  {
    name: "Niranjan Ambi",
    position: "Team Member",
    email: "niranjanambi154@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "A principled individual with strong values. Approaches both life and technology with integrity and curiosity.",
    contact: "+91 84210 99831",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/niranjanambi/",
    dateOfBirth: "2005-07-18"
  },
  {
    name: "Om Mali",
    position: "Team Member",
    email: "om542058@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370551/ommalis_edits-20250721-0001_fuuy5q.jpg",
    bio: "A focused individual with a zen-like approach to challenges. Finds balance in both work and personal life.",
    contact: "+91 86689 90062",
    year: "Third Year",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/ommali031/",
    dateOfBirth: "2004-12-31"
  },
  {
    name: "Parth Chavan",
    position: "Team Member",
    email: "parthchavancds@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886577/IMG_3966_qr4jts.jpg",
    bio: "An adaptable problem-solver with a good sense of humor. Values both innovation and tradition.",
    contact: "+91 96997 08599",
    year: "Second Year",
    department: "Civil and Environmental Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-01-20"
  },
  {
    name: "Piyush Jadhav",
    position: "Team Member",
    email: "jadhavpiyush2927@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754764717/1745075461955_kecgt5.jpg",
    bio: "A quick learner who thrives in dynamic environments. Brings enthusiasm to both technical and social interactions.",
    contact: "+91 87673 46766",
    year: "Third Year",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-08-27"
  },
  {
    name: "Pranali Bedkyale",
    position: "Team Member",
    email: "pranalibedkyale@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753887058/IMG_3940_ve0otw.jpg",
    bio: "A nurturing presence who supports her peers. Combines technical skills with emotional intelligence.",
    contact: "+91 70585 42189",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-10-21"
  },
  {
    name: "Rahul Patil",
    position: "Team Member",
    email: "rahulpadmakarpatil41@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753892014/IMG_3907_hefnxm.jpg",
    bio: "A determined individual with a collaborative spirit. Believes in the power of teamwork and persistence.",
    contact: "+91 78759 21162",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/rahulp_14/",
    dateOfBirth: "2006-04-14"
  },
  {
    name: "Sakshi Gaikwad",
    position: "Team Member",
    email: "sakshi5@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754575490/IMG_0315_sb0iqc.jpg",
    bio: "A perceptive individual with a knack for understanding people. Brings both technical skill and emotional awareness to teamwork.",
    contact: "+91 89831 06406",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/sakshigaikwad1694/",
    dateOfBirth: "2004-09-16"
  },
  {
    name: "Sangram Nevase",
    position: "Team Member",
    email: "sangram.nvaes35@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370569/Sangram_Nevase_b2ppek.jpg",
    bio: "A grounded individual with strong roots and big dreams. Approaches both life and technology with equal passion.",
    contact: "+91 96609 40586",
    year: "Third Year",
    department: "Electronics and Telecommunication",
    github: "",
    linkedin: "https://www.linkedin.com/in/sangram-nevase/",
    instagram: "",
    dateOfBirth: "2004-09-28"
  },
  {
    name: "Sarthaki Dixit",
    position: "Team Member",
    email: "sarthakidixit5@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886575/IMG_3954_uk9sya.jpg",
    bio: "An analytical thinker with a warm personality. Enjoys both logical puzzles and meaningful conversations.",
    contact: "+91 98601 70537",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/sarthaki_dixit/",
    dateOfBirth: "2006-02-07"
  },
  {
    name: "Sayali Koshti",
    position: "Team Member",
    email: "koshtisayali5@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A free spirit who thinks outside the box. Brings fresh perspectives to both technical and creative challenges.",
    contact: "+91 82085 92006",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "https://www.linkedin.com/in/sayali-koshti-08a33229a/",
    instagram: "https://www.instagram.com/sayali_koshti_987/",
    dateOfBirth: "2005-05-25"
  },
  {
    name: "Sayali Shinde",
    position: "Team Member",
    email: "saylishinde2704@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370456/Sayali_Shinde_ciuees.jpg",
    bio: "A compassionate team player with keen attention to detail. Finds joy in both creating solutions and building relationships.",
    contact: "+91 70206 73602",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "https://www.linkedin.com/in/sayali-shinde-9a767a316/",
    instagram: "https://www.instagram.com/imsayali_shinde/",
    dateOfBirth: "2005-09-21"
  },
  {
    name: "Shivam Dombe",
    position: "Team Member",
    email: "dombeshivam80@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754575773/Untitled_design_4_pthpqq.png",
    bio: "A dynamic individual who adapts quickly to change. Brings energy and focus to every project.",
    contact: "+91 80109 61216",
    year: "Third Year",
    department: "Computer Science and Business System",
    github: "https://github.com/shivam222343",
    linkedin: "https://www.linkedin.com/in/shivam-dombe-390798296/",
    instagram: "https://www.instagram.com/shivam_dombe0077/",
    dateOfBirth: "2005-08-21"
  },
  {
    name: "Shreeya Dhond",
    position: "Team Member",
    email: "shreeyadhond@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A kind-hearted individual who values meaningful connections. Approaches technology with both skill and humanity.",
    contact: "+91 83298 32867",
    year: "Third Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "https://www.linkedin.com/in/shreeya-dhond-45576a2b0/",
    instagram: "",
    dateOfBirth: "2005-09-28"
  },
  {
    name: "Shruti Narke",
    position: "Team Member",
    email: "shrutinarke1007@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20230709-WA0007_oyt5to.jpg",
    bio: "A meticulous worker who takes pride in quality. Believes in doing things right the first time.",
    contact: "+91 96891 42447",
    year: "Third Year",
    department: "Computer Engineering",
    github: "",
    linkedin: "https://www.linkedin.com/in/shruti-narke-4a54a22b0/",
    instagram: "",
    dateOfBirth: "2005-07-10"
  },
  {
    name: "Shruti Powar",
    position: "Team Member",
    email: "shrutipowar1144@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370571/IMG-20241214-WA0180_ck3rmq.jpg",
    bio: "A visionary who sees possibilities where others see obstacles. Combines creativity with technical prowess.",
    contact: "+91 74993 21144",
    year: "Btech",
    department: "Computer Engineering",
    github: "",
    linkedin: "https://www.linkedin.com/in/shrutipowar/",
    instagram: "",
    dateOfBirth: "2004-02-18"
  },
  {
    name: "Siddhant Sadalage",
    position: "Team Member",
    email: "siddhant@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "A strategic thinker who plans several steps ahead. Approaches both life and code with careful consideration.",
    contact: "+91 94046 29747",
    year: "Btech",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2004-02-15"
  },
  {
    name: "Siddhi Kumbhar",
    position: "Team Member",
    email: "siddhikumbhar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A resilient individual who learns from every experience. Faces challenges with grace and determination.",
    contact: "+91 84321 72875",
    year: "Third Year",
    department: "Electrical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-12-20"
  },
  {
    name: "Siya Yaranalkar",
    position: "Team Member",
    email: "siyayaranalkar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "An enthusiastic learner with a creative spark. Approaches challenges with curiosity and optimism.",
    contact: "+91 86683 74297",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/see_yeah06/",
    dateOfBirth: "2006-08-06"
  },
  {
    name: "Sneha Inamdar",
    position: "Team Member",
    email: "snehapinamdar2006@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754757426/WhatsApp_Image_2025-08-09_at_21.58.49_f70e6a42_dagqhq.jpg",
    bio: "A meticulous worker with a kind heart. Takes pride in both the quality of her work and her relationships.",
    contact: "+91 86000 36971",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/sneha._.2006?igsh=aWpxenA5a2g2c2R5",
    dateOfBirth: "2006-08-10"
  },
  {
    name: "Swati Sanap",
    position: "Team Member",
    email: "swatisanap2005@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754574024/Untitled_design_4_ndfcrg.png",
    bio: "An organized individual with a creative flair. Balances structure with spontaneity in both work and life.",
    contact: "+91 97643 41424",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-01-07"
  },
  {
    name: "Venu Kamble",
    position: "Team Member",
    email: "kamblevenu204@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890758/IMG_3949_vgn5jm.jpg",
    bio: "A resilient individual with a solutions-oriented mindset. Faces challenges with calm determination.",
    contact: "+91 91569 81383",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2004-06-28"
  },
  {
    name: "Veer Metri",
    position: "Team Member",
    email: "veermetri05@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370441/Veer_Metri_w67cwt.jpg",
    bio: "A passionate individual who throws himself fully into his interests. Approaches both work and play with equal enthusiasm.",
    contact: "+91 88550 67441",
    year: "Btech",
    department: "Artificial Intelligence and Machine Learning",
    github: "",
    linkedin: "https://www.linkedin.com/in/veermetri05/",
    instagram: "https://www.instagram.com/metri.veer/",
    dateOfBirth: "2005-05-10"
  },
  {
    name: "Vinayak Tale",
    position: "Team Member",
    email: "vinayak912v@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886364/IMG_3946_ev1lsf.jpg",
    bio: "A practical innovator who bridges ideas and implementation. Enjoys both theoretical concepts and hands-on work.",
    contact: "+91 96897 28072",
    year: "Second Year",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "https://www.linkedin.com/in/vinayak-tale-468794352?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    instagram: "https://www.instagram.com/_vnykkk_?utm_source=qr&igsh=anQzdzcwZjBkdXNy",
    dateOfBirth: "2005-12-09"
  },
  {
    name: "Yashraj Kulgude",
    position: "Team Member",
    email: "yashrajkulgude1045@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370509/DSC_8482_1_yxocoi.jpg",
    bio: "A charismatic individual who leads by example. Combines technical expertise with strong interpersonal skills.",
    contact: "+91 98236 15596",
    year: "Third Year",
    department: "Computer Science and Engineering",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/yashraj_kulgude/",
    dateOfBirth: "2005-04-10"
  }
];


  // Confetti effect function
  const shootConfetti = () => {
    const confettiCount = 100;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = '-10px';
      confetti.style.zIndex = '9999';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      document.body.appendChild(confetti);
      
      const animation = confetti.animate([
        { top: '-10px', opacity: 1 },
        { top: `${Math.random() * 100}vh`, opacity: 0 }
      ], {
        duration: 2000 + Math.random() * 3000,
        easing: 'cubic-bezier(0.1, 0.2, 0.3, 1)'
      });
      
      animation.onfinish = () => confetti.remove();
    }
  };

  // Check for birthdays
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');

  // Find member whose birthday is today
  const birthdayMember = teamData.find(member => {
    if (!member.dateOfBirth) return false;
    const parts = member.dateOfBirth.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return parts[2] === todayDay && parts[1] === todayMonth;
      } else {
        return parts[0] === todayDay && parts[1] === todayMonth;
      }
    }
    return false;
  });

  const [showBirthday, setShowBirthday] = useState(!!birthdayMember);
  const [isHoveringPopup, setIsHoveringPopup] = useState(false);

  React.useEffect(() => {
    let timer;
    if (showBirthday && birthdayMember && !isHoveringPopup) {
      shootConfetti();
      timer = setTimeout(() => setShowBirthday(false), 10000);
    }
    return () => clearTimeout(timer);
  }, [showBirthday, birthdayMember, isHoveringPopup]);

  const randomMsg = birthdayMessages[Math.floor(Math.random() * birthdayMessages.length)];

  const handleInfoClick = (member) => {
    setSelectedMember(member);
  };

  const closePopup = () => {
    setSelectedMember(null);
  };

  return (
    <>
      {/* Birthday Popup - Centered on screen */}
      <AnimatePresence>
        {showBirthday && birthdayMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              onMouseEnter={() => setIsHoveringPopup(true)}
              onMouseLeave={() => setIsHoveringPopup(false)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🎂</div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{randomMsg}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Today is <span className="font-semibold">{birthdayMember.name}</span>'s birthday!
                </p>
                
                <div className="flex justify-center gap-4">
                  {birthdayMember.instagram && (
                    <a
                      href={birthdayMember.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <Instagram size={18} />
                      Wish on Instagram
                    </a>
                  )}
                  <button
                    onClick={() => setShowBirthday(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div
        className="min-h-screen py-10 px-6 bg-white dark:bg-gray-900 transition-colors duration-300"
        style={{ scrollBehavior: 'smooth' }}
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
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
                birthdayMember && birthdayMember.name === member.name ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={member.img}
                  alt={member.name}
                  className={`w-full rounded-lg h-80 object-cover ${
                    birthdayMember && birthdayMember.name === member.name ? 'border-4 border-yellow-400' : ''
                  }`}
                  loading="lazy"
                />
                {birthdayMember && birthdayMember.name === member.name && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                    BIRTHDAY!
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <div className='p-4'>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {member.name}
                    {birthdayMember && birthdayMember.name === member.name && (
                      <span className="ml-2 text-yellow-400">🎂</span>
                    )}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">{member.position}</p>
                  <div className="flex gap-4 text-xl text-gray-700 dark:text-gray-300">
                    {member.github && (
                      <a className='cursor-pointer hover:text-pink-600' href={member.github} target="_blank" rel="noopener noreferrer">
                        <Github size={20} />
                      </a>
                    )}
                    {member.linkedin && (
                      <a className='cursor-pointer hover:text-pink-600' href={member.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin size={20} />
                      </a>
                    )}
                    {member.instagram && (
                      <a className='cursor-pointer hover:text-pink-600' href={member.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram size={20} />
                      </a>
                    )}
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
            <div className="fixed px-2 md:px-0 inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
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
                  <div className='flex flex-col justify-center w-full items-center'>
                    <img
                      src={selectedMember.img}
                      alt={selectedMember.name}
                      className={`w-32 h-32 rounded-full object-cover mb-4 ${
                        birthdayMember && birthdayMember.name === selectedMember.name ? 'border-4 border-yellow-400' : ''
                      }`}
                      loading="lazy"
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedMember.name}
                    </h2>
                    <p className="text-lg text-blue-500 dark:text-blue-300 mb-2">{selectedMember.position}</p>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedMember.bio}</p>
                  </div>
                  <br />
                  <div>
                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Email:</span> {selectedMember.email}
                    </div>
                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Date of Birth:</span> {selectedMember.dateOfBirth}
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
                  </div>
                  <div className="flex gap-4 mt-4 w-full items-center justify-center text-xl text-gray-700 dark:text-gray-300">
                    {selectedMember.github && (
                      <a className='cursor-pointer hover:text-pink-600' href={selectedMember.github} target="_blank" rel="noopener noreferrer">
                        <Github size={20} />
                      </a>
                    )}
                    {selectedMember.linkedin && (
                      <a className='cursor-pointer hover:text-pink-600' href={selectedMember.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin size={20} />
                      </a>
                    )}
                    {selectedMember.instagram && (
                      <a className='cursor-pointer hover:text-pink-600' href={selectedMember.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram size={20} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Team;