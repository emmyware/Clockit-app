// Clock It - Photo Journal App
// Local Storage Keys
const STORAGE_KEYS = {
    PHOTOS: 'clockit-photos',
    FREQUENCY: 'clockit-frequency',
    LAST_CAPTURE: 'clockit-last-capture'
};

// Application State
let photos = [];
let frequency = 'daily';
let currentView = 'home';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateUI();
    requestNotificationPermission();
});

// Load data from localStorage
function loadData() {
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const savedFrequency = localStorage.getItem(STORAGE_KEYS.FREQUENCY);
    
    if (savedPhotos) {
        photos = JSON.parse(savedPhotos);
    }
    
    if (savedFrequency) {
        frequency = savedFrequency;
        document.getElementById('frequency-select').value = frequency;
    }
}

// Save data to localStorage
function savePhotos() {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
}

function saveFrequency() {
    localStorage.setItem(STORAGE_KEYS.FREQUENCY, frequency);
}

// Setup Event Listeners
function setupEventListeners() {
    // Capture button
    document.getElementById('capture-btn').addEventListener('click', () => {
        document.getElementById('photo-input').click();
    });
    
    // Photo input
    document.getElementById('photo-input').addEventListener('change', handlePhotoCapture);
    
    // Frequency selector
    document.getElementById('frequency-select').addEventListener('change', (e) => {
        frequency = e.target.value;
        saveFrequency();
        updateUI();
        showToast('Reminder frequency updated to ' + frequency);
    });
    
    // Month/Year selectors for compile view
    document.getElementById('month-select').addEventListener('change', updateCompileView);
    document.getElementById('year-select-monthly').addEventListener('change', updateCompileView);
    document.getElementById('year-select-yearly').addEventListener('change', updateCompileView);
    
    // Set current date for selectors
    const now = new Date();
    document.getElementById('month-select').value = now.getMonth();
    document.getElementById('year-select-monthly').value = now.getFullYear();
    document.getElementById('year-select-yearly').value = now.getFullYear();
}

// Handle Photo Capture
function handlePhotoCapture(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const photo = {
            id: Date.now(),
            data: e.target.result,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        photos.push(photo);
        savePhotos();
        localStorage.setItem(STORAGE_KEYS.LAST_CAPTURE, new Date().toISOString());
        
        updateUI();
        showToast('Moment captured! 📸');
        
        // Reset file input
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

// Update UI
function updateUI() {
    updateHomeView();
    updateGalleryView();
    updateCompileView();
}

function updateHomeView() {
    // Update stats
    document.getElementById('total-moments').textContent = photos.length;
    
    const now = new Date();
    const monthPhotos = getMonthPhotos(now.getMonth(), now.getFullYear());
    const yearPhotos = getYearPhotos(now.getFullYear());
    
    document.getElementById('month-moments').textContent = monthPhotos.length;
    document.getElementById('year-moments').textContent = yearPhotos.length;
    
    // Update frequency display
    document.getElementById('frequency-display').textContent = 
        frequency.charAt(0).toUpperCase() + frequency.slice(1) + ' capture mode';
    
    // Check if captured today/this week
    const lastCapture = localStorage.getItem(STORAGE_KEYS.LAST_CAPTURE);
    let capturedRecently = false;
    
    if (lastCapture) {
        const lastDate = new Date(lastCapture);
        const today = new Date();
        
        if (frequency === 'daily') {
            capturedRecently = lastDate.toDateString() === today.toDateString();
        } else {
            // Weekly - check if within last 7 days
            const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            capturedRecently = daysDiff < 7;
        }
    }
    
    const statusEl = document.getElementById('capture-status');
    if (capturedRecently) {
        statusEl.textContent = "Today's Moment ✓";
    } else {
        statusEl.textContent = frequency === 'daily' ? 
            "Capture Today's Moment" : "Capture This Week's Moment";
    }
}

function updateGalleryView() {
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (photos.length === 0) {
        galleryGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <p>No moments captured yet</p>
            </div>
        `;
        return;
    }
    
    // Sort photos by date (newest first)
    const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);
    
    galleryGrid.innerHTML = sortedPhotos.map(photo => `
        <div class="gallery-item">
            <img src="${photo.data}" alt="Captured moment">
            <div class="gallery-item-info">
                <div class="gallery-item-date">${formatDate(photo.date)}</div>
            </div>
        </div>
    `).join('');
}

function updateCompileView() {
    const selectedMonth = parseInt(document.getElementById('month-select').value);
    const selectedYearMonthly = parseInt(document.getElementById('year-select-monthly').value);
    const selectedYearYearly = parseInt(document.getElementById('year-select-yearly').value);
    
    // Monthly
    const monthPhotos = getMonthPhotos(selectedMonth, selectedYearMonthly);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('monthly-count').textContent = 
        `${monthPhotos.length} photos from ${monthNames[selectedMonth]} ${selectedYearMonthly}`;
    
    const monthlyPreview = document.getElementById('monthly-preview');
    monthlyPreview.innerHTML = monthPhotos.slice(0, 8).map(photo => 
        `<img src="${photo.data}" alt="Preview">`
    ).join('');
    
    document.getElementById('generate-monthly').disabled = monthPhotos.length === 0;
    
    // Yearly
    const yearPhotos = getYearPhotos(selectedYearYearly);
    
    document.getElementById('yearly-count').textContent = 
        `${yearPhotos.length} photos from ${selectedYearYearly}`;
    
    const yearlyPreview = document.getElementById('yearly-preview');
    yearlyPreview.innerHTML = yearPhotos.slice(0, 8).map(photo => 
        `<img src="${photo.data}" alt="Preview">`
    ).join('');
    
    document.getElementById('generate-yearly').disabled = yearPhotos.length === 0;
}

// Get photos for specific month
function getMonthPhotos(month, year) {
    return photos.filter(photo => {
        const photoDate = new Date(photo.date);
        return photoDate.getMonth() === month && photoDate.getFullYear() === year;
    });
}

// Get photos for specific year
function getYearPhotos(year) {
    return photos.filter(photo => {
        const photoDate = new Date(photo.date);
        return photoDate.getFullYear() === year;
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

// View Management
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(viewName + '-view').classList.add('active');
    currentView = viewName;
    
    if (viewName === 'gallery') {
        updateGalleryView();
    } else if (viewName === 'compile') {
        updateCompileView();
    }
}

// Settings
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Generate Collages
function generateMonthlyCollage() {
    const selectedMonth = parseInt(document.getElementById('month-select').value);
    const selectedYear = parseInt(document.getElementById('year-select-monthly').value);
    const monthPhotos = getMonthPhotos(selectedMonth, selectedYear);
    
    if (monthPhotos.length === 0) {
        showToast('No photos available for this month');
        return;
    }
    
    createCollage(monthPhotos, 'monthly');
}

function generateYearlyCollage() {
    const selectedYear = parseInt(document.getElementById('year-select-yearly').value);
    const yearPhotos = getYearPhotos(selectedYear);
    
    if (yearPhotos.length === 0) {
        showToast('No photos available for this year');
        return;
    }
    
    createCollage(yearPhotos, 'yearly');
}

// Create Collage
function createCollage(photoSet, type) {
    showToast('Generating collage...');
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Determine grid size
    const photoCount = photoSet.length;
    const cols = Math.ceil(Math.sqrt(photoCount));
    const rows = Math.ceil(photoCount / cols);
    
    const photoSize = 400; // Size of each photo in the grid
    canvas.width = cols * photoSize;
    canvas.height = rows * photoSize;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let loadedCount = 0;
    const totalPhotos = photoSet.length;
    
    // Load and draw each photo
    photoSet.forEach((photo, index) => {
        const img = new Image();
        img.onload = () => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            // Draw image with cover fit
            const x = col * photoSize;
            const y = row * photoSize;
            
            // Calculate aspect ratio
            const imgAspect = img.width / img.height;
            const boxAspect = 1; // Square
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (imgAspect > boxAspect) {
                drawHeight = photoSize;
                drawWidth = drawHeight * imgAspect;
                drawX = x - (drawWidth - photoSize) / 2;
                drawY = y;
            } else {
                drawWidth = photoSize;
                drawHeight = drawWidth / imgAspect;
                drawX = x;
                drawY = y - (drawHeight - photoSize) / 2;
            }
            
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            
            loadedCount++;
            
            // When all photos are loaded, download
            if (loadedCount === totalPhotos) {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `clockit-${type}-collage-${Date.now()}.jpg`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Collage ready for download! 🎉');
                }, 'image/jpeg', 0.95);
            }
        };
        img.src = photo.data;
    });
}

// Toast notifications
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Notification Permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showToast('Notifications enabled! We\'ll remind you to capture moments.');
                }
            });
        }, 5000); // Ask after 5 seconds
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
