let events = [];

// Track quiz results for analytics
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle quiz completion messages
  if (message.type === "quiz_completed") {
    console.log('📊 Quiz completed received:', message);
    chrome.storage.local.get(["quizHistory"], (data) => {
      const quizHistory = data.quizHistory || [];
      quizHistory.push({
        date: Date.now(),
        score: message.score,
        totalQuestions: message.totalQuestions,
        percentage: message.percentage,
        videoId: message.videoId || null
      });
      
      // Keep only last 50 quizzes
      const updatedHistory = quizHistory.slice(-50);
      chrome.storage.local.set({ 
        quizHistory: updatedHistory
      }, () => {
        console.log('✅ Quiz history updated:', updatedHistory.length, 'quizzes stored');
      });
    });
    return true;
  }

  // Handle video interaction events from content.js
  if (message.event && message.time) {
    console.log('🎬 Event received:', message.event, 'at', message.time);
    
    // Get existing events
    chrome.storage.local.get(["events", "videoHistory"], (data) => {
      events = data.events || [];
      const videoHistory = data.videoHistory || [];
      
      // Add timestamp to event
      message.timestamp = Date.now();
      events.push(message);
      
      // Track unique videos for analytics
      if (message.videoId && !videoHistory.some(v => v.videoId === message.videoId)) {
        videoHistory.push({
          videoId: message.videoId,
          firstWatched: Date.now(),
          lastWatched: Date.now(),
          eventCount: 1,
          title: message.videoTitle || "Unknown Video"
        });
        console.log('🎥 New video tracked:', message.videoId);
      } else if (message.videoId) {
        // Update existing video entry
        const videoIndex = videoHistory.findIndex(v => v.videoId === message.videoId);
        if (videoIndex !== -1) {
          videoHistory[videoIndex].lastWatched = Date.now();
          videoHistory[videoIndex].eventCount = (videoHistory[videoIndex].eventCount || 0) + 1;
          if (message.videoTitle) {
            videoHistory[videoIndex].title = message.videoTitle;
          }
        }
      }
      
      // Save updated data (keep reasonable limits)
      chrome.storage.local.set({ 
        events: events.slice(-1000), // Keep last 1000 events
        videoHistory: videoHistory.slice(-50) // Keep last 50 videos
      }, () => {
        console.log('✅ Events updated:', events.length, 'events stored');
      });
    });
    return true;
  }
  
  // Handle other message types if needed
  return true;
});

// Handle extension icon click - OPEN OVERLAY
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Extension icon clicked for tab:', tab.id);
  
  // Check if it's a YouTube video page
  if (!tab.url.includes('youtube.com/watch')) {
    console.log('⚠️ Not a YouTube video page, skipping overlay');
    return;
  }
  
  // Inject the overlay HTML and CSS into the current tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectOverlay,
  }).then(() => {
    console.log('✅ Overlay injection script executed');
  }).catch((error) => {
    console.error('❌ Overlay injection failed:', error);
  });
});

function injectOverlay() {
  // Check if overlay already exists
  if (document.getElementById('smartlearnOverlay')) {
    console.log('🔄 Overlay already exists, showing it');
    if (typeof window.showSmartLearnOverlay === 'function') {
      window.showSmartLearnOverlay();
    }
    return;
  }
  
  console.log('🚀 Injecting SmartLearn overlay...');
  
  // Create and inject overlay
  const overlayHtml = `
    <div class="overlay-backdrop" id="overlayBackdrop"></div>
    <div class="smartlearn-overlay" id="smartlearnOverlay">
      <div class="overlay-header" id="overlayHeader">
        <div class="overlay-title">
          <i class="fas fa-brain"></i> SmartLearn AI Assistant
        </div>
        <button class="overlay-close" id="closeOverlay">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="overlay-body">
        <ul class="nav nav-pills mb-4">
          <li class="nav-item">
            <a class="nav-link active" data-tab="events-tab">📊 Events</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-tab="heatmap-tab">🔥 Heatmap</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-tab="revision-tab">📚 Revision</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-tab="quiz-tab">❓ Quiz</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-tab="reminder-tab">⏰ Reminders</a>
          </li>
        </ul>

        <div id="events-tab" class="tab active">
          <h5>Tracked Learning Events</h5>
          <div class="card">
            <div class="card-body">
              <ul id="events-list" class="list-group"></ul>
            </div>
          </div>
        </div>

        <div id="heatmap-tab" class="tab">
          <h5>Confusion Heatmap</h5>
          <div class="card">
            <div class="card-body">
              <canvas id="heatmap-chart" height="200"></canvas>
            </div>
          </div>
        </div>

        <div id="revision-tab" class="tab">
          <h5>Recommended Revision Topics</h5>
          <div class="card">
            <div class="card-body">
              <ul id="revision-list" class="list-group"></ul>
            </div>
          </div>
        </div>

        <div id="quiz-tab" class="tab">
          <h5>Smart Quiz Generator</h5>
          <div class="card">
            <div class="card-body">
              <button id="start-quiz" class="btn btn-primary btn-lg">Generate Quiz from Confusing Parts</button>
              <div id="quiz-content" class="mt-3"></div>
            </div>
          </div>
        </div>

        <div id="reminder-tab" class="tab">
          <h5>Revision Reminders</h5>
          <div class="card">
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Set reminder for days later:</label>
                <input type="number" id="reminder-days" class="form-control" placeholder="e.g., 7">
              </div>
              <button id="set-reminder" class="btn btn-primary">Set Reminder</button>
              <div id="reminder-status" class="mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = overlayHtml;
  document.body.appendChild(div);
  
  // Load overlay CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('overlay.css');
  document.head.appendChild(link);
  
  // Load overlay JS
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('overlay.js');
  document.body.appendChild(script);
  
  script.onload = function() {
    console.log('✅ Overlay scripts loaded');
    if (typeof window.showSmartLearnOverlay === 'function') {
      window.showSmartLearnOverlay();
    }
  };
  
  script.onerror = function() {
    console.error('❌ Failed to load overlay.js');
  };
}

// Revision reminder checker
setInterval(() => {
  chrome.storage.local.get("revisionReminder", (data) => {
    const reminderTime = data.revisionReminder;
    if (reminderTime && Date.now() >= reminderTime) {
      console.log('⏰ Revision reminder triggered');
      
      // Create notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: "SmartLearn - Revision Reminder",
        message: "⏰ Time to review your confusing topics!",
        priority: 2,
        buttons: [
          { title: "Review Now" }
        ]
      }, (notificationId) => {
        console.log('📢 Notification created:', notificationId);
      });
      
      // Clear the reminder
      chrome.storage.local.remove("revisionReminder", () => {
        console.log('🗑️ Reminder cleared from storage');
      });
    }
  });
}, 60 * 60 * 1000); // Check every hour

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('🔔 Notification clicked:', notificationId);
  
  // Try to open a YouTube video or the extension popup
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.action.openPopup();
    }
  });
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "Review Now" button
    console.log('📖 Review Now button clicked');
    
    // Open the extension popup
    chrome.action.openPopup();
  }
});

// Initialize storage with default values on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔄 SmartLearn extension installed/updated');
  
  // Initialize storage with default values
  chrome.storage.local.get(["events", "quizHistory", "videoHistory"], (data) => {
    if (!data.events) {
      chrome.storage.local.set({ events: [] });
    }
    if (!data.quizHistory) {
      chrome.storage.local.set({ quizHistory: [] });
    }
    if (!data.videoHistory) {
      chrome.storage.local.set({ videoHistory: [] });
    }
    if (!data.revisionReminder) {
      chrome.storage.local.set({ revisionReminder: null });
    }
  });
  
  // Create a test notification to verify it works
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon.png"),
    title: "SmartLearn Installed",
    message: "🎉 Extension is ready! Click the icon on YouTube videos.",
    priority: 1
  });
});

// Optional: Clear old data periodically
setInterval(() => {
  chrome.storage.local.get(["events"], (data) => {
    const events = data.events || [];
    if (events.length > 1000) {
      chrome.storage.local.set({ events: events.slice(-1000) });
      console.log('🧹 Cleaned up old events, kept last 1000');
    }
  });
}, 24 * 60 * 60 * 1000); // Run once per day