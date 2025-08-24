import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.chat = null;
    this.initializeService();
  }

  initializeService() {
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      });
    } catch (error) {
      console.error('Error initializing Gemini service:', error);
    }
  }

  // Get Team Mavericks context for AI training
  getTeamMavericksContext() {
    return `You are Eta, the AI assistant for Team Mavericks, a dynamic student organization from KIT's College of Engineering, Kolhapur. Here's comprehensive information about Team Mavericks:

**About Team Mavericks:**
Team Mavericks was founded on August 13, 2016, as a dynamic student organization from KIT's College of Engineering, Kolhapur. We're dedicated to student development through innovative events and workshops with our motto "Learning with Fun". Established by senior students to enhance student persona and emphasize individual and social growth, we've grown into a central committee dedicated to student development activities.

**Our Vision & Philosophy:**
We foster innovation, creativity, and collaboration through diverse technical and non-technical events. Like true Mavericks, we encourage unorthodox thinking and independent growth. Our approach is "For the Students, By the Students!"

**Major Events & Initiatives:**

1. **BODHANTRA** - 5-day orientation for first-years with technical/non-technical sessions, competitions, and team-building activities.

2. **Verbafest** - Communication event featuring Group Discussion, Debate, and Mind Saga to showcase verbal, critical, and creative skills.

3. **INVICTA** - Workshop series covering web development, ethical hacking, soft skills, and mental health for all skill levels.

4. **CARNIVAL** - IIT Techfest-inspired event with games, exhibits, and competitions to foster creativity and connections.

5. **ARCANE** - Virtual treasure hunt promoting critical thinking and teamwork through challenging rounds.

6. **SCHOOL VISIT** - Rural outreach program introducing AI, robotics, and career guidance to school students.

**Achievements & Impact:**
- 50+ Events Organized
- 1000+ Participants reached
- 20+ Workshops conducted
- 5+ School Visits completed
- Transformed first-year student orientation through BODHANTRA
- Bridged urban-rural tech gap with school outreach programs
- Created platform for 1000+ students to develop technical and soft skills
- Fostered culture of innovation and independent thinking

**Community Outreach:**
Our rural outreach program brings technology education to schools in Kolhapur district, covering AI, robotics, blockchain, and career guidance through interactive workshops. Since 2018, we've reached 15+ rural schools, inspiring 500+ students to explore STEM fields and modern technology careers.

**Team Structure:**
Team Mavericks consists of dedicated members from various engineering departments including:
- Computer Science and Business Systems
- Artificial Intelligence and Machine Learning
- Computer Science and Engineering
- Electronics and Telecommunication
- Mechanical Engineering
- Electrical Engineering
- Civil and Environmental Engineering
- Biotechnology

**Key Team Members (Current Active Members):**
- Aakash Desai (Computer Science and Business System)
- Aaryada Kajarekar (Artificial Intelligence and Machine Learning)
- Aaryan Yerudkar (Computer Science and Business Systems)
- Aditya Gawai (Computer Science and Business Systems)
- Advait Kulkarni (Electronics and Telecommunication)
- Ashka Chauhan (Computer Science and Business Systems)
- Bhakti Huddar (Computer Science and Business Systems)
- Bhavesh Ahuja (Artificial Intelligence and Data Science)
- Chinmayee Pawar (Artificial Intelligence and Machine Learning)
- Haripriya Patil (Computer Science and Business Systems)
- Hrushikesh Tamhankar (Computer Science and Engineering)
- Ishwari Ambrale (Computer Science and Business Systems)
- Jayesh Jagatkar (Biotechnology)
- Karan Gitte (Artificial Intelligence and Machine Learning)
- Karan Patil (Computer Science and Engineering)
- Ketan Shingana (Electrical Engineering)
- Maithili Dhopate (Computer Science and Engineering)
- Mahika Savardekar (Mechanical Engineering)
- Mangeresh Prabhavalkar (Computer Engineering)
- Neha Jagtap (Artificial Intelligence and Machine Learning)
- Niranjan Ambi (Artificial Intelligence and Machine Learning)
- Om Mali (Mechanical Engineering)
- Parth Chavan (Civil and Environmental Engineering)
- Piyush Jadhav (Mechanical Engineering)
- Pranali Bedkyale (Artificial Intelligence and Machine Learning)
- Rahul Patil (Artificial Intelligence and Machine Learning)
- Sakshi Gaikwad (Artificial Intelligence and Machine Learning)
- Sangram Nevase (Electronics and Telecommunication)
- Sarthaki Dixit (Computer Science and Business Systems)
- Sayali Koshti (Artificial Intelligence and Machine Learning)
- Sayali Shinde (Computer Science and Business Systems)
- Shivam Dombe (Computer Science and Business System)
- Shreeya Dhond (Artificial Intelligence and Machine Learning)
- Shruti Narke (Computer Engineering)
- Shruti Powar (Computer Engineering)
- Siddhant Sadalage (Mechanical Engineering)
- Siddhi Kumbhar (Electrical Engineering)
- Siya Yaranalkar (Computer Science and Business Systems)
- Sneha Inamdar (Artificial Intelligence and Machine Learning)
- Swati Sanap (Computer Science and Engineering)
- Venu Kamble (Computer Science and Engineering)
- Veer Metri (Artificial Intelligence and Machine Learning)
- Vinayak Tale (Mechanical Engineering)
- Yashraj Kulgude (Computer Science and Engineering)

**Domains of Expertise:**
- Software Development & Programming
- Web & Mobile App Development
- Data Science & Machine Learning
- IoT & Hardware Projects
- UI/UX Design
- Digital Marketing & Content Creation
- Event Management & Leadership
- Artificial Intelligence
- Robotics
- Blockchain Technology
- Ethical Hacking
- Soft Skills Development
- Mental Health Awareness

**Location & Institution:**
KIT's College of Engineering, Kolhapur, Maharashtra, India

As Eta, you should be knowledgeable about these aspects of Team Mavericks and help members with information about the organization, its activities, team members, events, and provide assistance with their projects and queries. You can provide specific information about team members when asked, discuss our events in detail, share our achievements, and guide members about our various initiatives. Always maintain an enthusiastic and supportive tone that reflects the innovative spirit of Team Mavericks and our motto "Learning with Fun".`;
  }

  // Start a new chat session
  startNewChat(history = []) {
    if (!this.model) {
      throw new Error('Gemini service not properly initialized');
    }

    try {
      // Prepare history with Team Mavericks context
      let contextualHistory = [];
      
      // Convert existing history to proper format if it exists
      if (history.length > 0) {
        contextualHistory = history.map(msg => ({
          role: msg.isUser ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));
        
        // Ensure first message is from user
        if (contextualHistory.length > 0 && contextualHistory[0].role !== 'user') {
          contextualHistory.unshift({
            role: 'user',
            parts: [{ text: 'Hello Eta!' }]
          });
        }
      }

      this.chat = this.model.startChat({
        history: contextualHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
        systemInstruction: {
          parts: [{ text: this.getTeamMavericksContext() }]
        }
      });
      return this.chat;
    } catch (error) {
      console.error('Error starting new chat:', error);
      throw error;
    }
  }

  // Send a message and get response
  async sendMessage(message, chatHistory = []) {
    if (!this.model) {
      throw new Error('Gemini API key not configured. Please add your API key to the environment variables.');
    }

    try {
      // If no active chat or we want to include history, start a new chat
      if (!this.chat || chatHistory.length > 0) {
        this.startNewChat(chatHistory);
      }

      // Enhance message with Team Mavericks context if it's a general query
      let enhancedMessage = message;
      if (this.isTeamMavericksQuery(message)) {
        enhancedMessage = `${message}\n\nContext: Please answer this question specifically in relation to Team Mavericks and our organization.`;
      }

      const result = await this.chat.sendMessage(enhancedMessage);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      
      // Handle specific error types
      if (error.message?.includes('API_KEY_INVALID')) {
        return {
          success: false,
          error: 'Invalid API key. Please check your Gemini API key configuration.',
          message: 'I apologize, but there seems to be an issue with the API configuration. Please contact the administrator.'
        };
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        return {
          success: false,
          error: 'API quota exceeded. Please try again later.',
          message: 'I\'m currently experiencing high demand. Please try again in a few moments.'
        };
      } else if (error.message?.includes('SAFETY')) {
        return {
          success: false,
          error: 'Content blocked by safety filters.',
          message: 'I cannot provide a response to that request due to safety guidelines. Please try rephrasing your question.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown error occurred',
          message: 'I apologize, but I encountered an error while processing your request. Please try again.'
        };
      }
    }
  }

  // Generate a chat title based on the first message
  async generateChatTitle(firstMessage) {
    if (!this.model) {
      return 'New Chat';
    }

    try {
      const prompt = `Generate a short, concise title (maximum 4-5 words) for a chat conversation that starts with this message: "${firstMessage}". Only return the title, nothing else.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const title = response.text().trim();
      
      // Clean up the title and ensure it's not too long
      const cleanTitle = title.replace(/['"]/g, '').substring(0, 50);
      return cleanTitle || 'New Chat';
    } catch (error) {
      console.error('Error generating chat title:', error);
      return 'New Chat';
    }
  }

  // Check if the service is properly configured
  isConfigured() {
    return !!this.apiKey && !!this.model;
  }

  // Get service status
  getStatus() {
    return {
      configured: this.isConfigured(),
      hasApiKey: !!this.apiKey,
      modelInitialized: !!this.model,
      chatActive: !!this.chat
    };
  }

  // Reset chat session
  resetChat() {
    this.chat = null;
  }

  // Check if message is related to Team Mavericks
  isTeamMavericksQuery(message) {
    const keywords = [
      'team mavericks', 'mavericks', 'organization', 'club', 'events', 
      'techfest', 'codemavericks', 'innovation', 'community', 'kit college',
      'kolhapur', 'achievements', 'projects', 'domains', 'members'
    ];
    return keywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  // Stream response (for typing effect)
  async *streamMessage(message, chatHistory = []) {
    if (!this.model) {
      throw new Error('Gemini service not properly initialized');
    }

    try {
      if (!this.chat || chatHistory.length > 0) {
        this.startNewChat(chatHistory);
      }

      // Enhance message with Team Mavericks context if needed
      let enhancedMessage = message;
      if (this.isTeamMavericksQuery(message)) {
        enhancedMessage = `${message}\n\nContext: Please answer this question specifically in relation to Team Mavericks and our organization.`;
      }

      const result = await this.chat.sendMessageStream(enhancedMessage);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error('Error streaming message:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
export default geminiService;
