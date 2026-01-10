# Smart Learn Extension

**AI-Powered Learning Assistant for YouTube**

A lightweight Chrome Extension (Manifest V3) that transforms your YouTube learning experience by intelligently tracking your interactions and providing personalized revision support. Designed for students and self-learners who want to study smarter, not harder.

---

## Features

- 🎥 **YouTube Integration** - Seamlessly works within YouTube's interface
- 🤖 **AI-Powered Assistance** - Leverages OpenAI's API for intelligent learning support
- 📊 **Learning Interaction Tracking** - Monitors your learning patterns and progress
- 📝 **Revision Support** - Smart suggestions based on your watched content
- 🔔 **Smart Notifications** - Timely reminders and learning alerts
- 🎯 **Popup Dashboard** - Quick access to stats and revision materials
- 💾 **Local Storage** - All data stored locally for privacy
- ⚡ **Lightweight** - Minimal performance impact on your browser

---

## Tech Stack

- **Extension Framework**: Chrome Extension Manifest V3
- **Frontend**: HTML, CSS, JavaScript
- **Backend Logic**: Service Worker (background.js)
- **AI Integration**: OpenAI API
- **UI Components**: Bootstrap, Font Awesome, Chart.js
- **Storage**: Chrome Storage API

---

## Folder Structure

```
smart-learn-extension/
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Service worker handling background tasks
├── content.js                 # Content script for YouTube integration
├── popup.html                 # Popup UI structure
├── popup.css                  # Popup styling
├── popup.js                   # Popup functionality
├── quiz.html                  # Quiz interface
├── quiz.js                    # Quiz logic
├── ml-service.js              # AI/ML integration service
├── overlay.html               # Learning overlay UI
├── icon.png                   # Extension icon
├── libs/                      # Third-party libraries
│   ├── bootstrap.bundle.min.js
│   ├── bootstrap.min.css
│   ├── chart.min.js           # For learning analytics
│   └── fontawesome.min.css    # Icon library
└── README.md                  # Project documentation
```

---

## Installation Steps

### Prerequisites
- Google Chrome or Chromium-based browser (v88+)
- OpenAI API key (for AI features)

### Load Extension in Chrome

1. **Extract the Extension**
   - Ensure you have the `smartlearn-extension` folder extracted

2. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser

3. **Enable Developer Mode**
   - Toggle **Developer mode** in the top-right corner

4. **Load Unpacked**
   - Click **Load unpacked**
   - Navigate to and select the `smartlearn-extension` folder
   - The extension will appear in your extensions list

5. **Configure API Key**
   - Click the SmartLearn AI extension icon
   - Go to settings and enter your OpenAI API key
   - Grant necessary permissions when prompted

6. **Start Learning**
   - Visit YouTube and start watching educational content
   - The extension will automatically track your interactions

---

## Permissions Explanation

| Permission | Purpose |
|-----------|---------|
| `storage` | Saves learning data and user preferences locally |
| `alarms` | Schedules revision reminders and notifications |
| `notifications` | Sends learning reminders and alerts |
| `activeTab` | Accesses current tab for YouTube detection |
| `scripting` | Injects content scripts to interact with YouTube |

**Privacy Note**: All data is stored locally. The extension only communicates with OpenAI's API for AI features and requires no external server.

---

## How It Works

```
YouTube Page
    ↓
[Content Script]  ← Detects learning interactions on YouTube
    ↓
[Background Service Worker]  ← Processes data, manages timers, handles API calls
    ↓
[OpenAI API]  ← Generates intelligent suggestions and revision content
    ↓
[Popup Dashboard]  ← Displays learning stats, quizzes, and recommendations
```

### Workflow Breakdown

1. **Content Script** (`content.js`) - Monitors YouTube activity and captures learning events
2. **Background Service Worker** (`background.js`) - Processes interactions, stores data, and orchestrates features
3. **Popup Interface** (`popup.html/js`) - Provides user-friendly access to revision materials and statistics
4. **AI Integration** (`ml-service.js`) - Sends context to OpenAI for generating personalized study aids

---

## Future Improvements

- 📚 **Multi-Platform Support** - Extend to Coursera, Udemy, and other learning platforms
- 🗣️ **Voice Notes** - Record and transcribe spoken notes during study sessions
- 📅 **Study Schedule** - AI-suggested study plans based on learning patterns
- 🌐 **Offline Mode** - Basic functionality without internet connectivity
- 🎨 **Dark Mode** - Enhanced UI with theme customization
- 🏆 **Gamification** - Achievements and learning streaks
- 👥 **Collaborative Learning** - Share study materials with classmates
- 🔍 **Advanced Analytics** - Detailed learning insights and performance metrics
- 🌍 **Multi-Language Support** - Support for non-English content

---

## License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this extension under the terms of the MIT License.

---

**Happy Learning!**

*Smart-learn-extension - Making online learning smarter, one video at a time.*
