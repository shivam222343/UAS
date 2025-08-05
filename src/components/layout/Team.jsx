import React from 'react';
import { Github, Linkedin, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';


const teamData = [
  {
    name: "Aakash Desai",
    position: "Team Member",
    email: "aakkidesai4567@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370541/IMG_0384_vc6oui.jpg"
  },
  {
    name: "Aaryan Yerudkar",
    position: "Team Member",
    email: "aaryanyerudkar@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180"
  },
  {
    name: "Aditya Gawai",
    position: "Team Member",
    email: "adityagawai@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890690/IMG_3976_c9dana.jpg"
  },
  {
    name: "Advait Kulkarni",
    position: "Team Member",
    email: "kulkarniadvait108@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370573/IMG_20250225_092849_mlkqi5.jpg"
  },
  {
    name: "Aryada Kajrekar",
    position: "Team Member",
    email: "aryadakajrekar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Ashka Chauhan",
    position: "Team Member",
    email: "ashkachauhan@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Bhakti Huddar",
    position: "Team Member",
    email: "bhaktihuddar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886588/IMG_3967_crgnlb.jpg"
  },
  {
    name: "Bhavesh Ahuja",
    position: "Team Member",
    email: "bhaveshahuja0302@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370439/Screenshot_2025-02-19_140653_ivu7gx.png"
  },
  {
    name: "Chinmayee Pawar",
    position: "Team Member",
    email: "chinmayeepawar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370438/chinmayi_nabc2z.jpg"
  },
  {
    name: "Haripriya Patil",
    position: "Team Member",
    email: "haripriyapatil@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Hrushikesh Tamhankar",
    position: "Team Member",
    email: "hvttamhankar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370536/IMG_8576_pvc6yx.jpg"
  },
  {
    name: "Ishwari Ambrale",
    position: "Team Member",
    email: "ambraleishwari2912@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Jayesh Jagatkar",
    position: "Team Member",
    email: "jayeshjagatkar55@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Karan Gitte",
    position: "Team Member",
    email: "karangitte@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180"
  },
  {
    name: "Karan Patil",
    position: "Team Member",
    email: "karanvpatil703@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370543/IMG-20250721-WA0025_faerp6.jpg"
  },
  {
    name: "Ketan Shingana",
    position: "Team Member",
    email: "ketanshingana12@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370542/IMG_20241207_084901_srqrmc.jpg"
  },
  {
    name: "Maithili Dhopate",
    position: "Team Member",
    email: "maithilidhopate@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20241031-WA0126_efztab.jpg"
  },
  {
    name: "Mahika Savardekar",
    position: "Team Member",
    email: "mahikasavardekar@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886365/IMG_3908_voefsa.jpg"
  },
  {
    name: "Mangeresh Prabhavalkar",
    position: "Team Member",
    email: "mangereshprabhavalkar@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180"
  },
  {
    name: "Neha Jagtap",
    position: "Team Member",
    email: "nehajagtap@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Niranjan Ambi",
    position: "Team Member",
    email: "niranjanambi154@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Om Mali",
    position: "Team Member",
    email: "om542058@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370551/ommalis_edits-20250721-0001_fuuy5q.jpg"
  },
  {
    name: "Parth Chavan",
    position: "Team Member",
    email: "parthchavan@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886577/IMG_3966_qr4jts.jpg"
  },
  {
    name: "Piyush Jadhav",
    position: "Team Member",
    email: "jadhavpiyush2927@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Pranali Bedkyale",
    position: "Team Member",
    email: "pranalibedkyale@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753887058/IMG_3940_ve0otw.jpg"
  },
  {
    name: "Prathmesh Navale",
    position: "Team Member",
    email: "prathmeshnavale2689@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Rahul Patil",
    position: "Team Member",
    email: "rahulpatil@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753892014/IMG_3907_hefnxm.jpg"
  },
  {
    name: "Sakshi Gaikwad",
    position: "Team Member",
    email: "sakshi5@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370582/IMG_0315_wziwfk.jpg"
  },
  {
    name: "Sangram Nevase",
    position: "Team Member",
    email: "sangram.nvaes35@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370569/Sangram_Nevase_b2ppek.jpg"
  },
  {
    name: "Sarthaki Dixit",
    position: "Team Member",
    email: "sarthakidixit@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886575/IMG_3954_uk9sya.jpg"
  },
  {
    name: "Sayali Koshti",
    position: "Team Member",
    email: "koshtisayali5@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Sayali Shinde",
    position: "Team Member",
    email: "sayalishinde@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370456/Sayali_Shinde_ciuees.jpg"
  },
  {
    name: "Shivam Dombe",
    position: "Team Member",
    email: "dombeshivam80@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Siddhant Sadalage",
    position: "Team Member",
    email: "siddhant@gmail.com",
    img: "https://th.bing.com/th/id/OIP.wyqkY6RhmO3Po-pCmJj7JgHaHa?w=169&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
  },
  {
    name: "Shreeya Dhond",
    position: "Team Member",
    email: "shreeyadhond@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Shruti Narke",
    position: "Team Member",
    email: "shrutinarke1007@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370540/IMG-20230709-WA0007_oyt5to.jpg"
  },
  {
    name: "Shruti Powar",
    position: "Team Member",
    email: "shrutipowar1144@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370571/IMG-20241214-WA0180_ck3rmq.jpg"
  },
  {
    name: "Siddhi Kumbhar",
    position: "Team Member",
    email: "siddhikumbhar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Siya Yernalkar",
    position: "Team Member",
    email: "siyayernalkar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Sneha Inamdar",
    position: "Team Member",
    email: "snehainamdar@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Swati Sanap",
    position: "Team Member",
    email: "swatisanap@gmail.com",
    img: "https://4kwallpapers.com/images/wallpapers/anime-girl-girly-2048x1536-9793.jpg"
  },
  {
    name: "Venu Kamble",
    position: "Team Member",
    email: "venukamble@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753890758/IMG_3949_vgn5jm.jpg"
  },
  {
    name: "Veer Metri",
    position: "Team Member",
    email: "veermetri05@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370441/Veer_Metri_w67cwt.jpg"
  },
  {
    name: "Vinayak Tale",
    position: "Team Member",
    email: "vinayaktale@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1753886364/IMG_3946_ev1lsf.jpg"
  },
  {
    name: "Yashraj Kulgude",
    position: "Team Member",
    email: "yashrajkulgude1045@gmail.com",
    img: "https://res.cloudinary.com/dwsddmatc/image/upload/v1754370509/DSC_8482_1_yxocoi.jpg"
  }
];

const Team = () => {
  return (
    <div className="min-h-screen py-10 px-6 bg-white dark:bg-gray-900 transition-colors duration-300">
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
            <img src={member.img} alt={member.name} className="w-full rounded-lg h-80 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-3">{member.position}</p>
              <div className="flex gap-4 text-xl text-gray-700 dark:text-gray-300">
                <a className='cursor-pointer hover:text-pink-600 ' href={member.github} target="_blank" rel="noopener noreferrer"><Github size={20} /></a>
                <a className='cursor-pointer hover:text-pink-600 ' href={member.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20} /></a>
                <a className='cursor-pointer hover:text-pink-600 ' href={member.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={20} /></a>
              </div>
            </div>
            </motion.div>
        ))}
      </div>
      
    </div>
  );
};

export default Team;
