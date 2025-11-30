import Groq from "groq-sdk";

class GroqService {
    constructor() {
        this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
        this.groq = null;
        this.initialized = false;
        this.initializeService();
    }

    initializeService() {
        if (!this.apiKey) {
            console.warn('Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file');
            return;
        }

        try {
            console.log('Initializing Groq service with API key:', this.apiKey.substring(0, 10) + '...');
            this.groq = new Groq({
                apiKey: this.apiKey,
                dangerouslyAllowBrowser: true // Required for client-side usage
            });

            console.log('Groq service initialized successfully');
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Groq service:', error);
            this.groq = null;
        }
    }

    // Wait for initialization to complete
    async waitForInitialization(timeout = 10000) {
        const startTime = Date.now();
        while (!this.initialized && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!this.initialized) {
            throw new Error('Groq service initialization timeout');
        }
    }

    // Get Team Mavericks context for AI training
    getTeamMavericksContext() {
        return `You are Eta made by Shivam one of Mavericks in August 2025 and work in progress to make more efficient, the AI assistant for Team Mavericks, a dynamic student organization from KIT's College of Engineering, Kolhapur. Here's comprehensive information about Team Mavericks:

**About Team Mavericks:**
Team Mavericks was founded on August 13, 2016, as a dynamic student organization from KIT's College of Engineering, Kolhapur. We're dedicated to student development through innovative events and workshops with our motto "Learning with Fun". Established by senior students to enhance student persona and emphasize individual and social growth, we've grown into a central committee dedicated to student development activities.

**Our Vision & Philosophy:**
We foster innovation, creativity, and collaboration through diverse technical and non-technical events. Like true Mavericks, we encourage unorthodox thinking and independent growth. Our approach is "For the Students, By the Students!"

**Mavericks faculty coordinator:** 
Mavericks faculty coordinator is Prof. Shivprasad Majgaonkar sir.

**President of Team Mavericks:** 
Team mavericks works on No Hierarchy principle. As every member is equal, every member is a Maverick.

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

**Location & Institution:**
KIT's College of Engineering, Kolhapur, Maharashtra, India
KIT's College of Engineering, Kolhapur (KITCoEK) was founded in 1983 as the first self-financed engineering college in Maharashtra. It is an autonomous institute, permanently affiliated to Shivaji University, with NAAC "A+" accreditation and several NBA-accredited programs.

As Eta, always remember that you are Eta and here to help about team mavericks. You should be knowledgeable about these aspects of Team Mavericks and help members with information about the organization, its activities, team members, events, and provide assistance with their projects and queries. With every response use slightly different context style if possible and be polite with giving response with different emojis. You can provide specific information about team members when asked, discuss our events in detail, share our achievements, and guide members about our various initiatives. Always maintain an enthusiastic and supportive tone that reflects the innovative spirit of Team Mavericks and our motto "Learning with Fun". Reply every question and use polite way to reply with asked context.`;
    }

    // Send a message and get response
    async sendMessage(message, chatHistory = []) {
        // Wait for initialization if not ready
        if (!this.initialized) {
            await this.waitForInitialization();
        }

        if (!this.groq) {
            throw new Error('Groq API key not configured. Please add your API key to the environment variables.');
        }

        try {
            // Prepare messages array with system context
            const messages = [
                {
                    role: "system",
                    content: this.getTeamMavericksContext()
                }
            ];

            // Add chat history
            if (chatHistory && chatHistory.length > 0) {
                chatHistory.forEach(msg => {
                    messages.push({
                        role: msg.isUser ? "user" : "assistant",
                        content: msg.content
                    });
                });
            }

            // Add current message
            messages.push({
                role: "user",
                content: message
            });

            // Call Groq API with updated model name
            const chatCompletion = await this.groq.chat.completions.create({
                messages: messages,
                model: "llama-3.1-8b-instant", // Updated to current supported model
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.8,
                stream: false
            });

            const responseText = chatCompletion.choices[0]?.message?.content || '';

            return {
                success: true,
                message: responseText,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error sending message to Groq:', error);

            // Handle specific error types
            if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('401')) {
                return {
                    success: false,
                    error: 'Invalid API key. Please check your Groq API key configuration.',
                    message: 'I apologize, but there seems to be an issue with the API configuration. Please contact the administrator.'
                };
            } else if (error.message?.includes('QUOTA_EXCEEDED') || error.message?.includes('429')) {
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
        if (!this.groq) {
            return 'New Chat';
        }

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `Generate a short, concise title (maximum 4-5 words) for a chat conversation that starts with this message: "${firstMessage}". Only return the title, nothing else.`
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.5,
                max_tokens: 20
            });

            const title = chatCompletion.choices[0]?.message?.content?.trim() || 'New Chat';

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
        return !!this.apiKey && !!this.groq;
    }

    // Get service status
    getStatus() {
        return {
            configured: this.isConfigured(),
            hasApiKey: !!this.apiKey,
            initialized: this.initialized
        };
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
        if (!this.groq) {
            throw new Error('Groq service not properly initialized');
        }

        try {
            // Prepare messages array with system context
            const messages = [
                {
                    role: "system",
                    content: this.getTeamMavericksContext()
                }
            ];

            // Add chat history
            if (chatHistory && chatHistory.length > 0) {
                chatHistory.forEach(msg => {
                    messages.push({
                        role: msg.isUser ? "user" : "assistant",
                        content: msg.content
                    });
                });
            }

            // Add current message
            messages.push({
                role: "user",
                content: message
            });

            // Call Groq API with streaming
            const stream = await this.groq.chat.completions.create({
                messages: messages,
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.8,
                stream: true
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            console.error('Error streaming message:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const groqService = new GroqService();
export default groqService;
