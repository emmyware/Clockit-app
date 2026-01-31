// Social Media Sharing Module for Clock It V4
// Handles branded image generation and platform-specific sharing

class SocialMediaSharer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.platforms = {
            instagram: { width: 1080, height: 1080, format: 'square' },
            instagramStory: { width: 1080, height: 1920, format: 'story' },
            twitter: { width: 1200, height: 675, format: 'landscape' },
            tiktok: { width: 1080, height: 1920, format: 'vertical' },
            whatsapp: { width: 1080, height: 1080, format: 'square' }
        };
    }

    // Add Clock It branding to image
    async addBranding(imageData, options = {}) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Set canvas size
                const platform = options.platform || 'instagram';
                const specs = this.platforms[platform];
                this.canvas.width = specs.width;
                this.canvas.height = specs.height;

                // Fill background
                this.ctx.fillStyle = options.backgroundColor || '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Calculate image placement (centered with padding)
                const padding = 80;
                const availableWidth = this.canvas.width - (padding * 2);
                const availableHeight = this.canvas.height - (padding * 2) - 120; // Reserve space for branding

                let drawWidth, drawHeight, drawX, drawY;
                const imgAspect = img.width / img.height;
                const availableAspect = availableWidth / availableHeight;

                if (imgAspect > availableAspect) {
                    drawWidth = availableWidth;
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawHeight = availableHeight;
                    drawWidth = drawHeight * imgAspect;
                }

                drawX = (this.canvas.width - drawWidth) / 2;
                drawY = padding + 60;

                // Draw rounded rectangle for image
                this.ctx.save();
                this.roundRect(drawX, drawY, drawWidth, drawHeight, 20);
                this.ctx.clip();
                this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                this.ctx.restore();

                // Add shadow to image
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                this.ctx.shadowBlur = 20;
                this.ctx.shadowOffsetX = 0;
                this.ctx.shadowOffsetY = 10;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.roundRect(drawX, drawY, drawWidth, drawHeight, 20);
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;

                // Add "Clock It" branding at top
                this.addTopBranding(options);

                // Add bottom watermark
                this.addBottomWatermark(options);

                // Add date if provided
                if (options.date) {
                    this.addDate(options.date);
                }

                resolve(this.canvas.toDataURL('image/jpeg', 0.95));
            };
            img.src = imageData;
        });
    }

    // Add stylish top branding
    addTopBranding(options) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(0.5, '#4169e1');
        gradient.addColorStop(1, '#ffa500');

        // Draw Clock It text
        this.ctx.fillStyle = gradient;
        this.ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Clock It', this.canvas.width / 2, 55);

        // Add subtitle if provided
        if (options.subtitle) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '24px "Segoe UI", Arial, sans-serif';
            this.ctx.fillText(options.subtitle, this.canvas.width / 2, 90);
        }
    }

    // Add bottom watermark
    addBottomWatermark(options) {
        const y = this.canvas.height - 50;
        
        // Subtle background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);

        // Gradient text
        const gradient = this.ctx.createLinearGradient(0, y, this.canvas.width, y);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(1, '#ffa500');

        this.ctx.fillStyle = gradient;
        this.ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📸 Clock It', this.canvas.width / 2, y);

        // Tagline
        this.ctx.fillStyle = '#888';
        this.ctx.font = '18px "Segoe UI", Arial, sans-serif';
        this.ctx.fillText('Capture your moments, one at a time', this.canvas.width / 2, y + 30);
    }

    // Add date stamp
    addDate(dateString) {
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(40, 110, 300, 50);

        this.ctx.fillStyle = '#1e90ff';
        this.ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📅 ' + formatted, 55, 143);
    }

    // Helper: Round rectangle
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    // Create carousel-ready images (multiple photos)
    async createCarousel(photos, platform = 'instagram') {
        const brandedImages = [];
        
        for (let i = 0; i < Math.min(photos.length, 10); i++) {
            const branded = await this.addBranding(photos[i].data, {
                platform: platform,
                subtitle: `${i + 1} of ${Math.min(photos.length, 10)}`,
                date: photos[i].date
            });
            brandedImages.push(branded);
        }
        
        return brandedImages;
    }

    // Create improved grid collage
    async createGridCollage(photos, options = {}) {
        const {
            columns = 3,
            spacing = 20,
            maxPhotos = 9,
            platform = 'instagram'
        } = options;

        const specs = this.platforms[platform];
        this.canvas.width = specs.width;
        this.canvas.height = specs.height;

        // Background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(1, '#ffa500');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate grid
        const photoCount = Math.min(photos.length, maxPhotos);
        const rows = Math.ceil(photoCount / columns);
        const headerSpace = 120;
        const footerSpace = 100;
        const availableHeight = this.canvas.height - headerSpace - footerSpace;
        
        const cellWidth = (this.canvas.width - (spacing * (columns + 1))) / columns;
        const cellHeight = (availableHeight - (spacing * (rows + 1))) / rows;

        // Add header
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Clock It', this.canvas.width / 2, 70);

        // Load and place photos
        const photoPromises = photos.slice(0, maxPhotos).map((photo, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const col = index % columns;
                    const row = Math.floor(index / columns);
                    
                    const x = spacing + (col * (cellWidth + spacing));
                    const y = headerSpace + spacing + (row * (cellHeight + spacing));

                    // Draw white background (photo frame)
                    this.ctx.fillStyle = 'white';
                    this.ctx.save();
                    this.roundRect(x, y, cellWidth, cellHeight, 15);
                    this.ctx.fill();
                    this.ctx.clip();

                    // Calculate image fit
                    const imgAspect = img.width / img.height;
                    const cellAspect = cellWidth / cellHeight;
                    
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    if (imgAspect > cellAspect) {
                        drawHeight = cellHeight;
                        drawWidth = drawHeight * imgAspect;
                        drawX = x - (drawWidth - cellWidth) / 2;
                        drawY = y;
                    } else {
                        drawWidth = cellWidth;
                        drawHeight = drawWidth / imgAspect;
                        drawX = x;
                        drawY = y - (drawHeight - cellHeight) / 2;
                    }

                    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    this.ctx.restore();

                    // Add subtle shadow
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 5;
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.lineWidth = 3;
                    this.roundRect(x, y, cellWidth, cellHeight, 15);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;

                    resolve();
                };
                img.src = photo.data;
            });
        });

        await Promise.all(photoPromises);

        // Add footer
        const footerY = this.canvas.height - 50;
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${photoCount} Moments`, this.canvas.width / 2, footerY);

        return this.canvas.toDataURL('image/jpeg', 0.95);
    }

    // Platform-specific sharing
    shareToInstagram(imageData) {
        // Download image (user manually uploads to IG)
        const a = document.createElement('a');
        a.href = imageData;
        a.download = `clockit-${Date.now()}.jpg`;
        a.click();
        
        // Open Instagram in new tab (mobile will open app)
        setTimeout(() => {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                window.open('instagram://camera', '_blank');
            } else {
                window.open('https://www.instagram.com/', '_blank');
            }
        }, 500);
    }

    shareToTwitter(imageData, text = 'Check out my moments! 📸 #ClockIt') {
        // Download image first
        const a = document.createElement('a');
        a.href = imageData;
        a.download = `clockit-${Date.now()}.jpg`;
        a.click();
        
        // Open Twitter compose
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank');
    }

    shareToWhatsApp(imageData, text = 'My Clock It moments! 📸') {
        // Mobile: Use Web Share API if available
        if (navigator.share) {
            fetch(imageData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'clockit.jpg', { type: 'image/jpeg' });
                    navigator.share({
                        title: 'Clock It Moments',
                        text: text,
                        files: [file]
                    });
                });
        } else {
            // Desktop: Download and open WhatsApp Web
            const a = document.createElement('a');
            a.href = imageData;
            a.download = `clockit-${Date.now()}.jpg`;
            a.click();
            
            setTimeout(() => {
                const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(whatsappUrl, '_blank');
            }, 500);
        }
    }

    shareToTikTok(imageData) {
        // Download image
        const a = document.createElement('a');
        a.href = imageData;
        a.download = `clockit-${Date.now()}.jpg`;
        a.click();
        
        // Open TikTok
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.open('https://www.tiktok.com/upload', '_blank');
        } else {
            window.open('https://www.tiktok.com/', '_blank');
        }
    }

    // Generic download for any image
    downloadImage(imageData, filename = 'clockit-moment.jpg') {
        const a = document.createElement('a');
        a.href = imageData;
        a.download = filename;
        a.click();
    }
}

// Export for use in main app
export default SocialMediaSharer;
