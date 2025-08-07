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
    bio: "A creative soul who finds joy in music as much as in coding. Always up for deep conversations about life and technology.",
    contact: "+91 97679 94567",
    year: "Third Year",
    department: "Computer Science and Business System",
    github: "",
    linkedin: "",
    instagram: "https://www.instagram.com/aakashdesai22/",
    dateOfBirth: " "
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
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "A cheerful team player who brings positive energy everywhere. Loves outdoor activities and is always ready for an adventure.",
    contact: "+91 72191 68635",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2005-01-12"
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
    github: "",
    linkedin: "https://www.linkedin.com/in/aditya-gawai-a4373532a/",
    instagram: "https://www.instagram.com/aditya__gawai/",
    dateOfBirth: "2006-12-06"
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
    dateOfBirth: "Not specified"
  },
  {
    name: "Ashka Chauhan",
    position: "Team Member",
    email: "ashkachauhan3204@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg",
    bio: "A warm presence who makes everyone feel included. Finds joy in both solving complex problems and simple pleasures.",
    contact: "+91 87674 92566",
    year: "Second Year",
    department: "Computer Science and Business Systems",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "2006-08-10"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/karangitte",
    linkedin: "https://linkedin.com/in/karangitte",
    instagram: "https://instagram.com/karangitte",
    dateOfBirth: "2004-08-08"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/ketanshingana",
    linkedin: "https://linkedin.com/in/ketanshingana",
    instagram: "https://instagram.com/ketanshingana",
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/mahikasavardekar",
    linkedin: "https://linkedin.com/in/mahikasavardekar",
    instagram: "https://instagram.com/mahikasavardekar",
    dateOfBirth: "2006-02-07"
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
    github: "https://github.com/mangereshprabhavalkar",
    linkedin: "https://linkedin.com/in/mangereshprabhavalkar",
    instagram: "https://instagram.com/mangereshprabhavalkar",
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
    dateOfBirth: "2006-01-10"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/parthchavan",
    linkedin: "https://linkedin.com/in/parthchavan",
    instagram: "https://instagram.com/parthchavan",
    dateOfBirth: "2006-01-20"
  },
  {
    name: "Piyush Jadhav",
    position: "Team Member",
    email: "jadhavpiyush2927@gmail.com",
    img: "https://pics.craiyon.com/2023-06-19/ebf9234749da4c1bb18b1d24a462e0d2.webp",
    bio: "A quick learner who thrives in dynamic environments. Brings enthusiasm to both technical and social interactions.",
    contact: "+91 87673 46766",
    year: "Third Year",
    department: "Mechanical Engineering",
    github: "",
    linkedin: "",
    instagram: "",
    dateOfBirth: "Not specified"
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
    github: "https://github.com/pranalibedkyale",
    linkedin: "https://linkedin.com/in/pranalibedkyale",
    instagram: "https://instagram.com/pranalibedkyale",
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
    github: "https://github.com/rahulpatil",
    linkedin: "https://linkedin.com/in/rahulpatil",
    instagram: "https://instagram.com/rahulpatil",
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/sarthakidixit",
    linkedin: "https://linkedin.com/in/sarthakidixit",
    instagram: "https://instagram.com/sarthakidixit",
    dateOfBirth: "2006-07-02"
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
    instagram: "",
    dateOfBirth: "Not specified"
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
    github: "https://github.com/sayalishinde",
    linkedin: "https://linkedin.com/in/sayalishinde",
    instagram: "https://instagram.com/sayalishinde",
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    linkedin: "",
    instagram: "",
    dateOfBirth: "Not specified"
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
    linkedin: "",
    instagram: "",
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    dateOfBirth: "Not specified"
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
    github: "https://github.com/siyayaranalkar",
    linkedin: "https://linkedin.com/in/siyayaranalkar",
    instagram: "https://instagram.com/siyayaranalkar",
    dateOfBirth: "2006-06-08"
  },
  {
    name: "Sneha Inamdar",
    position: "Team Member",
    email: "snehapinamdar2006@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754574249/Untitled_design_4_jlz8m9.png",
    bio: "A meticulous worker with a kind heart. Takes pride in both the quality of her work and her relationships.",
    contact: "+91 86000 36971",
    year: "Second Year",
    department: "Artificial Intelligence and Machine Learning",
    github: "https://github.com/snehainamdar",
    linkedin: "https://linkedin.com/in/snehainamdar",
    instagram: "https://instagram.com/snehainamdar",
    dateOfBirth: "2006-10-08"
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
    github: "https://github.com/swatisanap",
    linkedin: "https://linkedin.com/in/swatisanap",
    instagram: "https://instagram.com/swatisanap",
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
    github: "https://github.com/venukamble",
    linkedin: "https://linkedin.com/in/venukamble",
    instagram: "https://instagram.com/venukamble",
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
    linkedin: "",
    instagram: "",
    dateOfBirth: "Not specified"
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
    github: "https://github.com/vinayaktale",
    linkedin: "https://linkedin.com/in/vinayaktale",
    instagram: "https://instagram.com/vinayaktale",
    dateOfBirth: "2005-09-12"
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
    instagram: "",
    dateOfBirth: "Not specified"
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
               <div className='flex flex-col justify-center w-full items-center'>
                 <img
                  src={selectedMember.img}
                  alt={selectedMember.name}
                  className="w-32 h-32 rounded-full  object-cover mb-4"
                  loading="lazy" // Lazy loading for popup image
                />
                <h2 className="text-2xl  font-bold text-gray-900 dark:text-white mb-1">{selectedMember.name}</h2>
                <p className="text-lg text-blue-500 dark:text-blue-300 mb-2">{selectedMember.position}</p>
                     <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedMember.bio}</p>
               </div>
               
           <br />
                <div>
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
                </div>
                <div className="flex gap-4 mt-4 w-full items-center justify-center text-xl text-gray-700 dark:text-gray-300">
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
