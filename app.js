// Clock It V2 - With Google Sign-In and Cloud Sync
// Storage Keys
const STORAGE_KEYS = {
    PHOTOS: 'clockit-photos',
    FREQUENCY: 'clockit-frequency',
    LAST_CAPTURE: 'clockit-last-capture',
    USER: 'clockit-user',
    SYNC_ENABLED: 'clockit-sync-enabled',
    UPLOADS_THIS_MONTH: 'clockit-uploads-month',
    UPLOAD_MONTH: 'clockit-upload-month-tracker',
    FAVORITES: 'clockit-favorites',
    FIRST_USE_DATE: 'clockit-first-use'
};

// Application State
let photos = [];
let frequency = 'daily';
let currentView = 'home';
let lastView = 'home';
let currentUser = null;
let googleAuth = null;
let uploadsThisMonth = 0;
let favorites = new Set();
const MAX_FREE_UPLOADS = 3;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Show splash screen
    setTimeout(() => {
        document.getElementById('splash-screen').classList.remove('active');
        checkAuthState();
    }, 2500);
    
    setupEventListeners();
    initGoogleSignIn();
}

// Google Sign-In Integration
function initGoogleSignIn() {
    // Note: In production, you'll need to:
    // 1. Create a project at console.cloud.google.com
    // 2. Enable Google Sign-In API
    // 3. Get your Client ID
    // 4. Replace 'YOUR_CLIENT_ID' below with your actual client ID
    
    const CLIENT_ID = '266277627226-c6991ph055g8aphgqt3fdknkbqf0re22.apps.googleusercontent.com';
    
    window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false
    });
    
    // Render the sign-in button
    window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
            theme: 'filled_blue',
            size: 'large',
            width: 300,
            text: 'signin_with',
            shape: 'rectangular'
        }
    );
}

function handleGoogleSignIn(response) {
    // Decode the JWT token
    const userInfo = parseJwt(response.credential);
    
    currentUser = {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
    };
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, 'true');
    
    // Hide login view immediately
    document.getElementById('login-view')?.classList.remove('active');
    
    // Load user data
    loadUserData();
    
    // Show home view
    document.getElementById('home-view')?.classList.add('active');
    currentView = 'home';
    
    // Update nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.nav-btn[onclick*="home"]')?.classList.add('active');
    
    showToast('Signed in successfully! 🎉');
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function checkAuthState() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const syncEnabled = localStorage.getItem(STORAGE_KEYS.SYNC_ENABLED);
    
    if (savedUser && syncEnabled === 'true') {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        showView('home');
    } else {
        showView('login');
    }
}

function loadUserData() {
    loadData();
    updateUI();
    displayUserInfo();
}

function displayUserInfo() {
    if (currentUser) {
        // Header avatar
        const avatar = document.getElementById('user-avatar');
        if (currentUser.picture) {
            avatar.style.backgroundImage = `url(${currentUser.picture})`;
        } else {
            avatar.style.background = `linear-gradient(135deg, var(--primary-blue), var(--accent-orange))`;
        }
        
        // User details in settings
        const userDetails = document.getElementById('user-details');
        userDetails.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${currentUser.picture || ''}" 
                     alt="${currentUser.name}" 
                     style="width: 50px; height: 50px; border-radius: 50%;"
                     onerror="this.style.display='none'">
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${currentUser.name}</div>
                    <div style="font-size: 0.85rem; opacity: 0.8;">${currentUser.email}</div>
                </div>
            </div>
        `;
        
        // Menu user info
        const menuUserInfo = document.getElementById('menu-user-info');
        menuUserInfo.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <img src="${currentUser.picture || ''}" 
                     alt="${currentUser.name}" 
                     style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 0.5rem;"
                     onerror="this.style.display='none'">
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${currentUser.name}</div>
                <div style="font-size: 0.85rem; opacity: 0.8;">${currentUser.email}</div>
            </div>
        `;
        
        document.getElementById('account-section').style.display = 'block';
    }
}

function signOut() {
    if (confirm('Are you sure you want to sign out? Your photos will remain on this device.')) {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, 'false');
        
        // Sign out from Google
        window.google?.accounts.id.disableAutoSelect();
        
        showToast('Signed out successfully');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Continue without sign-in
document.getElementById('continue-local-btn')?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_ENABLED, 'false');
    loadData();
    updateUI();
    showView('home');
    showToast('Using local storage only');
});

// Load data from localStorage
function loadData() {
    const savedPhotos = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    const savedFrequency = localStorage.getItem(STORAGE_KEYS.FREQUENCY);
    const savedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    const savedUploads = localStorage.getItem(STORAGE_KEYS.UPLOADS_THIS_MONTH);
    const savedMonth = localStorage.getItem(STORAGE_KEYS.UPLOAD_MONTH);
    
    if (savedPhotos) {
        photos = JSON.parse(savedPhotos);
    }
    
    if (savedFrequency) {
        frequency = savedFrequency;
        document.getElementById('frequency-select')?.setAttribute('value', frequency);
        document.getElementById('frequency-select-main')?.setAttribute('value', frequency);
    }
    
    if (savedFavorites) {
        favorites = new Set(JSON.parse(savedFavorites));
    }
    
    // Check if we need to reset monthly upload count
    const currentMonth = new Date().getMonth() + new Date().getFullYear() * 12;
    const savedMonthNum = savedMonth ? parseInt(savedMonth) : currentMonth;
    
    if (currentMonth !== savedMonthNum) {
        // New month - reset counter
        uploadsThisMonth = 0;
        localStorage.setItem(STORAGE_KEYS.UPLOADS_THIS_MONTH, '0');
        localStorage.setItem(STORAGE_KEYS.UPLOAD_MONTH, currentMonth.toString());
    } else if (savedUploads) {
        uploadsThisMonth = parseInt(savedUploads);
    }
    
    // Set first use date if not set
    if (!localStorage.getItem(STORAGE_KEYS.FIRST_USE_DATE)) {
        localStorage.setItem(STORAGE_KEYS.FIRST_USE_DATE, new Date().toISOString());
    }
}

// Save data to localStorage
function savePhotos() {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    
    // In production, sync with cloud storage here
    if (currentUser) {
        // Would upload to Firebase/Supabase/etc.
        syncToCloud();
    }
}

function saveFrequency() {
    localStorage.setItem(STORAGE_KEYS.FREQUENCY, frequency);
}

// Cloud sync placeholder
function syncToCloud() {
    // In production, this would:
    // 1. Connect to Firebase/Supabase
    // 2. Upload photos to cloud storage
    // 3. Save metadata to database
    // 4. Enable cross-device sync
    console.log('Syncing to cloud...', currentUser);
}

// Setup Event Listeners
function setupEventListeners() {
    // Capture button
    document.getElementById('capture-btn')?.addEventListener('click', () => {
        document.getElementById('photo-input').click();
    });
    
    // Photo input
    document.getElementById('photo-input')?.addEventListener('change', handlePhotoCapture);
    
    // Frequency selector
    document.getElementById('frequency-select')?.addEventListener('change', (e) => {
        frequency = e.target.value;
        saveFrequency();
        updateUI();
        showToast(`Reminder frequency updated to ${frequency}`);
    });
    
    // Month/Year selectors
    document.getElementById('month-select')?.addEventListener('change', updateCompileView);
    document.getElementById('year-select-monthly')?.addEventListener('change', updateCompileView);
    document.getElementById('year-select-yearly')?.addEventListener('change', updateCompileView);
    
    // Set current date
    const now = new Date();
    const monthSelect = document.getElementById('month-select');
    const yearMonthly = document.getElementById('year-select-monthly');
    const yearYearly = document.getElementById('year-select-yearly');
    
    if (monthSelect) monthSelect.value = now.getMonth();
    if (yearMonthly) yearMonthly.value = now.getFullYear();
    if (yearYearly) yearYearly.value = now.getFullYear();
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
            timestamp: Date.now(),
            userId: currentUser?.id || 'local'
        };
        
        photos.push(photo);
        savePhotos();
        localStorage.setItem(STORAGE_KEYS.LAST_CAPTURE, new Date().toISOString());
        
        updateUI();
        showToast('Moment captured! 📸');
        
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
    document.getElementById('total-moments').textContent = photos.length;
    
    const now = new Date();
    const monthPhotos = getMonthPhotos(now.getMonth(), now.getFullYear());
    const yearPhotos = getYearPhotos(now.getFullYear());
    
    document.getElementById('month-moments').textContent = monthPhotos.length;
    document.getElementById('year-moments').textContent = yearPhotos.length;
    
    document.getElementById('frequency-display').textContent = 
        frequency.charAt(0).toUpperCase() + frequency.slice(1) + ' capture mode';
    
    const lastCapture = localStorage.getItem(STORAGE_KEYS.LAST_CAPTURE);
    let capturedRecently = false;
    
    if (lastCapture) {
        const lastDate = new Date(lastCapture);
        const today = new Date();
        
        if (frequency === 'daily') {
            capturedRecently = lastDate.toDateString() === today.toDateString();
        } else {
            const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            capturedRecently = daysDiff < 7;
        }
    }
    
    const statusEl = document.getElementById('capture-status');
    if (statusEl) {
        statusEl.textContent = capturedRecently ? "Today's Moment ✓" : 
            (frequency === 'daily' ? "Capture Today's Moment" : "Capture This Week's Moment");
    }
}

function updateGalleryView() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
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
    
    const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);
    
    galleryGrid.innerHTML = sortedPhotos.map(photo => `
        <div class="gallery-item">
            <img src="${photo.data}" alt="Captured moment" loading="lazy">
            <div class="gallery-item-info">
                <div class="gallery-item-date">${formatDate(photo.date)}</div>
            </div>
        </div>
    `).join('');
}

function updateCompileView() {
    const monthSelect = document.getElementById('month-select');
    const yearMonthly = document.getElementById('year-select-monthly');
    const yearYearly = document.getElementById('year-select-yearly');
    
    if (!monthSelect || !yearMonthly || !yearYearly) return;
    
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYearMonthly = parseInt(yearMonthly.value);
    const selectedYearYearly = parseInt(yearYearly.value);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthPhotos = getMonthPhotos(selectedMonth, selectedYearMonthly);
    
    document.getElementById('monthly-count').textContent = 
        `${monthPhotos.length} photos from ${monthNames[selectedMonth]} ${selectedYearMonthly}`;
    
    const monthlyPreview = document.getElementById('monthly-preview');
    monthlyPreview.innerHTML = monthPhotos.slice(0, 8).map(photo => 
        `<img src="${photo.data}" alt="Preview" loading="lazy">`
    ).join('');
    
    document.getElementById('generate-monthly').disabled = monthPhotos.length === 0;
    
    const yearPhotos = getYearPhotos(selectedYearYearly);
    
    document.getElementById('yearly-count').textContent = 
        `${yearPhotos.length} photos from ${selectedYearYearly}`;
    
    const yearlyPreview = document.getElementById('yearly-preview');
    yearlyPreview.innerHTML = yearPhotos.slice(0, 8).map(photo => 
        `<img src="${photo.data}" alt="Preview" loading="lazy">`
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
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById(viewName + '-view')?.classList.add('active');
    currentView = viewName;
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`.nav-btn[onclick*="${viewName}"]`)?.classList.add('active');
    
    if (viewName === 'gallery') {
        updateGalleryView();
    } else if (viewName === 'compile') {
        updateCompileView();
    }
}

// Settings
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel?.classList.toggle('hidden');
    panel?.classList.toggle('active');
}

// User Menu
function showMenu() {
    const menu = document.getElementById('user-menu');
    menu?.classList.toggle('hidden');
    menu?.classList.toggle('active');
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
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const photoCount = photoSet.length;
    const cols = Math.ceil(Math.sqrt(photoCount));
    const rows = Math.ceil(photoCount / cols);
    
    const photoSize = 400;
    canvas.width = cols * photoSize;
    canvas.height = rows * photoSize;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let loadedCount = 0;
    const totalPhotos = photoSet.length;
    
    photoSet.forEach((photo, index) => {
        const img = new Image();
        img.onload = () => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = col * photoSize;
            const y = row * photoSize;
            
            const imgAspect = img.width / img.height;
            const boxAspect = 1;
            
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
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}

// ========== NEW V3 FEATURES ==========

// Upload Feature
document.getElementById('upload-btn')?.addEventListener('click', () => {
    if (uploadsThisMonth >= MAX_FREE_UPLOADS) {
        showToast('Monthly upload limit reached! Upgrade to Premium for unlimited uploads.');
        return;
    }
    document.getElementById('upload-input').click();
});

document.getElementById('upload-input')?.addEventListener('change', handlePhotoUpload);

function handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const remainingUploads = MAX_FREE_UPLOADS - uploadsThisMonth;
    const filesToProcess = Math.min(files.length, remainingUploads);
    
    if (files.length > remainingUploads) {
        showToast(`Can only upload ${remainingUploads} more photo(s) this month`);
    }
    
    let processed = 0;
    
    for (let i = 0; i < filesToProcess; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const photo = {
                id: Date.now() + i,
                data: e.target.result,
                date: new Date().toISOString(),
                timestamp: Date.now() + i,
                userId: currentUser?.id || 'local',
                uploaded: true
            };
            
            photos.push(photo);
            processed++;
            
            if (processed === filesToProcess) {
                uploadsThisMonth += filesToProcess;
                localStorage.setItem(STORAGE_KEYS.UPLOADS_THIS_MONTH, uploadsThisMonth.toString());
                savePhotos();
                updateUI();
                showToast(`${filesToProcess} photo(s) uploaded! 📤`);
            }
        };
        reader.readAsDataURL(file);
    }
    
    event.target.value = '';
}

// Update upload count display
function updateUploadCount() {
    const uploadBtn = document.getElementById('upload-btn');
    const uploadCount = document.getElementById('upload-count');
    const remaining = MAX_FREE_UPLOADS - uploadsThisMonth;
    
    if (uploadCount && remaining < MAX_FREE_UPLOADS) {
        uploadCount.textContent = `${remaining} left`;
        uploadCount.style.display = 'block';
    } else if (uploadCount) {
        uploadCount.style.display = 'none';
    }
    
    if (uploadBtn && uploadsThisMonth >= MAX_FREE_UPLOADS) {
        uploadBtn.style.opacity = '0.6';
        uploadBtn.title = 'Monthly limit reached';
    }
    
    // Update settings page
    const progressBar = document.getElementById('upload-progress-bar');
    const limitText = document.getElementById('upload-limit-text');
    
    if (progressBar) {
        const percentage = (uploadsThisMonth / MAX_FREE_UPLOADS) * 100;
        progressBar.style.width = `${percentage}%`;
    }
    
    if (limitText) {
        limitText.textContent = `${uploadsThisMonth} of ${MAX_FREE_UPLOADS} uploads this month`;
    }
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('active');
    updateSidebarUserInfo();
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.remove('active');
}

function updateSidebarUserInfo() {
    const sidebarUserInfo = document.getElementById('sidebar-user-info');
    if (!sidebarUserInfo) return;
    
    if (currentUser) {
        sidebarUserInfo.innerHTML = `
            <div class="sidebar-user-avatar" style="background-image: url(${currentUser.picture || ''})"></div>
            <div class="sidebar-user-name">${currentUser.name}</div>
            <div class="sidebar-user-email">${currentUser.email}</div>
        `;
    } else {
        sidebarUserInfo.innerHTML = `
            <div class="sidebar-user-avatar"></div>
            <div class="sidebar-user-name">Guest User</div>
            <div class="sidebar-user-email">Using local storage</div>
        `;
    }
}

// Favorites Functions
function toggleFavorite(photoId) {
    if (favorites.has(photoId)) {
        favorites.delete(photoId);
        showToast('Removed from favorites');
    } else {
        favorites.add(photoId);
        showToast('Added to favorites ⭐');
    }
    
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites]));
    updateUI();
}

function updateFavoritesView() {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;
    
    const favoritePhotos = photos.filter(photo => favorites.has(photo.id));
    
    if (favoritePhotos.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <p>No favorite moments yet</p>
                <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem;">Star your best photos to see them here</p>
            </div>
        `;
        return;
    }
    
    const sortedFavorites = [...favoritePhotos].sort((a, b) => b.timestamp - a.timestamp);
    
    favoritesGrid.innerHTML = sortedFavorites.map(photo => `
        <div class="gallery-item">
            <img src="${photo.data}" alt="Favorite moment" loading="lazy">
            <div class="gallery-item-overlay">
                <button class="star-btn starred" onclick="toggleFavorite(${photo.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </button>
            </div>
            <div class="gallery-item-info">
                <div class="gallery-item-date">${formatDate(photo.date)}</div>
            </div>
        </div>
    `).join('');
}

// Update gallery to include star buttons
function updateGalleryViewWithStars() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;
    
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
    
    const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);
    
    galleryGrid.innerHTML = sortedPhotos.map(photo => `
        <div class="gallery-item">
            <img src="${photo.data}" alt="Captured moment" loading="lazy">
            <div class="gallery-item-overlay">
                <button class="star-btn ${favorites.has(photo.id) ? 'starred' : ''}" onclick="toggleFavorite(${photo.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </button>
            </div>
            <div class="gallery-item-info">
                <div class="gallery-item-date">${formatDate(photo.date)}</div>
            </div>
        </div>
    `).join('');
}

// Profile Functions
function updateProfileView() {
    const profileInfo = document.getElementById('profile-info');
    if (!profileInfo) return;
    
    if (currentUser) {
        profileInfo.innerHTML = `
            <div class="profile-avatar-large" style="background-image: url(${currentUser.picture || ''})"></div>
            <div class="profile-name">${currentUser.name}</div>
            <div class="profile-email">${currentUser.email}</div>
        `;
    } else {
        profileInfo.innerHTML = `
            <div class="profile-avatar-large"></div>
            <div class="profile-name">Guest User</div>
            <div class="profile-email">Using local storage only</div>
        `;
    }
    
    // Update stats
    document.getElementById('profile-total').textContent = photos.length;
    document.getElementById('profile-favorites').textContent = favorites.size;
    
    // Calculate days active
    const firstUse = localStorage.getItem(STORAGE_KEYS.FIRST_USE_DATE);
    if (firstUse) {
        const daysActive = Math.floor((Date.now() - new Date(firstUse).getTime()) / (1000 * 60 * 60 * 24));
        document.getElementById('profile-days').textContent = daysActive;
    }
}

// Export all data
function exportAllData() {
    const exportData = {
        photos: photos,
        favorites: [...favorites],
        user: currentUser,
        frequency: frequency,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clockit-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data exported successfully! 💾');
    closeSidebar();
}

// Update frequency selector
document.getElementById('frequency-select-main')?.addEventListener('change', (e) => {
    frequency = e.target.value;
    saveFrequency();
    updateUI();
    showToast(`Reminder frequency updated to ${frequency}`);
});

// Override the original updateGalleryView to use the new one with stars
const originalUpdateGalleryView = updateGalleryView;
updateGalleryView = updateGalleryViewWithStars;

// Override updateUI to include new views
const originalUpdateUI = updateUI;
updateUI = function() {
    originalUpdateUI();
    updateUploadCount();
    updateFavoritesView();
    updateProfileView();
};

// Override showView to track last view
const originalShowView = showView;
showView = function(viewName) {
    if (currentView !== 'settings' && currentView !== 'profile') {
        lastView = currentView;
    }
    originalShowView(viewName);
};


// ========== REMINDER SYSTEM INTEGRATION ==========

// Reminder system state
let reminderSystem = {
    permission: 'default',
    reminderEnabled: true,
    reminderTime: { hour: 20, minute: 0 },
    frequency: 'daily',
    weekday: 0,
    messages: [
        "Lift your head 😉, it's time to make memories",
        "📸 Capture this moment before it's gone!",
        "Your future self will thank you for this photo 💙",
        "Time to Clock It! What's your vibe today? ✨",
        "Don't let today slip away - snap a moment! 🌟",
        "Your memory awaits... Take a photo! 📷",
        "Psst... it's photo time! Make it count 😊",
        "Today deserves to be remembered 💫",
        "Quick! Grab your phone and capture now 📸",
        "Your story continues... Add today's chapter! 📖"
    ]
};

// Initialize reminders
async function initReminders() {
    // Check notification permission
    if ('Notification' in window) {
        reminderSystem.permission = Notification.permission;
    }
    
    // Load saved settings
    loadReminderSettings();
    
    // Setup event listeners
    setupReminderListeners();
    
    // Update UI
    updateReminderUI();
    
    // Schedule if enabled
    if (reminderSystem.reminderEnabled && reminderSystem.permission === 'granted') {
        scheduleNextReminder();
    }
}

// Load reminder settings from localStorage
function loadReminderSettings() {
    const saved = localStorage.getItem('clockit-reminder-settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            reminderSystem.reminderTime = settings.reminderTime || { hour: 20, minute: 0 };
            reminderSystem.reminderEnabled = settings.reminderEnabled !== false;
            reminderSystem.frequency = settings.frequency || 'daily';
            reminderSystem.weekday = settings.weekday || 0;
        } catch (error) {
            console.error('Failed to load reminder settings:', error);
        }
    }
}

// Save reminder settings
function saveReminderSettings() {
    const settings = {
        reminderTime: reminderSystem.reminderTime,
        reminderEnabled: reminderSystem.reminderEnabled,
        frequency: reminderSystem.frequency,
        weekday: reminderSystem.weekday
    };
    localStorage.setItem('clockit-reminder-settings', JSON.stringify(settings));
}

// Setup reminder event listeners
function setupReminderListeners() {
    // Toggle reminders
    document.getElementById('reminder-toggle')?.addEventListener('change', (e) => {
        reminderSystem.reminderEnabled = e.target.checked;
        document.getElementById('reminder-settings-details').style.display = 
            e.target.checked ? 'block' : 'none';
        saveReminderSettings();
        updateReminderInfo();
        
        if (e.target.checked && reminderSystem.permission !== 'granted') {
            requestNotificationPermission();
        } else if (e.target.checked) {
            scheduleNextReminder();
        }
    });
    
    // Time change
    document.getElementById('reminder-hour')?.addEventListener('change', updateReminderTime);
    document.getElementById('reminder-minute')?.addEventListener('change', updateReminderTime);
    
    // Frequency change
    document.getElementById('reminder-frequency-select')?.addEventListener('change', (e) => {
        reminderSystem.frequency = e.target.value;
        const isWeekly = e.target.value === 'weekly';
        document.getElementById('weekday-picker').style.display = isWeekly ? 'block' : 'none';
        saveReminderSettings();
        updateReminderInfo();
        scheduleNextReminder();
    });
    
    document.getElementById('reminder-weekday')?.addEventListener('change', (e) => {
        reminderSystem.weekday = parseInt(e.target.value);
        saveReminderSettings();
        updateReminderInfo();
        scheduleNextReminder();
    });
    
    // Test reminder button
    document.getElementById('test-reminder-btn')?.addEventListener('click', testReminderNotification);
}

// Update reminder time
function updateReminderTime() {
    const hour = parseInt(document.getElementById('reminder-hour')?.value || 20);
    const minute = parseInt(document.getElementById('reminder-minute')?.value || 0);
    reminderSystem.reminderTime = { hour, minute };
    saveReminderSettings();
    updateReminderInfo();
    scheduleNextReminder();
}

// Update reminder UI with saved settings
function updateReminderUI() {
    const hourEl = document.getElementById('reminder-hour');
    const minuteEl = document.getElementById('reminder-minute');
    const toggleEl = document.getElementById('reminder-toggle');
    const frequencyEl = document.getElementById('reminder-frequency-select');
    
    if (hourEl) hourEl.value = reminderSystem.reminderTime.hour;
    if (minuteEl) minuteEl.value = reminderSystem.reminderTime.minute;
    if (toggleEl) toggleEl.checked = reminderSystem.reminderEnabled;
    if (frequencyEl) frequencyEl.value = reminderSystem.frequency;
    
    if (reminderSystem.frequency === 'weekly') {
        document.getElementById('weekday-picker').style.display = 'block';
        document.getElementById('reminder-weekday').value = reminderSystem.weekday;
    }
    
    document.getElementById('reminder-settings-details').style.display = 
        reminderSystem.reminderEnabled ? 'block' : 'none';
    
    updateReminderInfo();
}

// Update next reminder info text
function updateReminderInfo() {
    const textEl = document.getElementById('next-reminder-text');
    if (!textEl) return;
    
    if (!reminderSystem.reminderEnabled) {
        textEl.textContent = 'Reminders are disabled';
        return;
    }
    
    const nextTime = getNextReminderTime();
    const now = new Date();
    const timeUntil = nextTime - now;
    
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    const timeStr = nextTime.toLocaleString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    if (hours < 24) {
        textEl.textContent = `Next reminder: ${timeStr} (in ${hours}h ${minutes}m)`;
    } else {
        textEl.textContent = `Next reminder: ${timeStr}`;
    }
}

// Calculate next reminder time
function getNextReminderTime() {
    const now = new Date();
    const reminder = new Date();
    
    reminder.setHours(reminderSystem.reminderTime.hour);
    reminder.setMinutes(reminderSystem.reminderTime.minute);
    reminder.setSeconds(0);
    reminder.setMilliseconds(0);

    // If time has passed today, schedule for tomorrow/next week
    if (reminder <= now) {
        if (reminderSystem.frequency === 'daily') {
            reminder.setDate(reminder.getDate() + 1);
        } else {
            // Weekly: find next occurrence of weekday
            let daysUntilNext = (reminderSystem.weekday - reminder.getDay() + 7) % 7;
            if (daysUntilNext === 0) daysUntilNext = 7;
            reminder.setDate(reminder.getDate() + daysUntilNext);
        }
    } else if (reminderSystem.frequency === 'weekly') {
        // Check if today is the right weekday
        if (reminder.getDay() !== reminderSystem.weekday) {
            let daysUntilNext = (reminderSystem.weekday - reminder.getDay() + 7) % 7;
            reminder.setDate(reminder.getDate() + daysUntilNext);
        }
    }

    return reminder;
}

// Schedule next reminder
let reminderTimeout = null;
function scheduleNextReminder() {
    if (!reminderSystem.reminderEnabled || reminderSystem.permission !== 'granted') {
        return;
    }
    
    // Clear existing
    if (reminderTimeout) {
        clearTimeout(reminderTimeout);
    }
    
    const nextTime = getNextReminderTime();
    const timeUntil = nextTime - new Date();
    
    console.log(`Next reminder: ${nextTime.toLocaleString()}`);
    
    reminderTimeout = setTimeout(() => {
        showReminderNotification();
        setTimeout(() => scheduleNextReminder(), 1000);
    }, timeUntil);
}

// Show reminder notification
async function showReminderNotification() {
    if (reminderSystem.permission !== 'granted') return;
    
    const message = reminderSystem.messages[Math.floor(Math.random() * reminderSystem.messages.length)];
    
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Clock It - Time for Memories! 📸', {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            image: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'clockit-reminder',
            requireInteraction: true,
            actions: [
                { action: 'capture', title: '📸 Capture Now' },
                { action: 'later', title: 'Remind Later' }
            ]
        });
    } catch (error) {
        console.error('Notification error:', error);
    }
}

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notifications not supported on this device');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        reminderSystem.permission = permission;
        
        if (permission === 'granted') {
            showToast('Notifications enabled! 🔔');
            scheduleNextReminder();
            return true;
        } else {
            showToast('Please enable notifications in your browser settings');
            return false;
        }
    } catch (error) {
        console.error('Permission request failed:', error);
        return false;
    }
}

// Test reminder notification
async function testReminderNotification() {
    if (reminderSystem.permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Test Notification 🔔', {
            body: "This is how your reminders will look! 😊",
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'clockit-test'
        });
        showToast('Test notification sent!');
    } catch (error) {
        console.error('Test notification failed:', error);
        showToast('Failed to send test notification');
    }
}

// Initialize reminders when app loads
setTimeout(() => {
    initReminders();
}, 1000);

// Listen for service worker messages
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'open-camera') {
            document.getElementById('photo-input')?.click();
        } else if (event.data && event.data.action === 'snooze-reminder') {
            // Snooze for 1 hour
            const snoozeTime = new Date();
            snoozeTime.setHours(snoozeTime.getHours() + 1);
            const timeUntil = snoozeTime - new Date();
            
            setTimeout(() => {
                showReminderNotification();
            }, timeUntil);
            
            showToast('Reminder snoozed for 1 hour');
        }
    });
}

