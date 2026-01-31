// Push Notification & Reminder System for Clock It V4
// Supports Dynamic Island (iPhone 14+), Android notifications, and custom scheduling

class ReminderSystem {
    constructor() {
        this.permission = 'default';
        this.registration = null;
        this.reminderTime = { hour: 20, minute: 0 }; // Default: 8:00 PM
        this.reminderEnabled = true;
        this.frequency = 'daily'; // 'daily' or 'weekly'
        this.weekday = 0; // 0 = Sunday, 6 = Saturday (for weekly)
        
        // Encouraging messages
        this.messages = [
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
        ];
    }

    // Initialize notification system
    async initialize() {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.log('Service Workers not supported');
            return false;
        }

        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        // Load saved settings
        this.loadSettings();

        // Check current permission
        this.permission = Notification.permission;

        // Get service worker registration
        try {
            this.registration = await navigator.serviceWorker.ready;
            return true;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    // Request notification permission
    async requestPermission() {
        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.scheduleReminder();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Permission request failed:', error);
            return false;
        }
    }

    // Set reminder time
    setReminderTime(hour, minute) {
        this.reminderTime = { hour, minute };
        this.saveSettings();
        this.scheduleReminder();
    }

    // Set reminder frequency
    setFrequency(frequency, weekday = 0) {
        this.frequency = frequency;
        this.weekday = weekday;
        this.saveSettings();
        this.scheduleReminder();
    }

    // Enable/disable reminders
    toggleReminder(enabled) {
        this.reminderEnabled = enabled;
        this.saveSettings();
        
        if (enabled) {
            this.scheduleReminder();
        } else {
            this.cancelReminder();
        }
    }

    // Calculate next reminder time
    getNextReminderTime() {
        const now = new Date();
        const reminder = new Date();
        
        reminder.setHours(this.reminderTime.hour);
        reminder.setMinutes(this.reminderTime.minute);
        reminder.setSeconds(0);
        reminder.setMilliseconds(0);

        // If time has passed today, schedule for tomorrow/next week
        if (reminder <= now) {
            if (this.frequency === 'daily') {
                reminder.setDate(reminder.getDate() + 1);
            } else {
                // Weekly: find next occurrence of weekday
                let daysUntilNext = (this.weekday - reminder.getDay() + 7) % 7;
                if (daysUntilNext === 0) daysUntilNext = 7; // Next week
                reminder.setDate(reminder.getDate() + daysUntilNext);
            }
        } else if (this.frequency === 'weekly') {
            // Check if today is the right weekday
            if (reminder.getDay() !== this.weekday) {
                let daysUntilNext = (this.weekday - reminder.getDay() + 7) % 7;
                reminder.setDate(reminder.getDate() + daysUntilNext);
            }
        }

        return reminder;
    }

    // Schedule reminder
    scheduleReminder() {
        if (!this.reminderEnabled || this.permission !== 'granted') {
            return;
        }

        // Cancel any existing reminder
        this.cancelReminder();

        const nextTime = this.getNextReminderTime();
        const timeUntil = nextTime - new Date();

        console.log(`Next reminder: ${nextTime.toLocaleString()}`);
        console.log(`Time until: ${Math.floor(timeUntil / 1000 / 60)} minutes`);

        // Set timeout for reminder
        this.reminderTimeout = setTimeout(() => {
            this.showReminder();
            
            // Schedule next reminder
            setTimeout(() => this.scheduleReminder(), 1000);
        }, timeUntil);

        // Save scheduled time
        localStorage.setItem('clockit-next-reminder', nextTime.toISOString());
    }

    // Cancel scheduled reminder
    cancelReminder() {
        if (this.reminderTimeout) {
            clearTimeout(this.reminderTimeout);
            this.reminderTimeout = null;
        }
        localStorage.removeItem('clockit-next-reminder');
    }

    // Show reminder notification
    async showReminder() {
        if (this.permission !== 'granted') return;

        const message = this.getRandomMessage();
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        const options = {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            image: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'clockit-reminder',
            requireInteraction: true,
            actions: [
                {
                    action: 'capture',
                    title: '📸 Capture Now',
                    icon: '/icon-192.png'
                },
                {
                    action: 'later',
                    title: 'Remind Later',
                    icon: '/icon-192.png'
                }
            ],
            data: {
                url: window.location.origin + window.location.pathname,
                time: timeString
            }
        };

        try {
            // Use service worker for better Dynamic Island support
            if (this.registration) {
                await this.registration.showNotification('Clock It - Time for Memories! 📸', options);
            } else {
                // Fallback to regular notification
                new Notification('Clock It - Time for Memories! 📸', options);
            }

            // Track notification shown
            this.trackNotification();
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    // Get random encouraging message
    getRandomMessage() {
        const randomIndex = Math.floor(Math.random() * this.messages.length);
        return this.messages[randomIndex];
    }

    // Add custom message
    addCustomMessage(message) {
        this.messages.push(message);
        this.saveSettings();
    }

    // Show test notification
    async testNotification() {
        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) {
                alert('Please enable notifications to test');
                return;
            }
        }

        const options = {
            body: "This is a test! Your reminders will look like this 😊",
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'clockit-test'
        };

        if (this.registration) {
            await this.registration.showNotification('Test Notification 🔔', options);
        } else {
            new Notification('Test Notification 🔔', options);
        }
    }

    // Snooze reminder (remind in 1 hour)
    snoozeReminder() {
        const snoozeTime = new Date();
        snoozeTime.setHours(snoozeTime.getHours() + 1);
        
        const timeUntil = snoozeTime - new Date();
        
        setTimeout(() => {
            this.showReminder();
        }, timeUntil);
    }

    // Save settings to localStorage
    saveSettings() {
        const settings = {
            reminderTime: this.reminderTime,
            reminderEnabled: this.reminderEnabled,
            frequency: this.frequency,
            weekday: this.weekday,
            customMessages: this.messages.slice(10) // Only custom ones
        };
        localStorage.setItem('clockit-reminder-settings', JSON.stringify(settings));
    }

    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('clockit-reminder-settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.reminderTime = settings.reminderTime || { hour: 20, minute: 0 };
                this.reminderEnabled = settings.reminderEnabled !== false;
                this.frequency = settings.frequency || 'daily';
                this.weekday = settings.weekday || 0;
                if (settings.customMessages) {
                    this.messages = [...this.messages.slice(0, 10), ...settings.customMessages];
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }

    // Get next reminder info
    getNextReminderInfo() {
        if (!this.reminderEnabled) {
            return { enabled: false };
        }

        const nextTime = this.getNextReminderTime();
        const now = new Date();
        const timeUntil = nextTime - now;
        
        const hours = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

        return {
            enabled: true,
            nextTime: nextTime.toLocaleString(),
            timeUntil: `${hours}h ${minutes}m`,
            hours,
            minutes
        };
    }

    // Track notification analytics
    trackNotification() {
        const stats = JSON.parse(localStorage.getItem('clockit-notification-stats') || '{}');
        stats.totalSent = (stats.totalSent || 0) + 1;
        stats.lastSent = new Date().toISOString();
        localStorage.setItem('clockit-notification-stats', JSON.stringify(stats));
    }

    // Get notification permission status
    getPermissionStatus() {
        return {
            granted: this.permission === 'granted',
            denied: this.permission === 'denied',
            default: this.permission === 'default',
            permission: this.permission
        };
    }
}

// Export singleton instance
const reminderSystem = new ReminderSystem();

export default reminderSystem;
