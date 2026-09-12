// API endpoints
const JOKE_APIS = {
    general: 'https://official-joke-api.appspot.com/random_joke',
    programming: 'https://official-joke-api.appspot.com/jokes/programming/random',
    knockKnock: 'https://official-joke-api.appspot.com/jokes/knock-knock/random',
    random: 'https://v2.jokeapi.dev/joke/Any'
};

let jokeHistory = [];
let jokeCount = 0;
let currentJokeType = 'general';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    updateStatsDisplay();
});

// Fetch joke from API
async function fetchJoke() {
    const btn = document.getElementById('getJokeBtn');
    const jokeContent = document.getElementById('jokeContent');
    
    btn.disabled = true;
    jokeContent.innerHTML = '<p class="loading">🔄 Loading joke...</p>';

    try {
        const jokeType = document.getElementById('jokeType').value;
        let response;

        if (jokeType === 'random') {
            response = await fetch(JOKE_APIS.random);
        } else if (jokeType === 'programming') {
            response = await fetch(JOKE_APIS.programming);
        } else if (jokeType === 'knock-knock') {
            response = await fetch(JOKE_APIS.knockKnock);
        } else {
            response = await fetch(JOKE_APIS.general);
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        displayJoke(data);
        addToHistory(data);
        jokeCount++;
        updateStatsDisplay();
        
    } catch (error) {
        console.error('Error fetching joke:', error);
        jokeContent.innerHTML = `
            <p class="error">😞 Failed to load joke. Please try again!</p>
            <p class="error" style="font-size: 0.9rem;">Error: ${error.message}</p>
        `;
        showNotification('Failed to load joke', 'error');
    } finally {
        btn.disabled = false;
    }
}

// Display joke based on API response format
function displayJoke(data) {
    const jokeContent = document.getElementById('jokeContent');
    let html = '';

    if (data.type === 'single') {
        // v2.jokeapi.dev format (single joke)
        html = `
            <div>
                <p class="joke-setup">${data.joke}</p>
            </div>
        `;
    } else if (data.type === 'twopart') {
        // v2.jokeapi.dev format (setup + delivery)
        html = `
            <div>
                <p class="joke-setup">${data.setup}</p>
                <p class="joke-punchline">💥 ${data.delivery}</p>
            </div>
        `;
    } else if (data.setup && data.punchline) {
        // official-joke-api format
        html = `
            <div>
                <p class="joke-setup">${data.setup}</p>
                <p class="joke-punchline">💥 ${data.punchline}</p>
            </div>
        `;
    } else if (data.joke) {
        // Knock-knock joke format
        html = `
            <div>
                <p class="joke-setup">${data.joke}</p>
            </div>
        `;
    }

    jokeContent.innerHTML = html;
}

// Add joke to history
function addToHistory(jokeData) {
    let jokeText = '';
    
    if (jokeData.setup && jokeData.punchline) {
        jokeText = `${jokeData.setup} - ${jokeData.punchline}`;
    } else if (jokeData.joke) {
        jokeText = jokeData.joke;
    }

    if (!jokeText) return;

    const historyItem = {
        id: Date.now(),
        text: jokeText.substring(0, 80) + (jokeText.length > 80 ? '...' : ''),
        fullText: jokeText,
        timestamp: new Date().toLocaleString(),
        data: jokeData
    };

    jokeHistory.unshift(historyItem);
    
    // Keep only last 20 jokes
    if (jokeHistory.length > 20) {
        jokeHistory.pop();
    }

    saveHistory();
    updateHistoryDisplay();
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('jokeHistory', JSON.stringify(jokeHistory));
}

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('jokeHistory');
    if (saved) {
        jokeHistory = JSON.parse(saved);
        jokeCount = jokeHistory.length;
        updateHistoryDisplay();
    }
}

// Update history display
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearHistoryBtn');

    if (jokeHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No jokes loaded yet...</p>';
        clearBtn.style.display = 'none';
        return;
    }

    clearBtn.style.display = 'block';

    historyList.innerHTML = jokeHistory.map(item => `
        <div class="history-item" onclick="loadHistoryJoke(${item.id})">
            <div class="history-text" title="${item.fullText}">
                ${item.text}
            </div>
            <div class="history-date">${item.timestamp}</div>
        </div>
    `).join('');
}

// Load joke from history
function loadHistoryJoke(id) {
    const item = jokeHistory.find(j => j.id === id);
    if (item) {
        displayJoke(item.data);
        showNotification('Loaded from history!', 'success');
    }
}

// Copy joke to clipboard
async function copyJoke() {
    const jokeContent = document.getElementById('jokeContent').innerText;
    
    if (jokeContent.includes('Loading') || jokeContent.includes('Click')) {
        showNotification('No joke to copy yet!', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(jokeContent);
        showNotification('✓ Joke copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy joke', 'error');
    }
}

// Share joke
function shareJoke() {
    const jokeContent = document.getElementById('jokeContent').innerText;
    
    if (jokeContent.includes('Loading') || jokeContent.includes('Click')) {
        showNotification('No joke to share yet!', 'warning');
        return;
    }

    const shareText = `Check out this joke: ${jokeContent.substring(0, 100)}...`;
    
    if (navigator.share) {
        navigator.share({
            title: '😂 Random Joke Generator',
            text: shareText
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText);
        showNotification('✓ Share text copied to clipboard!', 'success');
    }
}

// Update joke type
function updateJokeType() {
    currentJokeType = document.getElementById('jokeType').value;
}

// Clear history
function clearHistory() {
    if (confirm('Are you sure you want to clear all joke history?')) {
        jokeHistory = [];
        jokeCount = 0;
        saveHistory();
        updateHistoryDisplay();
        updateStatsDisplay();
        showNotification('History cleared!', 'success');
    }
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('jokeCount').textContent = jokeCount;
    
    if (jokeHistory.length > 0) {
        const lastTime = new Date(jokeHistory[0].timestamp);
        document.getElementById('lastUpdate').textContent = lastTime.toLocaleTimeString();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Auto-fetch a joke on page load (optional)
// Uncomment the line below to automatically fetch a joke when the page loads
// window.addEventListener('load', () => setTimeout(fetchJoke, 500));
