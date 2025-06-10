// Application State
const state = {
    currentDate: '',
    images: {
        storm: { loaded: false, error: false, url: '' },
        northeast: { loaded: false, error: false, url: '' },
        southeast: { loaded: false, error: false, url: '' },
        plains: { loaded: false, error: false, url: '' },
        wind: { loaded: false, error: false, url: '' }
    },
    downloads: {
        storm: { loading: false, success: false, error: null },
        northeast: { loading: false, success: false, error: null },
        southeast: { loading: false, success: false, error: null },
        plains: { loading: false, success: false, error: null },
        wind: { loading: false, success: false, error: null }
    }
};

// DOM Elements
const elements = {
    currentDate: document.getElementById('currentDate'),
    stormPreview: document.getElementById('stormPreview'),
    northeastPreview: document.getElementById('northeastPreview'),
    southeastPreview: document.getElementById('southeastPreview'),
    plainsPreview: document.getElementById('plainsPreview'),
    windPreview: document.getElementById('windPreview'),
    stormBtn: document.getElementById('stormBtn'),
    northeastBtn: document.getElementById('northeastBtn'),
    southeastBtn: document.getElementById('southeastBtn'),
    plainsBtn: document.getElementById('plainsBtn'),
    windBtn: document.getElementById('windBtn'),
    stormStatus: document.getElementById('stormStatus'),
    northeastStatus: document.getElementById('northeastStatus'),
    southeastStatus: document.getElementById('southeastStatus'),
    plainsStatus: document.getElementById('plainsStatus'),
    windStatus: document.getElementById('windStatus')
};

// Utility Functions
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getWeekdayCode = (date = new Date()) => {
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return weekdays[date.getDay()];
};

const getDateString = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Status Message Functions
const showStatus = (type, messageType, message) => {
    const statusElement = elements[`${type}Status`];
    const iconSvg = getStatusIcon(messageType);
    
    statusElement.innerHTML = `${iconSvg}<span>${message}</span>`;
    statusElement.className = `status-message show ${messageType}`;
    
    // Auto-hide success messages
    if (messageType === 'success') {
        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
};

const hideStatus = (type) => {
    elements[`${type}Status`].classList.remove('show');
};

const getStatusIcon = (type) => {
    const icons = {
        success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>`,
        error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`,
        info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`
    };
    return icons[type] || '';
};

// Image Loading Functions
const checkImageExists = async (type) => {
    try {
        const dateStr = getDateString();
        const response = await fetch(`/api/check-image?day=${dateStr}&type=${type}`);
        const data = await response.json();
        
        state.images[type] = {
            loaded: data.exists,
            error: !data.exists,
            url: data.url
        };
        
        return data.exists;
    } catch (error) {
        console.error(`Error checking ${type} image:`, error);
        state.images[type] = {
            loaded: false,
            error: true,
            url: ''
        };
        return false;
    }
};

const loadImagePreview = async (type) => {
    const previewElement = elements[`${type}Preview`];
    
    // Show loading state
    previewElement.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Loading ${type} outlook...</span>
        </div>
    `;
    
    const exists = await checkImageExists(type);
    
    if (exists) {
        const img = new Image();
        
        img.onload = () => {
            previewElement.innerHTML = `<img src="${state.images[type].url}" alt="${type} outlook">`;
            state.images[type].loaded = true;
        };
        
        img.onerror = () => {
            showImageError(type);
        };
        
        img.src = state.images[type].url;
    } else {
        showImageError(type);
    }
};

const showImageError = (type) => {
    const previewElement = elements[`${type}Preview`];
    const iconSvg = getIconForType(type);
    
    previewElement.innerHTML = `
        <div class="error-state">
            ${iconSvg}
            <span>Unable to load ${type} outlook image for today</span>
        </div>
    `;
    
    state.images[type] = { loaded: false, error: true, url: '' };
};

const getIconForType = (type) => {
    const icons = {
        storm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 19L18 7M11 4L7 8L11 12L7 16"></path>
        </svg>`,
        northeast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"></path>
        </svg>`,
        southeast: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"></path>
        </svg>`,
        plains: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18m-9-9v18"></path>
        </svg>`,
        wind: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2"></path>
            <path d="M9.6 4.6A2 2 0 1111 8H2"></path>
            <path d="M12.6 19.4A2 2 0 1014 16H2"></path>
        </svg>`
    };
    return icons[type] || icons.storm;
};

// Download Functions
const updateDownloadButton = (type, loading) => {
    const button = elements[`${type}Btn`];
    const icon = button.querySelector('.btn-icon');
    const text = button.querySelector('span');
    
    if (loading) {
        button.disabled = true;
        icon.innerHTML = `
            <div class="spinner" style="width: 1.25rem; height: 1.25rem; border-width: 2px;"></div>
        `;
        text.textContent = 'Downloading...';
    } else {
        button.disabled = false;
        icon.innerHTML = `
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
        `;
        
        const buttonTexts = {
            storm: 'Download General US Outlook',
            northeast: 'Download Northeast Outlook',
            southeast: 'Download Southeast Outlook',
            plains: 'Download Plains Outlook',
            wind: 'Download Wind Outlook'
        };
        
        text.textContent = buttonTexts[type] || 'Download Outlook';
    }
};

const downloadImage = async (type) => {
    // Prevent multiple simultaneous downloads
    if (state.downloads[type].loading) {
        return;
    }
    
    // Update UI to loading state
    state.downloads[type] = { loading: true, success: false, error: null };
    updateDownloadButton(type, true);
    hideStatus(type);
    showStatus(type, 'info', 'Preparing download...');
    
    try {
        const dateStr = getDateString();
        const downloadUrl = `/api/download?day=${dateStr}&type=${type}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.style.display = 'none';
        
        // Set filename based on type
        const filenames = {
            storm: `${dateStr}_General_US_Severe_Storm_Threat_Outlook.png`,
            northeast: `${dateStr}_Northeast_Severe_Storm_Threat_Outlook.png`,
            southeast: `${dateStr}_Southeast_Severe_Storm_Threat_Outlook.png`,
            plains: `${dateStr}_Southern_Plains_Severe_Storm_Threat_Outlook.png`,
            wind: `${dateStr}_Damaging_Wind_Threat_Outlook.png`
        };
        
        link.download = filenames[type] || `${dateStr}_Weather_Outlook.png`;
        
        // Add to DOM and trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update state
        state.downloads[type] = { loading: false, success: true, error: null };
        updateDownloadButton(type, false);
        showStatus(type, 'success', 'Download started successfully!');
        
    } catch (error) {
        console.error(`Error downloading ${type} image:`, error);
        
        // Update state
        const errorMessage = `Failed to download ${type} outlook. Please try again.`;
        state.downloads[type] = { loading: false, success: false, error: errorMessage };
        updateDownloadButton(type, false);
        showStatus(type, 'error', errorMessage);
    }
};

// Theme and Accessibility
const initializeAccessibility = () => {
    // Add keyboard navigation for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const button = card.querySelector('.download-btn');
                if (button && !button.disabled) {
                    button.click();
                }
            }
        });
    });
    
    // Add focus management
    const buttons = document.querySelectorAll('.download-btn');
    buttons.forEach(button => {
        button.addEventListener('focus', () => {
            button.parentElement.classList.add('focused');
        });
        button.addEventListener('blur', () => {
            button.parentElement.classList.remove('focused');
        });
    });
};

const initializeResponsive = () => {
    // Handle window resize for optimal layout
    const handleResize = debounce(() => {
        // Recalculate any dynamic layouts if needed
        console.log('Window resized to:', window.innerWidth, 'x', window.innerHeight);
    }, 250);
    
    window.addEventListener('resize', handleResize);
};

// Initialization Functions
const updateDateTime = () => {
    const now = new Date();
    const formattedDate = formatDate(now);
    
    state.currentDate = formattedDate;
    elements.currentDate.textContent = formattedDate;
    
    console.log('Date updated:', formattedDate);
};

const initializeImages = async () => {
    console.log('Loading image previews...');
    
    // Load all images concurrently
    await Promise.all([
        loadImagePreview('storm'),
        loadImagePreview('northeast'),
        loadImagePreview('southeast'),
        loadImagePreview('plains'),
        loadImagePreview('wind')
    ]);
    
    console.log('Image previews loaded');
};

const initialize = async () => {
    try {
        console.log('Initializing Weather Outlook Downloader...');
        
        // Update date and time
        updateDateTime();
        
        // Initialize accessibility features
        initializeAccessibility();
        
        // Initialize responsive features
        initializeResponsive();
        
        // Load image previews
        await initializeImages();
        
        // Set up periodic updates (every hour)
        setInterval(() => {
            updateDateTime();
            initializeImages();
        }, 3600000); // 1 hour
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        
        // Show error message to user
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; color: white; font-family: system-ui;">
                <div>
                    <h1>Application Error</h1>
                    <p>Failed to initialize the weather outlook downloader.</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
};

// Global Functions (called from HTML)
window.downloadImage = downloadImage;

// Error Handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}