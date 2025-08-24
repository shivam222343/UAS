import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Copy, 
  Check,
  Palette,
  Camera,
  Code,
  Plus,
  Star
} from 'lucide-react';

const DOMAIN_TEMPLATES = {
  documentation: [
    {
      id: 'formal-letter',
      title: 'Formal Letter Template',
      description: 'Standard format for official correspondence',
      category: 'Letters',
      content: `[Your Club Letterhead]

Date: [Insert Date]
Reference No: [Insert Reference Number]

To,
[Recipient Name]
[Designation]
[Organization]
[Address]

Subject: [Brief Subject Line]

Dear [Salutation],

[Opening paragraph - State the purpose of your letter]

[Body paragraph(s) - Provide details, explanations, or requests]

[Closing paragraph - Summarize and state any required actions]

We look forward to your positive response.

Thanking you,

Yours sincerely,

[Your Name]
[Your Designation]
[Club Name]
[Contact Information]`,
      tags: ['formal', 'official', 'correspondence']
    },
    {
      id: 'event-report',
      title: 'Event Report Template',
      description: 'Comprehensive template for event documentation',
      category: 'Reports',
      content: `EVENT REPORT

Event Name: [Event Title]
Date: [Event Date]
Venue: [Location]
Duration: [Start Time - End Time]
Organized by: [Club/Committee Name]

EXECUTIVE SUMMARY
[Brief overview of the event and its outcomes]

1. INTRODUCTION
    • Purpose of the event
    • Target audience
    • Expected outcomes

2. EVENT PLANNING
    • Planning timeline
    • Budget allocation
    • Team responsibilities
    • Marketing strategy

3. EVENT EXECUTION
    • Setup and logistics
    • Program flow
    • Speaker/performer details
    • Technical arrangements

4. ATTENDANCE AND PARTICIPATION
    • Total attendees: [Number]
    • Registration details
    • Audience engagement
    • Feedback received

5. FINANCIAL SUMMARY
    • Total budget: [Amount]
    • Actual expenses: [Amount]
    • Revenue (if any): [Amount]
    • Variance analysis

6. CHALLENGES FACED
    • Issues encountered
    • Solutions implemented
    • Lessons learned

7. OUTCOMES AND IMPACT
    • Objectives achieved
    • Participant feedback
    • Media coverage
    • Social media reach

8. RECOMMENDATIONS
    • Improvements for future events
    • Best practices identified
    • Resource requirements

9. CONCLUSION
[Overall assessment and future implications]

APPENDICES
• Attendance list
• Financial receipts
• Photographs
• Feedback forms
• Media coverage

Prepared by: [Name]
Designation: [Title]
Date: [Report Date]`,
      tags: ['event', 'documentation', 'analysis']
    },
    {
      id: 'meeting-minutes',
      title: 'Meeting Minutes Template',
      description: 'Standard format for recording meeting proceedings',
      category: 'Reports',
      content: `MEETING MINUTES

Meeting Title: [Meeting Name]
Date: [Date]
Time: [Start Time - End Time]
Venue: [Location/Platform]
Meeting Type: [Regular/Special/Emergency]

ATTENDEES
Present:
• [Name 1] - [Designation]
• [Name 2] - [Designation]

Absent:
• [Name] - [Designation] - [Reason]

AGENDA
1. [Agenda Item 1]
2. [Agenda Item 2]
3. [Agenda Item 3]

DISCUSSIONS AND DECISIONS

1. [Agenda Item 1]
    Discussion: [Summary of discussion points]
    Decision: [Decision made]
    Action Items: 
    • [Action] - Assigned to: [Name] - Due: [Date]

2. [Agenda Item 2]
    Discussion: [Summary of discussion points]
    Decision: [Decision made]
    Action Items:
    • [Action] - Assigned to: [Name] - Due: [Date]

NEXT MEETING
Date: [Next Meeting Date]
Agenda Items: [Preliminary agenda]

Meeting adjourned at: [Time]

Minutes recorded by: [Secretary Name]
Approved by: [Chairperson Name]`,
      tags: ['meeting', 'minutes', 'official']
    }
  ],
  design: [
    {
      id: 'event-poster',
      title: 'Event Poster Design Brief',
      description: 'Guidelines for creating event posters',
      category: 'Posters',
      content: `EVENT POSTER DESIGN BRIEF

Event Details:
• Event Name: [Title]
• Date & Time: [Details]
• Venue: [Location]
• Theme: [Event Theme]

Design Requirements:
• Size: A3 (297×420mm) or A4 (210×297mm)
• Resolution: 300 DPI minimum
• Color Mode: CMYK for print, RGB for digital

Brand Elements:
• Club logo (top-left or bottom-right)
• Official colors: Primary Blue (#3B82F6), Secondary Gray (#6B7280)
• Typography: Inter Bold for headers, Inter Regular for body

Essential Information:
1. Event title (most prominent)
2. Date and time
3. Venue/platform
4. Brief description
5. Registration details
6. Contact information
7. Club branding

Design Guidelines:
• Maintain visual hierarchy
• Use high-contrast colors
• Ensure readability from distance
• Include call-to-action
• Leave white space for clarity

File Formats:
• Source file: .AI or .PSD
• Print ready: PDF with bleed
• Digital: PNG/JPG (1080×1080px for social media)

Approval Process:
1. Initial concept review
2. Content verification
3. Brand compliance check
4. Final approval from club head`,
      tags: ['poster', 'event', 'branding']
    },
    {
      id: 'social-media-kit',
      title: 'Social Media Design Kit',
      description: 'Templates and guidelines for social media posts',
      category: 'Social Media',
      content: `SOCIAL MEDIA DESIGN KIT

Platform Specifications:
• Instagram Post: 1080×1080px
• Instagram Story: 1080×1920px
• Facebook Post: 1200×630px
• LinkedIn Post: 1200×627px
• Twitter Header: 1500×500px

Brand Colors:
• Primary: #3B82F6 (Blue)
• Secondary: #6B7280 (Gray)
• Accent: #10B981 (Green)
• Background: #F9FAFB (Light Gray)

Typography:
• Headers: Inter Bold, 24-32px
• Subheaders: Inter Semibold, 18-24px
• Body: Inter Regular, 14-16px
• Captions: Inter Regular, 12-14px

Logo Usage:
• Minimum size: 40px height
• Clear space: Logo height × 0.5
• Placement: Corner or dedicated space
• Always use official logo files

Content Templates:

1. Event Announcement
    • Event title (bold, large)
    • Date and time
    • Venue information
    • Call-to-action
    • Club branding

2. Quote Post
    • Inspirational quote
    • Attribution
    • Relevant background
    • Club logo

3. Achievement Post
    • Achievement headline
    • Details/statistics
    • Congratulatory message
    • Team photo (if applicable)

Hashtag Strategy:
• Club hashtags: #TeamMavericks #[EventName]
• General: #StudentLife #Innovation #Leadership
• Event-specific: Create unique hashtags

File Organization:
• Templates/
• Brand Assets/
• Final Posts/
• Archive/`,
      tags: ['social-media', 'branding', 'templates']
    }
  ],
  photography: [
    {
      id: 'event-photography',
      title: 'Event Photography Checklist',
      description: 'Complete guide for event photography coverage',
      category: 'Events',
      content: `EVENT PHOTOGRAPHY CHECKLIST

Pre-Event Preparation:
□ Confirm event details (date, time, venue)
□ Scout location for lighting and angles
□ Prepare equipment checklist
□ Charge all batteries
□ Format memory cards
□ Create shot list with organizers

Equipment Checklist:
□ Primary camera body
□ Backup camera body
□ 24-70mm lens (versatile)
□ 85mm lens (portraits)
□ 16-35mm lens (wide shots)
□ External flash + diffuser
□ Extra batteries (4-6)
□ Memory cards (32GB+ each)
□ Tripod for group photos
□ Lens cleaning kit

Shot List:
1. Venue and Setup
    • Wide shots of decorated venue
    • Detail shots of decorations
    • Setup process (behind-the-scenes)

2. Attendees and Networking
    • Arrival and registration
    • Networking moments
    • Candid interactions
    • Group conversations

3. Main Event
    • Speaker/performer shots
    • Audience reactions
    • Key moments and highlights
    • Award ceremonies

4. Group Photos
    • Organizing committee
    • All attendees
    • Special guests
    • Award winners

5. Detail Shots
    • Event materials
    • Food and refreshments
    • Signage and branding
    • Technology setup

Camera Settings:
• Mode: Aperture Priority (A/Av)
• ISO: Auto (max 3200)
• Aperture: f/2.8-f/4 for portraits, f/8 for groups
• Focus: Single-point AF
• Metering: Matrix/Evaluative
• File format: RAW + JPEG

Post-Event:
□ Backup all photos immediately
□ Quick selection of best shots
□ Basic editing (exposure, color)
□ Create contact sheet
□ Deliver preview within 24 hours
□ Complete editing within 1 week`,
      tags: ['photography', 'events', 'checklist']
    },
    {
      id: 'portrait-guidelines',
      title: 'Portrait Photography Guidelines',
      description: 'Standards for professional portraits',
      category: 'Portraits',
      content: `PORTRAIT PHOTOGRAPHY GUIDELINES

Technical Specifications:
• Resolution: Minimum 12MP
• File format: RAW for editing, JPEG for delivery
• Aspect ratio: 3:4 for headshots, 2:3 for full body
• Color space: sRGB for web, Adobe RGB for print

Lighting Setup:
• Primary light: 45° angle from subject
• Fill light: Opposite side, lower intensity
• Background light: Separate subject from background
• Hair light: Add dimension and separation

Camera Settings:
• Aperture: f/2.8-f/5.6 (shallow depth of field)
• Shutter speed: 1/focal length minimum
• ISO: Lowest possible (100-400)
• Focus: Single-point on nearest eye
• Metering: Spot or center-weighted

Composition Guidelines:
• Rule of thirds for eye placement
• Leave space in direction of gaze
• Avoid cutting at joints
• Include hands when possible
• Watch background for distractions

Posing Directions:
• Slight angle to camera (not straight on)
• Shoulders back, chin slightly forward
• Natural, relaxed expression
• Hands positioned naturally
• Weight on back foot

Shot Variations:
1. Close-up headshot (shoulders up)
2. Medium shot (waist up)
3. Three-quarter shot (mid-thigh up)
4. Full body shot
5. Environmental portrait

Post-Processing Checklist:
□ Exposure adjustment
□ Color correction
□ Skin retouching (subtle)
□ Eye enhancement
□ Teeth whitening (if needed)
□ Background cleanup
□ Sharpening for output
□ Export in multiple sizes

Delivery Formats:
• High-res: 300 DPI for print
• Web: 72 DPI, sRGB
• Social media: 1080×1080px square crop
• Profile: 400×400px for websites

Professional Standards:
• Consistent style across all portraits
• Natural-looking retouching
• Proper color calibration
• Timely delivery (within 1 week)
• Client approval before final delivery`,
      tags: ['portrait', 'professional', 'standards']
    }
  ],
  technical: [
    {
      id: 'project-readme',
      title: 'Project README Template',
      description: 'Comprehensive README template for technical projects',
      category: 'Documentation',
      content: `# Project Name

Brief description of what this project does and who it's for.

## Features

- Feature 1
- Feature 2
- Feature 3

## Tech Stack

**Client:** React, Redux, TailwindCSS
**Server:** Node, Express
**Database:** MongoDB

## Installation

Install project dependencies

\`\`\`bash
npm install
\`\`\`

Start the development server

\`\`\`bash
npm run dev
\`\`\`

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

\`VITE_API_KEY\`
\`VITE_DATABASE_URL\`

## API Reference

#### Get all items

\`\`\`http
GET /api/items
\`\`\`

| Parameter | Type      | Description                |
| :-------- | :------- | :------------------------- |
| \`api_key\` | \`string\` | **Required**. Your API key |

#### Get item

\`\`\`http
GET /api/items/\${id}
\`\`\`

| Parameter | Type      | Description                 |
| :-------- | :------- | :-------------------------------- |
| \`id\`      | \`string\` | **Required**. Id of item to fetch |

## Usage/Examples

\`\`\`javascript
import Component from 'my-project'

function App() {
  return <Component />
}
\`\`\`

## Running Tests

To run tests, run the following command

\`\`\`bash
npm run test
\`\`\`

## Deployment

To deploy this project run

\`\`\`bash
npm run build
npm run deploy
\`\`\`

## Contributing

Contributions are always welcome!

See \`contributing.md\` for ways to get started.

Please adhere to this project's \`code of conduct\`.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Authors

- [@username](https://www.github.com/username)

## Support

For support, email support@example.com or join our Slack channel.`,
      tags: ['documentation', 'readme', 'project']
    },
    {
      id: 'api-documentation',
      title: 'API Documentation Template',
      description: 'Standard format for API documentation',
      category: 'APIs',
      content: `# API Documentation

## Base URL
\`https://api.example.com/v1\`

## Authentication

This API uses Bearer token authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

## Rate Limiting

- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated users

## Error Handling

The API uses conventional HTTP response codes:

- \`200\` - OK
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`500\` - Internal Server Error

Error Response Format:
\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": "Additional error details"
  }
}
\`\`\`

## Endpoints

### Users

#### GET /users
Get all users

**Parameters:**
- \`page\` (integer, optional): Page number (default: 1)
- \`limit\` (integer, optional): Items per page (default: 10)
- \`search\` (string, optional): Search term

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50
  }
}
\`\`\`

#### POST /users
Create a new user

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
\`\`\`

**Response:**
\`\`\`json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

#### GET /users/{id}
Get a specific user

**Parameters:**
- \`id\` (integer, required): User ID

**Response:**
\`\`\`json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

## SDKs and Libraries

- JavaScript: \`npm install api-client\`
- Python: \`pip install api-client\`
- PHP: \`composer require api-client\`

## Changelog

### v1.2.0 (2024-01-15)
- Added user search functionality
- Improved error messages

### v1.1.0 (2024-01-01)
- Added pagination support
- Fixed authentication issues

## Support

For API support, contact: api-support@example.com`,
      tags: ['api', 'documentation', 'technical']
    }
  ]
};

export default function DomainTemplates({ domain, isVisible }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  const templates = DOMAIN_TEMPLATES[domain?.id] || [];

  const handleCopyTemplate = async (template) => {
    try {
      // Use document.execCommand('copy') for better compatibility in iframes
      const textarea = document.createElement('textarea');
      textarea.value = template.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  const getTemplateIcon = (domainId) => {
    switch (domainId) {
      case 'documentation': return FileText;
      case 'design': return Palette;
      case 'photography': return Camera;
      case 'technical': return Code;
      default: return FileText;
    }
  };

  if (!isVisible || !domain) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {domain.name} Templates
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {templates.length} templates available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const IconComponent = getTemplateIcon(domain.id);
          return (
            <motion.div
              key={template.id}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className={`h-2 bg-gradient-to-r from-${domain.color}-500 to-${domain.color}-600`} />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-${domain.color}-100 dark:bg-${domain.color}-900 rounded-lg`}>
                    <IconComponent className={`h-6 w-6 text-${domain.color}-600`} />
                  </div>
                  <div className="flex gap-2">
                    <div
                      onClick={() => setSelectedTemplate(template)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </div>
                    <div
                      onClick={() => handleCopyTemplate(template)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors cursor-pointer"
                      title="Copy Template"
                    >
                      {copiedTemplate === template.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {template.title}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 bg-${domain.color}-100 text-${domain.color}-800 dark:bg-${domain.color}-900 dark:text-${domain.color}-200 text-xs rounded-full`}>
                    {template.category}
                  </span>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Template Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedTemplate.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => handleCopyTemplate(selectedTemplate)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    {copiedTemplate === selectedTemplate.id ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Template
                      </>
                    )}
                  </div>
                  <div
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    ×
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {selectedTemplate.content}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
