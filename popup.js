document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll("[data-tab]");
  const tabContents = document.querySelectorAll(".tab");

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      tabContents.forEach(tc => tc.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      document.getElementById(target).classList.add("active");
    });
  });

  // Show Events Tab by default
  document.getElementById("events-tab").classList.add("active");
  document.querySelector('[data-tab="events-tab"]').classList.add("active");

  // Load tracked events
  const eventsList = document.getElementById("events-list");
  chrome.storage.local.get("events", (data) => {
    const events = data.events || [];
    if(events.length === 0){
      eventsList.innerHTML = "<li>No events tracked yet.</li>";
    } else {
      events.forEach(ev => {
        const li = document.createElement("li");
        li.textContent = `${ev.event} at ${ev.time}s`;
        eventsList.appendChild(li);
      });
    }
  });

  // Revision Suggestions Tab
document.querySelector('[data-tab="revision-tab"]').addEventListener("click", () => {
  loadRevisionSuggestionsFromEvents();
});

function loadRevisionSuggestionsFromEvents() {
  chrome.storage.local.get("events", (data) => {
    const events = data.events || [];
    const revisionList = document.getElementById("revision-list");
    
    if (!revisionList) return;
    
    revisionList.innerHTML = "";

    if (events.length === 0) {
      revisionList.innerHTML = `
        <li class="list-group-item">
          <i class="fas fa-info-circle me-2 text-info"></i>
          No learning events tracked yet. Watch some educational videos!
        </li>
      `;
      return;
    }

    // Aggregate events by type and time
    const eventTypes = {};
    const timeClusters = {};
    
    events.forEach(ev => {
      // Group by event type
      if (!eventTypes[ev.event]) eventTypes[ev.event] = 0;
      eventTypes[ev.event]++;
      
      // Group by time clusters (every 30 seconds)
      const timeCluster = Math.floor(ev.time / 30) * 30;
      if (!timeClusters[timeCluster]) timeClusters[timeCluster] = 0;
      timeClusters[timeCluster]++;
    });

    // Sort clusters by frequency
    const sortedClusters = Object.entries(timeClusters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Display revision suggestions
    sortedClusters.forEach(([time, count], index) => {
      const startTime = parseInt(time);
      const endTime = startTime + 30;
      
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <span class="badge bg-primary me-2">${index + 1}</span>
          <strong>Review content at ${startTime}-${endTime}s</strong>
          <div class="small text-muted">
            ${count} interactions suggest confusion in this section
          </div>
        </div>
        <span class="badge bg-danger rounded-pill">${count} events</span>
      `;
      revisionList.appendChild(li);
    });

    // Add event type summary
    const summaryLi = document.createElement("li");
    summaryLi.className = "list-group-item bg-light";
    summaryLi.innerHTML = `
      <div class="small">
        <i class="fas fa-chart-bar me-1"></i>
        <strong>Event Summary:</strong>
        ${Object.entries(eventTypes).map(([type, count]) => 
          `${type}: ${count}`).join(', ')}
      </div>
    `;
    revisionList.appendChild(summaryLi);
  });
}

  // ✅ Heatmap Tab Handler
document.querySelector('[data-tab="heatmap-tab"]').addEventListener("click", () => {
  const canvas = document.getElementById("heatmap-chart");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");

  // Fetch events from storage
  chrome.storage.local.get("events", (data) => {
    const events = data.events || [];
    
    if (events.length === 0) {
      ctx.font = "14px Arial";
      ctx.fillText("No events tracked yet. Watch some YouTube videos first!", 10, 30);
      return;
    }

    // 1️⃣ Find maximum event time to scale graph
    const maxTime = Math.ceil(Math.max(...events.map(e => e.time)));
    const interval = 10; // seconds per bin
    const binCount = Math.ceil(maxTime / interval);

    // 2️⃣ Create bins dynamically
    const bins = new Array(binCount).fill(0);
    const labels = [];

    for (let i = 0; i < binCount; i++) {
      const start = i * interval;
      const end = start + interval;
      labels.push(`${start}-${end}s`);
    }

    // 3️⃣ Fill bins with events
    events.forEach(ev => {
      const idx = Math.floor(ev.time / interval);
      if (idx < bins.length) bins[idx]++;
    });

    // 4️⃣ Draw chart with dynamic bins
    if (window.heatmapChart) {
      window.heatmapChart.destroy();
    }
    
    window.heatmapChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Confusion Level",
          data: bins,
          backgroundColor: "rgba(255, 99, 132, 0.6)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: false },
          title: {
            display: true,
            text: 'Confusion Heatmap - Video Timeline',
            font: { size: 14 }
          }
        },
        scales: {
          x: { 
            title: { 
              display: true, 
              text: "Video Timeline (seconds)",
              font: { weight: 'bold' }
            } 
          },
          y: { 
            title: { 
              display: true, 
              text: "Interactions Count", 
              font: { weight: 'bold' }
            }, 
            beginAtZero: true 
          }
        }
      }
    });
  });
});

// ====================== LEARNING ANALYTICS DASHBOARD ======================

// Add analytics CSS styles
const analyticsStyle = document.createElement('style');
analyticsStyle.textContent = `
  .analytics-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .stat-card {
    background: linear-gradient(135deg, #4361ee, #3a0ca3);
    color: white;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
  }
  
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: 11px;
    opacity: 0.9;
    font-weight: 500;
  }
  
  .stat-card.total-time {
    background: linear-gradient(135deg, #4cc9f0, #4361ee);
  }
  
  .stat-card.videos-watched {
    background: linear-gradient(135deg, #f72585, #7209b7);
  }
  
  .stat-card.confusion-score {
    background: linear-gradient(135deg, #ff9e00, #ff5400);
  }
  
  .stat-card.quiz-performance {
    background: linear-gradient(135deg, #38b000, #2d9d0b);
  }
  
  .insight-card {
    background: #f8f9fa;
    border-left: 4px solid #4361ee;
    padding: 10px 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    font-size: 13px;
    display: flex;
    align-items: flex-start;
  }
  
  .insight-card.good {
    border-left-color: #4CAF50;
    background: #e8f5e9;
  }
  
  .insight-card.warning {
    border-left-color: #ff9800;
    background: #fff3e0;
  }
  
  .insight-card.info {
    border-left-color: #2196F3;
    background: #e3f2fd;
  }
  
  .insight-icon {
    margin-right: 8px;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  
  .analytics-charts {
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    margin-top: 15px;
  }
  
  #analytics-tab .card {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
  }
  
  #analytics-tab .card-header {
    background: linear-gradient(135deg, #4361ee, #3a0ca3);
    border-bottom: none;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
  }
  
  #analytics-tab h5 {
    color: #2c3e50;
    font-weight: 700;
    margin-bottom: 15px;
    font-size: 16px;
    padding: 0 5px;
  }
`;
document.head.appendChild(analyticsStyle);

// Analytics Tab Handler
document.querySelector('[data-tab="analytics-tab"]')?.addEventListener("click", function() {
  loadLearningAnalytics();
});

function loadLearningAnalytics() {
  const statsContainer = document.getElementById("analytics-stats");
  const insightsContainer = document.getElementById("analytics-insights");
  
  if (!statsContainer) return;
  
  // Show loading state
  statsContainer.innerHTML = `
    <div class="text-center py-3 col-span-2">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted small">Loading your learning analytics...</p>
    </div>
  `;
  
  if (insightsContainer) {
    insightsContainer.innerHTML = '';
  }
  
  // Load data after a brief delay to ensure tab is visible
  setTimeout(() => {
    chrome.storage.local.get(["events", "quizHistory", "videoHistory"], (data) => {
      const events = data.events || [];
      const quizHistory = data.quizHistory || [];
      const videoHistory = data.videoHistory || [];
      
      // Calculate stats
      const stats = calculateLearningStats(events, quizHistory, videoHistory);
      
      // Update dashboard
      updateAnalyticsDashboard(stats, events, quizHistory);
      
      // Generate insights
      generateLearningInsights(stats, events, quizHistory);
    });
  }, 100);
}

function calculateLearningStats(events, quizHistory, videoHistory) {
  // Total study time (estimated)
  let totalStudyTime = 0;
  if (events.length > 0) {
    const timeEvents = events.filter(e => e.time).map(e => e.time);
    const maxTime = Math.max(...timeEvents);
    totalStudyTime = Math.floor(maxTime / 60); // Convert seconds to minutes
  }
  
  // Unique videos watched
  const uniqueVideos = new Set();
  events.forEach(e => {
    if (e.videoId) uniqueVideos.add(e.videoId);
  });
  const videosWatched = Math.max(uniqueVideos.size, videoHistory.length);
  
  // Confusion score
  const confusionEvents = events.filter(e => 
    e.event === "Rewind" || e.event === "Pause" || e.event === "Forward"
  ).length;
  const confusionScore = events.length > 0 ? 
    Math.min(100, Math.round((confusionEvents / events.length) * 100)) : 0;
  
  // Quiz performance
  let quizPerformance = 0;
  if (quizHistory.length > 0) {
    const totalScore = quizHistory.reduce((sum, quiz) => sum + (quiz.score || 0), 0);
    quizPerformance = Math.round(totalScore / quizHistory.length);
  }
  
  // Learning streak
  const today = new Date().toDateString();
  const activityDates = events
    .map(e => new Date(e.timestamp || Date.now()).toDateString())
    .filter((date, index, self) => self.indexOf(date) === index);
  
  const streak = calculateStreak(activityDates, today);
  
  // Most active hour
  const hourCounts = {};
  events.forEach(e => {
    const hour = new Date(e.timestamp || Date.now()).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  let mostActiveHour = "Not enough data";
  if (Object.keys(hourCounts).length > 0) {
    const [maxHour] = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    mostActiveHour = `${maxHour}:00`;
  }
  
  return {
    totalStudyTime: Math.max(totalStudyTime, 0),
    videosWatched: Math.max(videosWatched, 0),
    confusionScore,
    quizPerformance,
    streak: Math.max(streak, 0),
    mostActiveHour,
    totalEvents: events.length,
    totalQuizzes: quizHistory.length
  };
}

function calculateStreak(activityDates, today) {
  if (activityDates.length === 0) return 0;
  
  // Sort dates descending
  const sortedDates = [...new Set(activityDates)].sort((a, b) => 
    new Date(b) - new Date(a)
  );
  
  // If today is in the dates, start from today
  let currentDate = new Date(today);
  let streak = 0;
  
  // Check consecutive days
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const diffTime = currentDate - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function updateAnalyticsDashboard(stats, events, quizHistory) {
  const statsContainer = document.getElementById("analytics-stats");
  if (!statsContainer) return;
  
  statsContainer.innerHTML = `
    <div class="stat-card total-time">
      <div class="stat-number">${stats.totalStudyTime}<small>m</small></div>
      <div class="stat-label">Study Time</div>
    </div>
    
    <div class="stat-card videos-watched">
      <div class="stat-number">${stats.videosWatched}</div>
      <div class="stat-label">Videos Watched</div>
    </div>
    
    <div class="stat-card confusion-score">
      <div class="stat-number">${stats.confusionScore}%</div>
      <div class="stat-label">Confusion Score</div>
    </div>
    
    <div class="stat-card quiz-performance">
      <div class="stat-number">${stats.quizPerformance}%</div>
      <div class="stat-label">Quiz Performance</div>
    </div>
    
    <div class="stat-card" style="background: linear-gradient(135deg, #9d4edd, #5a189a);">
      <div class="stat-number">${stats.streak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
    
    <div class="stat-card" style="background: linear-gradient(135deg, #00b4d8, #0077b6);">
      <div class="stat-number">${stats.totalQuizzes}</div>
      <div class="stat-label">Quizzes Taken</div>
    </div>
  `;
  
  // Create trend chart
  createLearningTrendChart(events, quizHistory);
}

function createLearningTrendChart(events, quizHistory) {
  const canvas = document.getElementById("learning-trend-chart");
  if (!canvas) return;
  
  const ctx = canvas.getContext("2d");
  
  // Destroy existing chart
  if (window.learningTrendChart) {
    window.learningTrendChart.destroy();
  }
  
  // Prepare data for last 7 days
  const dates = [];
  const activityData = [];
  const quizData = [];
  
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dates.push(dateStr);
    
    // Count events for this date
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp || Date.now()).toDateString();
      return eventDate === date.toDateString();
    });
    activityData.push(dayEvents.length);
    
    // Average quiz score for this date
    const dayQuizzes = quizHistory.filter(q => {
      if (!q.date) return false;
      const quizDate = new Date(q.date).toDateString();
      return quizDate === date.toDateString();
    });
    
    if (dayQuizzes.length > 0) {
      const avgScore = dayQuizzes.reduce((sum, q) => sum + (q.score || 0), 0) / dayQuizzes.length;
      quizData.push(Math.round(avgScore));
    } else {
      quizData.push(0);
    }
  }
  
  // Create chart
  window.learningTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Learning Activity',
          data: activityData,
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#4361ee',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        },
        {
          label: 'Quiz Score %',
          data: quizData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 11
            },
            boxWidth: 12,
            padding: 10
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 10
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

function generateLearningInsights(stats, events, quizHistory) {
  const insightsContainer = document.getElementById("analytics-insights");
  if (!insightsContainer) return;
  
  insightsContainer.innerHTML = '<h6 class="mb-3" style="font-size: 14px; color: #2c3e50;">📈 Learning Insights</h6>';
  
  const insights = [];
  
  // Check for activity
  if (events.length === 0) {
    insights.push({
      type: 'info',
      text: 'Start watching educational videos to track your learning journey!',
      icon: '🚀'
    });
  } else {
    // Study time insight
    if (stats.totalStudyTime >= 30) {
      insights.push({
        type: 'good',
        text: `Great dedication! You've studied for ${stats.totalStudyTime} minutes.`,
        icon: '⏰'
      });
    } else if (stats.totalStudyTime > 0) {
      insights.push({
        type: 'info',
        text: `You've started with ${stats.totalStudyTime} minutes of learning. Keep going!`,
        icon: '🎯'
      });
    }
    
    // Videos watched insight
    if (stats.videosWatched >= 3) {
      insights.push({
        type: 'good',
        text: `You've watched ${stats.videosWatched} educational videos!`,
        icon: '🎬'
      });
    }
    
    // Confusion insight
    if (stats.confusionScore > 40) {
      insights.push({
        type: 'warning',
        text: `High confusion detected (${stats.confusionScore}%). Review confusing sections for better retention.`,
        icon: '🤔'
      });
    } else if (stats.confusionScore > 20) {
      insights.push({
        type: 'info',
        text: `You're challenging yourself! Moderate confusion (${stats.confusionScore}%) indicates active learning.`,
        icon: '💡'
      });
    }
    
    // Quiz performance insight
    if (stats.quizPerformance >= 80 && stats.totalQuizzes > 0) {
      insights.push({
        type: 'good',
        text: `Excellent! Average quiz score: ${stats.quizPerformance}%`,
        icon: '🎉'
      });
    } else if (stats.quizPerformance >= 60 && stats.totalQuizzes > 0) {
      insights.push({
        type: 'info',
        text: `Good progress! Quiz average: ${stats.quizPerformance}%`,
        icon: '📚'
      });
    } else if (stats.totalQuizzes === 0) {
      insights.push({
        type: 'info',
        text: 'Try taking quizzes to test your understanding!',
        icon: '❓'
      });
    }
    
    // Streak insight
    if (stats.streak >= 3) {
      insights.push({
        type: 'good',
        text: `🔥 ${stats.streak}-day learning streak! Consistency leads to mastery.`,
        icon: '🔥'
      });
    } else if (stats.streak > 0) {
      insights.push({
        type: 'info',
        text: `You're on a ${stats.streak}-day streak. Come back tomorrow to keep it going!`,
        icon: '📅'
      });
    }
  }
  
  // Limit to 3 insights
  const displayInsights = insights.slice(0, 3);
  
  if (displayInsights.length === 0) {
    const emptyInsight = document.createElement('div');
    emptyInsight.className = 'insight-card info';
    emptyInsight.innerHTML = `
      <span class="insight-icon">📊</span>
      Start learning to see personalized insights here!
    `;
    insightsContainer.appendChild(emptyInsight);
  } else {
    displayInsights.forEach(insight => {
      const insightElement = document.createElement('div');
      insightElement.className = `insight-card ${insight.type}`;
      insightElement.innerHTML = `
        <span class="insight-icon">${insight.icon}</span>
        ${insight.text}
      `;
      insightsContainer.appendChild(insightElement);
    });
  }
}

// Initialize analytics data storage if needed
chrome.storage.local.get(["quizHistory", "videoHistory"], (data) => {
  if (!data.quizHistory) {
    chrome.storage.local.set({ quizHistory: [] });
  }
  if (!data.videoHistory) {
    chrome.storage.local.set({ videoHistory: [] });
  }
});

  // ====================== TRANSCRIPT SECTION ======================
  const transcriptDisplay = document.getElementById("transcript-display");
  const transcriptText = document.getElementById("transcript-text");
  const transcriptLength = document.getElementById("transcript-length");
  const revisionList = document.getElementById("revision-list");

  // Display transcript function
  function displayTranscriptSection(transcript) {
    if (!transcript || transcript.length < 100) {
      if (transcriptDisplay) transcriptDisplay.style.display = 'none';
      return;
    }

    if (transcriptDisplay) {
      transcriptDisplay.style.display = 'block';
      if (transcriptText) transcriptText.textContent = transcript;
      if (transcriptLength) transcriptLength.textContent = `${transcript.length} characters`;
    }
  }

  // Load revision suggestions
  function loadRevisionSuggestions(transcript) {
    if (!revisionList || !transcript) return;

    revisionList.innerHTML = "";
    
    // Extract keywords from transcript
    const words = transcript.toLowerCase().split(/\s+/);
    const freq = {};
    const STOP_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'or', 'to', 'in', 'for', 'of', 'as', 'by', 'be', 'are', 'been', 'was', 'were', 'that', 'this', 'it']);
    
    words.forEach(w => {
      const clean = w.replace(/[^\w]/g, '');
      if (clean.length > 4 && !STOP_WORDS.has(clean)) {
        freq[clean] = (freq[clean] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    if (topKeywords.length === 0) {
      revisionList.innerHTML = "<li>No revision suggestions yet.</li>";
      return;
    }

    topKeywords.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `"${item.word}" — mentioned ${item.count} time(s), important concept to review`;
      revisionList.appendChild(li);
    });
  }

  // ====================== QUIZ SECTION ======================
  const generateQuizBtn = document.getElementById("generate-quiz");
  const quizContent = document.getElementById("quiz-content");
  const quizStatus = document.getElementById("quiz-status");
  const quizResults = document.getElementById("quiz-results");
  const questionCountSelect = document.getElementById("question-count");
  const geminiApiKeyInput = document.getElementById("gemini-api-key");
  const saveGeminiKeyBtn = document.getElementById("save-gemini-key");
  const geminiKeyStatus = document.getElementById("gemini-key-status");

  let currentQuiz = null;
  let userAnswers = {};
  let geminiApiKey = '';
  let currentTranscript = '';

  // Save Gemini API key
  saveGeminiKeyBtn.addEventListener('click', () => {
    const apiKey = geminiApiKeyInput.value.trim();
    
    if (!apiKey) {
      geminiKeyStatus.innerHTML = '<span class="text-danger">❌ Please enter an API key</span>';
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      geminiKeyStatus.innerHTML = '<span class="text-danger">❌ Invalid Google AI key format</span>';
      return;
    }
    
    geminiApiKey = apiKey;
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
      geminiKeyStatus.innerHTML = '<span class="text-success">✅ Gemini API Key saved</span>';
    });
  });

  // Load Gemini API key from storage
  function loadGeminiKey() {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        geminiApiKey = result.geminiApiKey;
        geminiApiKeyInput.value = result.geminiApiKey;
        geminiKeyStatus.innerHTML = '<span class="text-success">✅ Gemini API Key loaded</span>';
      }
    });
  }

  loadGeminiKey();

  // Extract transcript from YouTube
  async function extractYouTubeTranscript() {
    try {
      showStatus('loading', 'Extracting transcript from YouTube...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('youtube.com/watch')) {
        throw new Error('Please navigate to a YouTube video page');
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          return new Promise((resolve) => {
            function extractTranscript() {
              const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
              
              if (segments.length === 0) {
                return null;
              }

              const transcriptData = Array.from(segments).map(segment => {
                const textEl = segment.querySelector('yt-formatted-string');
                return textEl ? textEl.textContent.trim() : '';
              }).filter(text => text.length > 0);

              return transcriptData.join(' ');
            }

            // Try to open transcript if not visible
            function ensureTranscriptOpen() {
              const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
              if (segments.length > 0) {
                return true;
              }

              const transcriptBtn = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.getAttribute('aria-label')?.toLowerCase().includes('transcript')
              );

              if (transcriptBtn && transcriptBtn.offsetParent !== null) {
                transcriptBtn.click();
                return true;
              }
              return false;
            }

            ensureTranscriptOpen();
            
            setTimeout(() => {
              const transcript = extractTranscript();
              resolve(transcript);
            }, 2000);
          });
        }
      });

      const transcript = results[0]?.result;
      
      if (!transcript || transcript.length < 100) {
        throw new Error('No transcript found. Make sure video has captions.');
      }

      currentTranscript = transcript;
      showStatus('success', '✅ Transcript extracted successfully!');
      return transcript;

    } catch (error) {
      throw new Error('Transcript extraction failed: ' + error.message);
    }
  }

  // Generate quiz using Gemini API
  async function generateQuizWithGemini(transcript, questionCount, apiKey) {
    try {
      showStatus('loading', 'AI is generating questions...');

      const prompt = `You are an expert quiz creator. Generate exactly ${questionCount} high-quality multiple-choice questions from this YouTube video transcript.

TRANSCRIPT:
${transcript.substring(0, 5000)}

REQUIREMENTS:
1. Create REAL, MEANINGFUL, SPECIFIC questions about the content
2. Each question MUST have exactly 4 options (A, B, C, D)
3. Only ONE correct answer per question
4. Questions should test understanding of actual content
5. Use specific facts, numbers, processes, definitions mentioned
6. Make questions educational and conceptual
7. Avoid yes/no or ambiguous questions

FORMAT EXAMPLES:
Q1: What is the median salary mentioned?
A) $100,000
B) $154,000
C) $200,000
D) $300,000

Q2: How is X different from Y?
A) X focuses on training models from scratch
B) X integrates pre-trained models into applications
C) X only does data processing
D) X requires a PhD

RESPONSE FORMAT - STRICT JSON ONLY:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "B",
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

Return ONLY valid JSON, no markdown, no code blocks, no extra text.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4000
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean and parse JSON
      let jsonText = responseText.replace(/```json\s*|\```/g, '').trim();
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini');
      }

      const quizData = JSON.parse(jsonMatch[0]);
      
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error('No questions generated');
      }

      currentQuiz = quizData.questions.slice(0, questionCount);
      showStatus('success', `✅ Generated ${currentQuiz.length} questions successfully!`);
      return currentQuiz;

    } catch (error) {
      throw new Error('Quiz generation failed: ' + error.message);
    }
  }

  // Display quiz with custom format
  function displayQuiz(questions) {
    quizContent.innerHTML = '';
    quizResults.style.display = 'none';
    userAnswers = {};

    const header = document.createElement('div');
    header.className = 'quiz-header-custom';
    header.innerHTML = `
      <h3>📝 Quiz - ${questions.length} Questions</h3>
      <p class="text-muted">Select the correct answer for each question</p>
    `;
    quizContent.appendChild(header);

    questions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'question-card-custom';
      
      const optionsHtml = Object.entries(q.options).map(([key, value]) => `
        <div class="option-item">
          <input type="radio" id="q${index}${key}" name="question${index}" value="${key}">
          <label for="q${index}${key}">
            <span class="option-letter">${key})</span> ${value}
          </label>
        </div>
      `).join('');

      card.innerHTML = `
        <div class="question-number">Q${index + 1}</div>
        <div class="question-text">${q.question}</div>
        <div class="options-container">
          ${optionsHtml}
        </div>
      `;

      quizContent.appendChild(card);

      // Add event listeners
      document.querySelectorAll(`input[name="question${index}"]`).forEach(input => {
        input.addEventListener('change', (e) => {
          userAnswers[index] = e.target.value;
          updateSubmitButton();
        });
      });
    });

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.id = 'submit-quiz-btn';
    submitBtn.className = 'btn btn-success btn-lg w-100 mt-4';
    submitBtn.innerHTML = '✓ Submit Answers';
    submitBtn.disabled = true;
    submitBtn.addEventListener('click', calculateScore);
    quizContent.appendChild(submitBtn);
  }

  // Calculate score
  function calculateScore() {
    if (!currentQuiz) return;

    let correct = 0;
    const results = [];

    currentQuiz.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correct++;

      results.push({
        question: q.question,
        userAnswer: q.options[userAnswer] || 'Not answered',
        correctAnswer: q.options[q.correctAnswer],
        isCorrect: isCorrect,
        explanation: q.explanation
      });
    });

    displayResults(correct, results);
  }

  // Display results
  function displayResults(correct, results) {
    const total = currentQuiz.length;
    const percentage = Math.round((correct / total) * 100);

    quizContent.style.display = 'none';
    quizResults.innerHTML = '';
    quizResults.style.display = 'block';

    const header = document.createElement('div');
    header.className = 'results-header-custom';
    
    let message = '';
    let icon = '';
    if (percentage >= 90) { message = 'Excellent!'; icon = '🎉'; }
    else if (percentage >= 80) { message = 'Great Job!'; icon = '👏'; }
    else if (percentage >= 70) { message = 'Good Effort!'; icon = '✅'; }
    else if (percentage >= 60) { message = 'Keep Going!'; icon = '📚'; }
    else { message = 'Try Again!'; icon = '💪'; }

    header.innerHTML = `
      <div class="score-circle">
        <div class="score-number">${percentage}%</div>
        <div class="score-message">${message}</div>
      </div>
      <div class="score-details">
        <h4>Your Score: ${correct}/${total}</h4>
        <p>${icon} ${percentage >= 70 ? 'You passed!' : 'Review the answers below'}</p>
      </div>
    `;
    quizResults.appendChild(header);

    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'results-details-custom';

    results.forEach((r, idx) => {
      const resultCard = document.createElement('div');
      resultCard.className = `result-card-custom ${r.isCorrect ? 'correct' : 'incorrect'}`;
      
      resultCard.innerHTML = `
        <div class="result-header">
          <span class="result-q">Q${idx + 1}</span>
          <span class="result-icon">${r.isCorrect ? '✓' : '✗'}</span>
        </div>
        <div class="result-question">${r.question}</div>
        <div class="result-answers">
          <div class="your-answer">Your Answer: <strong>${r.userAnswer}</strong></div>
          ${!r.isCorrect ? `<div class="correct-answer">Correct Answer: <strong>${r.correctAnswer}</strong></div>` : ''}
          <div class="explanation">💡 ${r.explanation}</div>
        </div>
      `;
      
      detailsContainer.appendChild(resultCard);
    });

    quizResults.appendChild(detailsContainer);

    // Retry button
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary btn-lg w-100 mt-4';
    retryBtn.innerHTML = '🔄 Try Again';
    retryBtn.addEventListener('click', () => {
      displayQuiz(currentQuiz);
    });
    quizResults.appendChild(retryBtn);
  }

  // Show status message
  function showStatus(type, message) {
    const statusDiv = quizStatus;
    statusDiv.className = `quiz-status-${type}`;
    
    if (type === 'loading') {
      statusDiv.innerHTML = `<span class="spinner-small"></span> ${message}`;
    } else {
      statusDiv.textContent = message;
    }
  }

  // Update submit button
  function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-quiz-btn');
    if (submitBtn) {
      const allAnswered = Object.keys(userAnswers).length === currentQuiz.length &&
                         Object.values(userAnswers).every(v => v !== null);
      submitBtn.disabled = !allAnswered;
    }
  }

  // Generate quiz button click
  generateQuizBtn.addEventListener('click', async () => {
    try {
      if (!geminiApiKey) {
        showStatus('error', '❌ Please save your Gemini API key first');
        return;
      }

      generateQuizBtn.disabled = true;
      quizResults.style.display = 'none';

      const transcript = await extractYouTubeTranscript();
      const questionCount = parseInt(questionCountSelect.value);

      await generateQuizWithGemini(transcript, questionCount, geminiApiKey);
      displayQuiz(currentQuiz);

    } catch (error) {
      showStatus('error', `❌ ${error.message}`);
    } finally {
      generateQuizBtn.disabled = false;
    }
  });

  // ====================== REMINDER SECTION ======================
const setReminderBtn = document.getElementById("set-reminder");
const reminderDaysInput = document.getElementById("reminder-days");
const reminderStatus = document.getElementById("reminder-status");

// Load existing reminder
chrome.storage.local.get(["revisionReminder", "reminderDays"], (data) => {
  if (data.reminderDays) {
    reminderDaysInput.value = data.reminderDays;
  }
  
  if (data.revisionReminder) {
    const daysLeft = Math.ceil((data.revisionReminder - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      reminderStatus.innerHTML = `
        <div class="alert alert-info p-2">
          <i class="fas fa-bell me-2"></i>
          <strong>Reminder set!</strong> You'll be notified in ${daysLeft} day(s).
        </div>
      `;
    }
  }
});

// Set reminder button click
setReminderBtn.addEventListener("click", () => {
  const days = parseInt(reminderDaysInput.value);
  
  if (!days || days <= 0) {
    reminderStatus.innerHTML = `
      <div class="alert alert-danger p-2">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Please enter a valid number of days (1-30).
      </div>
    `;
    return;
  }
  
  if (days > 30) {
    reminderStatus.innerHTML = `
      <div class="alert alert-warning p-2">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Maximum reminder period is 30 days.
      </div>
    `;
    return;
  }

  const reminderTime = Date.now() + (days * 24 * 60 * 60 * 1000);
  
  // Save reminder
  chrome.storage.local.set({
    revisionReminder: reminderTime,
    reminderDays: days
  }, () => {
    // Set alarm
    chrome.alarms.create("revisionReminder", {
      when: reminderTime
    });
    
    // Show success message
    reminderStatus.innerHTML = `
      <div class="alert alert-success p-2">
        <i class="fas fa-check-circle me-2"></i>
        <strong>Reminder set successfully!</strong><br>
        <small>You'll be notified in ${days} day(s) to review your confusing topics.</small>
      </div>
    `;
    
    // Clear after 5 seconds
    setTimeout(() => {
      if (reminderStatus.innerHTML.includes("successfully")) {
        reminderStatus.innerHTML = "";
      }
    }, 5000);
  });
});

// Clear reminder button (optional - add this HTML if needed)
/*
<button id="clear-reminder" class="btn btn-outline-secondary btn-sm mt-2">
  <i class="fas fa-trash-alt me-1"></i>Clear Reminder
</button>
*/

// If you add clear reminder button:
document.getElementById("clear-reminder")?.addEventListener("click", () => {
  chrome.storage.local.remove(["revisionReminder", "reminderDays"], () => {
    chrome.alarms.clear("revisionReminder");
    reminderStatus.innerHTML = `
      <div class="alert alert-info p-2">
        <i class="fas fa-info-circle me-2"></i>
        Reminder cleared successfully.
      </div>
    `;
    reminderDaysInput.value = "";
  });
});

// Also add this CSS for better styling
const reminderStyle = document.createElement('style');
reminderStyle.textContent = `
  #reminder-tab .card {
    border: 2px solid #e3f2fd;
  }
  
  #reminder-tab .card-header {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
  }
  
  #reminder-days {
    border: 2px solid #bbdefb;
    padding: 10px 15px;
    font-size: 16px;
    border-radius: 8px;
  }
  
  #reminder-days:focus {
    border-color: #2196F3;
    box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.25);
  }
  
  #set-reminder {
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    border: none;
    padding: 12px;
    font-weight: 600;
    transition: transform 0.2s;
  }
  
  #set-reminder:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  .reminder-alert {
    border-radius: 8px;
    padding: 10px;
    margin-top: 10px;
  }
`;
document.head.appendChild(reminderStyle);

// Listen for reminder tab click
document.querySelector('[data-tab="reminder-tab"]')?.addEventListener("click", () => {
  // Update reminder status when tab is clicked
  chrome.storage.local.get(["revisionReminder"], (data) => {
    if (data.revisionReminder) {
      const daysLeft = Math.ceil((data.revisionReminder - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0) {
        reminderStatus.innerHTML = `
          <div class="alert alert-info p-2">
            <i class="fas fa-bell me-2"></i>
            <strong>Active Reminder</strong><br>
            <small>Next review scheduled in ${daysLeft} day(s)</small>
          </div>
        `;
      }
    }
  });
});

  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .quiz-header-custom {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 25px;
      text-align: center;
    }

    .quiz-header-custom h3 {
      margin: 0;
      font-size: 1.8em;
      font-weight: 700;
    }

    .question-card-custom {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
      transition: all 0.3s ease;
    }

    .question-card-custom:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .question-number {
      color: #667eea;
      font-weight: 700;
      font-size: 0.9em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .question-text {
      font-size: 1.15em;
      font-weight: 600;
      color: #333;
      margin-bottom: 18px;
      line-height: 1.4;
    }

    .options-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .option-item {
      position: relative;
    }

    .option-item input {
      display: none;
    }

    .option-item label {
      display: block;
      padding: 12px 15px;
      background: #f8f9fa;
      border: 2px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      user-select: none;
    }

    .option-item label:hover {
      border-color: #667eea;
      background: #f0f1ff;
    }

    .option-item input:checked + label {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
      font-weight: 600;
    }

    .option-letter {
      font-weight: 700;
      margin-right: 8px;
    }

    .quiz-status-loading, .quiz-status-success, .quiz-status-error {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: 500;
    }

    .quiz-status-loading {
      background: #d1ecf1;
      color: #0c5460;
    }

    .quiz-status-success {
      background: #d4edda;
      color: #155724;
    }

    .quiz-status-error {
      background: #f8d7da;
      color: #721c24;
    }

    .spinner-small {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid #667eea;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .results-header-custom {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 25px;
      text-align: center;
    }

    .score-circle {
      margin-bottom: 20px;
    }

    .score-number {
      font-size: 3em;
      font-weight: 700;
      margin: 10px 0;
    }

    .score-message {
      font-size: 1.3em;
      opacity: 0.9;
    }

    .score-details h4 {
      margin: 15px 0 5px;
      font-size: 1.2em;
    }

    .results-details-custom {
      margin-bottom: 20px;
    }

    .result-card-custom {
      background: white;
      border-left: 5px solid;
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 15px;
      border-color: #dc3545;
    }

    .result-card-custom.correct {
      border-color: #28a745;
      background: #f8fffe;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .result-q {
      color: #667eea;
      font-size: 0.95em;
    }

    .result-icon {
      font-size: 1.3em;
    }

    .result-card-custom.correct .result-icon {
      color: #28a745;
    }

    .result-card-custom.incorrect .result-icon {
      color: #dc3545;
    }

    .result-question {
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }

    .result-answers {
      font-size: 0.95em;
      line-height: 1.6;
    }

    .your-answer, .correct-answer {
      color: #666;
      margin-bottom: 8px;
    }

    .your-answer strong {
      color: #333;
    }

    .correct-answer strong {
      color: #28a745;
    }

    .explanation {
      background: #f0f1ff;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
      color: #555;
      border-left: 3px solid #667eea;
    }

    #submit-quiz-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

});