let products = [];
let settings = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);

// Check login status and account type
const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
const accountType = sessionStorage.getItem('accountType') || 'retail';

const STORE_HOURS = {
    monday: { open: "10:00", close: "20:00", closed: false },
    tuesday: { open: "10:00", close: "20:00", closed: false },
    wednesday: { open: "10:00", close: "20:00", closed: false },
    thursday: { open: "10:00", close: "20:00", closed: false },
    friday: { open: "10:00", close: "21:00", closed: false },
    saturday: { open: "10:00", close: "21:00", closed: false },
    sunday: { open: "11:00", close: "18:00", closed: false }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    loadProducts();
    updateUserInfo();
    updateCartCount();
    initDropdown(); // Initialize dropdown immediately
    
    // Add demo button
    addDemoButton();
});

function loadProducts() {
    console.log('Starting to load products...');
    fetch("web.json")
        .then(response => {
            console.log('Fetch response received:', response.status);
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Data loaded successfully:', data);
            const jsonData = data[0];
            products = jsonData.products || [];
            settings = jsonData.settings || {};
            console.log('Number of products loaded:', products.length);
            displayProductsByCategory();
            updateCartCount();
            updateUserInfo();
            setupSearch();
            createStoreClock();
            
            setInterval(updateClock, 1000);
            showFreeShippingPromotion();
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            showNotification('Error loading products. Please refresh the page.', 'error');
            products = [];
            settings = {};
            displayProductsByCategory();
        });
}

// FIXED DROPDOWN SOLUTION - COMPLETELY REWRITTEN
function initDropdown() {
    console.log('Initializing dropdown...');
    
    const dropdownToggle = document.getElementById('user-dropdown-toggle');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    if (!dropdownToggle || !dropdownMenu) {
        console.log('Dropdown elements not found yet, will retry after user info update');
        return;
    }
    
    console.log('Dropdown elements found:', { dropdownToggle, dropdownMenu });
    
    // Remove any existing event listeners
    const newToggle = dropdownToggle.cloneNode(true);
    dropdownToggle.parentNode.replaceChild(newToggle, dropdownToggle);
    
    const newMenu = dropdownMenu.cloneNode(true);
    dropdownMenu.parentNode.replaceChild(newMenu, dropdownMenu);
    
    // Get fresh references
    const freshToggle = document.getElementById('user-dropdown-toggle');
    const freshMenu = document.getElementById('user-dropdown-menu');
    
    // Toggle dropdown on click
    freshToggle.addEventListener('click', function(e) {
        console.log('Dropdown toggle clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const isShowing = freshMenu.classList.contains('show');
        console.log('Current state:', isShowing ? 'showing' : 'hidden');
        
        // Close all other dropdowns first
        document.querySelectorAll('.user-dropdown-menu.show').forEach(menu => {
            if (menu !== freshMenu) {
                menu.classList.remove('show');
            }
        });
        
        // Toggle current dropdown
        freshMenu.classList.toggle('show');
        console.log('New state:', freshMenu.classList.contains('show') ? 'showing' : 'hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!freshToggle.contains(e.target) && !freshMenu.contains(e.target)) {
            freshMenu.classList.remove('show');
        }
    });
    
    // Close dropdown when clicking on menu items (except logout which has its own handler)
    const dropdownItems = freshMenu.querySelectorAll('.user-dropdown-item:not(#dropdown-logout-btn)');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            console.log('Dropdown item clicked:', item.textContent);
            freshMenu.classList.remove('show');
        });
    });
    
    // Setup logout functionality
    const logoutBtn = document.getElementById('dropdown-logout-btn');
    if (logoutBtn) {
        // Remove existing event listeners
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        const freshLogoutBtn = document.getElementById('dropdown-logout-btn');
        
        freshLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout button clicked');
            
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                localStorage.removeItem('cart');
                window.location.href = 'index.html';
            }
            
            freshMenu.classList.remove('show');
        });
    }
    
    // Prevent dropdown from closing when clicking inside it
    freshMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    console.log('Dropdown initialization complete');
}

// Update user info
function updateUserInfo() {
    console.log('Updating user info, logged in:', isLoggedIn);
    
    const userDropdown = document.getElementById('user-dropdown');
    const loginSection = document.getElementById('login-section');
    const usernameDisplays = document.querySelectorAll('#dropdown-username');

    if (isLoggedIn) {
        // User is logged in - show dropdown
        if (userDropdown) {
            userDropdown.style.display = 'inline-block';
            console.log('User dropdown shown');
        }
        if (loginSection) {
            loginSection.style.display = 'none';
        }
        
        // Update username
        const username = sessionStorage.getItem('username') || 'User';
        usernameDisplays.forEach(display => {
            if (display) display.textContent = username;
        });

        // Re-initialize dropdown after showing it
        setTimeout(() => {
            initDropdown();
        }, 100);
        
    } else {
        // User is not logged in - show login button
        if (userDropdown) {
            userDropdown.style.display = 'none';
        }
        if (loginSection) {
            loginSection.style.display = 'inline-block';
        }
    }
}

// ... rest of your existing functions (getProductPrice, getMinimumOrderQuantity, etc.) remain the same ...

// Calculate dynamic price
function getProductPrice(product, accountType) {
    if (!product) return 0;
    
    if (product.pricing && product.pricing[accountType]) {
        return product.pricing[accountType];
    }
    
    if (product.pricing && product.pricing.retail) {
        return product.pricing.retail;
    }
    
    return product.price || 0;
}

function getMinimumOrderQuantity(product) {
    if (accountType !== 'wholesale') return 1;
    
    if (product.minimumOrderQuantity) {
        return product.minimumOrderQuantity;
    }
    
    if (product.category === "NUMBER BALLOONS") return 5;
    if (product.category === "18\" foil balloon") return 10;
    if (product.category === "LETTER BALLOONS") return 5;
    if (product.category === "34\" foil balloon") return 50;
    if (product.category === "12\" latex balloon") return 1;
    
    return settings.wholesaleSettings?.defaultMinimumOrder || 5;
}

function getListingImage(product) {
    try {
        if (product?.imageMap) {
            const color = Object.keys(product.imageMap)[0] || 'default';
            const defaultNumber = product.options?.numbers?.[0] || product.options?.number?.[0] || "0";
            if (product.imageMap[color]?.[defaultNumber]) {
                return product.imageMap[color][defaultNumber];
            }
        }
        return product?.image || 'img/default-balloon.jpg';
    } catch (e) {
        console.error("Error getting product image:", e);
        return 'img/default-balloon.jpg';
    }
}

function handleImageError(img) {
    img.src = 'img/default-balloon.jpg';
    img.alt = 'Default balloon image';
    img.onerror = null;
}

function updateCartCount() {
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(el => {
            const oldCount = parseInt(el.textContent) || 0;
            el.textContent = cartCount || 0;
            
            if (cartCount > oldCount) {
                el.classList.add('pulse');
                setTimeout(() => el.classList.remove('pulse'), 600);
            }
        });
    } catch (e) {
        console.error("Error updating cart count:", e);
    }
}

function setupSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                if (searchTerm === '') {
                    displayProductsByCategory();
                    return;
                }
                
                const filteredProducts = products.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                    product.category.toLowerCase().includes(searchTerm)
                );
                displayProductsByCategory(filteredProducts);
            }, 300);
        });
    }
}

function displayProductsByCategory(productsToShow = products) {
    try {
        const categorySections = document.getElementById('category-sections');
        if (!categorySections) return;
        categorySections.innerHTML = '';

        if (!productsToShow || productsToShow.length === 0) {
            categorySections.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No products found</h3>
                    <p>Try a different search term or check back later.</p>
                </div>
            `;
            return;
        }

        const productsByCategory = {};
        (productsToShow || []).forEach(product => {
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });

        for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
            const section = document.createElement('section');
            section.classList.add('category-section');

            const heading = document.createElement('h2');
            heading.classList.add('category-heading');
            heading.textContent = category;
            section.appendChild(heading);

            const productContainer = document.createElement('div');
            productContainer.classList.add('product-container');

            categoryProducts.forEach(product => {
                const displayPrice = getProductPrice(product, accountType);
                const minOrder = getMinimumOrderQuantity(product);
                const buttonText = accountType === 'wholesale' ? 
                    `Add ${minOrder} to Cart` : 'Add to Cart';

                const productCard = document.createElement("div");
                productCard.classList.add("card");
                productCard.style.cursor = 'pointer';
                productCard.addEventListener('click', () => showProductDetails(product.id));

                productCard.innerHTML = `
                    <img src="${getListingImage(product)}" alt="${product.name}" class="card-img" 
                         onerror="handleImageError(this)" loading="lazy">
                    <div class="card-info">
                        <h3 class="text-title">${product.name}</h3>
                        <p class="text-body">${product.description || ''}</p>
                        ${accountType === 'wholesale' ? 
                            `<p class="min-order-notice">
                                <i class="fas fa-box"></i> Minimum Order: ${minOrder} units
                            </p>` : ''
                        }
                        <p class="text-price">$${displayPrice.toFixed(2)} ${accountType === 'wholesale' ? '/unit' : ''}</p>
                        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id}, this)">
                            <span class="button-text">${buttonText}</span>
                        </button>
                    </div>
                `;
                productContainer.appendChild(productCard);
            });

            section.appendChild(productContainer);
            categorySections.appendChild(section);
        }
    } catch (error) {
        console.error('Error displaying products by category:', error);
        showNotification('Error displaying products', 'error');
    }
}

function showProductDetails(productId) {
    try {
        const product = products.find(p => p.id === productId);
        if (product) {
            sessionStorage.setItem('currentProduct', JSON.stringify(product));
            window.location.href = 'product-details.html';
        } else {
            showNotification('Product not found', 'error');
        }
    } catch (error) {
        console.error('Error showing product details:', error);
        showNotification('Error loading product details', 'error');
    }
}

function addToCart(productId, button) {
    try {
        const product = products.find(p => p.id === productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        if (product.options && Object.keys(product.options).length > 0) {
            showProductDetails(productId);
            return;
        }

        const minOrder = getMinimumOrderQuantity(product);
        const quantityToAdd = accountType === 'wholesale' ? minOrder : 1;

        if (accountType === 'wholesale' && quantityToAdd < minOrder) {
            showNotification(`Minimum order for ${product.name} is ${minOrder} units`, 'error');
            return;
        }

        const existingItemIndex = cart.findIndex(item => 
            item.id === productId && 
            JSON.stringify(item.selectedOptions) === JSON.stringify(null)
        );

        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += quantityToAdd;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: getProductPrice(product, accountType),
                quantity: quantityToAdd,
                image: getListingImage(product),
                category: product.category,
                selectedOptions: null,
                minOrder: accountType === 'wholesale' ? minOrder : 1
            });
        }

        cartCount += quantityToAdd;
        updateCartCount();
        localStorage.setItem('cart', JSON.stringify(cart));

        if (button) {
            const buttonText = button.querySelector('.button-text');
            const originalText = buttonText.textContent;
            
            button.classList.add('added');
            buttonText.textContent = accountType === 'wholesale' ? `Added ${minOrder}!` : 'Added!';
            button.disabled = true;

            setTimeout(() => {
                button.classList.remove('added');
                buttonText.textContent = originalText;
                button.disabled = false;
            }, 1500);
        }

        showNotification(`${quantityToAdd} ${product.name} added to cart`, 'success');
        showFreeShippingPromotion();
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding item to cart', 'error');
    }
}

function showNotification(message, type) {
    try {
        const existingNotification = document.querySelector('.cart-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Store hours functions
function isStoreOpen() {
    try {
        const now = new Date();
        const day = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5);
        
        const todayHours = STORE_HOURS[day];
        
        if (!todayHours || todayHours.closed) {
            return false;
        }
        
        return currentTime >= todayHours.open && currentTime <= todayHours.close;
    } catch (error) {
        console.error('Error checking store hours:', error);
        return false;
    }
}

function createStoreClock() {
    try {
        if (document.getElementById('store-clock')) return;
        
        const storeStatus = getStoreStatus();
        const clockHTML = `
            <div class="store-clock ${storeStatus.status}" id="store-clock">
                <div class="clock-time" id="current-time">${getCurrentTime()}</div>
                <div class="clock-status ${storeStatus.status}">
                    <span class="clock-icon">${storeStatus.icon}</span>
                    <span id="store-status">${storeStatus.message}</span>
                </div>
            </div>
        `;
        
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const searchGroup = headerActions.querySelector('.search-group');
            if (searchGroup) {
                searchGroup.insertAdjacentHTML('afterend', clockHTML);
            }
        }
    } catch (error) {
        console.error('Error creating store clock:', error);
    }
}

function getStoreStatus() {
    try {
        const now = new Date();
        const day = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5);
        
        const todayHours = STORE_HOURS[day];
        
        if (isStoreOpen()) {
            const closeTime = todayHours.close;
            const pickupDeadline = new Date(`${new Date().toDateString()} ${closeTime}`);
            pickupDeadline.setMinutes(pickupDeadline.getMinutes() - 30);
            
            return {
                status: 'open',
                message: `Open • Pickup until ${formatTime(pickupDeadline.toTimeString().slice(0, 5))}`,
                icon: '🎈'
            };
        } else {
            const nextOpen = getNextOpenDay();
            if (nextOpen) {
                const nextDate = nextOpen.date.toLocaleDateString('en-US', { weekday: 'short' });
                const nextOpenTime = nextOpen.hours.open;
                return {
                    status: 'closed',
                    message: `Closed • Opens ${nextDate} ${formatTime(nextOpenTime)}`,
                    icon: '💤'
                };
            }
            return {
                status: 'closed',
                message: 'Closed',
                icon: '💤'
            };
        }
    } catch (error) {
        console.error('Error getting store status:', error);
        return {
            status: 'closed',
            message: 'Status unavailable',
            icon: '❓'
        };
    }
}

function getNextOpenDay() {
    try {
        const now = new Date();
        let nextDay = new Date(now);
        
        for (let i = 1; i <= 7; i++) {
            nextDay.setDate(now.getDate() + i);
            const day = nextDay.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const dayHours = STORE_HOURS[day];
            
            if (dayHours && !dayHours.closed) {
                return {
                    date: new Date(nextDay),
                    day: day,
                    hours: dayHours
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting next open day:', error);
        return null;
    }
}

function formatTime(timeString) {
    if (!timeString) return "N/A";
    if (timeString === "00:00") return "12:00 AM";
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
    }
}

function getCurrentTime() {
    try {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    } catch (error) {
        console.error('Error getting current time:', error);
        return '--:--';
    }
}

function updateClock() {
    try {
        const timeElement = document.getElementById('current-time');
        const statusElement = document.getElementById('store-status');
        const clockElement = document.getElementById('store-clock');
        const clockIcon = clockElement?.querySelector('.clock-icon');
        
        if (timeElement) {
            timeElement.textContent = getCurrentTime();
        }
        
        if (statusElement && clockElement && clockIcon) {
            const storeStatus = getStoreStatus();
            statusElement.textContent = storeStatus.message;
            
            clockElement.className = `store-clock ${storeStatus.status}`;
            const statusDiv = clockElement.querySelector('.clock-status');
            if (statusDiv) {
                statusDiv.className = `clock-status ${storeStatus.status}`;
            }
            
            clockIcon.textContent = storeStatus.status === 'open' ? '🎈' : '💤';
        }
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

function showFreeShippingPromotion() {
    try {
        if (accountType === 'wholesale') {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const subtotal = cart.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            
            const freeShippingThreshold = settings.wholesaleSettings?.freeShippingThreshold || 300;
            
            if (subtotal > 0 && subtotal < freeShippingThreshold) {
                const amountNeeded = (freeShippingThreshold - subtotal).toFixed(2);
                setTimeout(() => {
                    const existingPromo = document.querySelector('.free-shipping-promotion');
                    if (existingPromo) existingPromo.remove();
                    
                    const notification = document.createElement('div');
                    notification.className = 'free-shipping-promotion';
                    notification.innerHTML = `
                        <div class="promotion-content">
                            <p><i class="fas fa-shipping-fast"></i> <strong>Free Shipping Alert!</strong></p>
                            <p>Add $${amountNeeded} more to your cart to get FREE shipping!</p>
                        </div>
                    `;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 8000);
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error showing free shipping promotion:', error);
    }
}

// Add this function to web.js
function setupStoreClockTooltip() {
    const storeClock = document.getElementById('store-clock');
    if (!storeClock) return;

    // Remove the CSS hover tooltip on mobile
    if (window.innerWidth <= 768) {
        // Create a click-based tooltip for mobile
        storeClock.style.cursor = 'pointer';
        
        storeClock.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Remove any existing tooltip
            const existingTooltip = document.querySelector('.mobile-clock-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
                return;
            }
            
            // Create mobile tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'mobile-clock-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <h4>🏪 Store Hours</h4>
                    <p>Mon-Thu: 10AM-8PM</p>
                    <p>Fri-Sat: 10AM-9PM</p>
                    <p>Sun: 11AM-6PM</p>
                    <button class="close-tooltip">OK</button>
                </div>
            `;
            
            document.body.appendChild(tooltip);
            
            // Close tooltip when clicking OK or outside
            const closeBtn = tooltip.querySelector('.close-tooltip');
            closeBtn.addEventListener('click', function() {
                tooltip.remove();
            });
            
            tooltip.addEventListener('click', function(e) {
                if (e.target === tooltip) {
                    tooltip.remove();
                }
            });
        });
        
        // Add CSS for mobile tooltip
        const style = document.createElement('style');
        style.textContent = `
            .mobile-clock-tooltip {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .mobile-clock-tooltip .tooltip-content {
                background: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                max-width: 280px;
                margin: 20px;
            }
            .mobile-clock-tooltip h4 {
                margin: 0 0 15px 0;
                color: #2d3748;
            }
            .mobile-clock-tooltip p {
                margin: 8px 0;
                color: #4a5568;
            }
            .close-tooltip {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                margin-top: 15px;
                cursor: pointer;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
}

// Call this function after creating the store clock
function createStoreClock() {
    try {
        if (document.getElementById('store-clock')) return;
        
        const storeStatus = getStoreStatus();
        const clockHTML = `
            <div class="store-clock ${storeStatus.status}" id="store-clock">
                <div class="clock-time" id="current-time">${getCurrentTime()}</div>
                <div class="clock-status ${storeStatus.status}">
                    <span class="clock-icon">${storeStatus.icon}</span>
                    <span id="store-status">${storeStatus.message}</span>
                </div>
            </div>
        `;
        
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const searchGroup = headerActions.querySelector('.search-group');
            if (searchGroup) {
                searchGroup.insertAdjacentHTML('afterend', clockHTML);
                // Setup mobile tooltip after creating clock
                setTimeout(setupStoreClockTooltip, 100);
            }
        }
    } catch (error) {
        console.error('Error creating store clock:', error);
    }
}
// Add this function to highlight current page in dropdown
function setActiveDropdownItem() {
    const currentPage = window.location.pathname.split('/').pop();
    const dropdownItems = document.querySelectorAll('.user-dropdown-item[href]');
    
    dropdownItems.forEach(item => {
        const itemPage = item.getAttribute('href');
        if (itemPage === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Call this function after DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    setActiveDropdownItem();
});
// In web.js - Update the updateUserInfo function
function updateUserInfo() {
    const userDropdown = document.getElementById('user-dropdown');
    const loginSection = document.getElementById('login-section');
    const usernameDisplays = document.querySelectorAll('#dropdown-username');
    const catalogButtons = document.querySelectorAll('.catalog-btn, .catalog-menu-item');
    const adminButtons = document.querySelectorAll('.admin-menu-item');

    if (isLoggedIn) {
        if (userDropdown) userDropdown.style.display = 'inline-block';
        if (loginSection) loginSection.style.display = 'none';
        
        const username = sessionStorage.getItem('username') || 'User';
        usernameDisplays.forEach(display => {
            if (display) display.textContent = username;
        });

        // Show/hide catalog based on account type
        if (accountType === 'wholesale') {
            catalogButtons.forEach(button => {
                if (button) button.style.display = 'flex';
            });
        } else {
            catalogButtons.forEach(button => {
                if (button) button.style.display = 'none';
            });
        }

        // Show/hide admin dashboard based on account type
        if (accountType === 'admin') {
            adminButtons.forEach(button => {
                if (button) button.style.display = 'flex';
            });
        } else {
            adminButtons.forEach(button => {
                if (button) button.style.display = 'none';
            });
        }

        setTimeout(() => {
            initDropdown();
        }, 100);
        
    } else {
        if (userDropdown) userDropdown.style.display = 'none';
        if (loginSection) loginSection.style.display = 'inline-block';
        
        catalogButtons.forEach(button => {
            if (button) button.style.display = 'none';
        });
        adminButtons.forEach(button => {
            if (button) button.style.display = 'none';
        });
    }
}
// Add this function to filter products based on account type
function filterProductsForAccount(products) {
    const accountType = sessionStorage.getItem('accountType') || 'retail';
    
    if (accountType === 'retail') {
        return products.filter(product => product.showInRetail !== false);
    }
    
    return products; // Show all products for wholesale
}

// Update the getProductPrice function to handle inflation
function getProductPrice(product, accountType, isInflated = false) {
    if (!product) return 0;
    
    if (accountType === 'wholesale') {
        if (product.pricing && product.pricing.wholesale) {
            return product.pricing.wholesale;
        }
        return product.price || 0;
    }
    
    // Retail pricing with inflation option
    if (product.pricing && product.pricing.retail) {
        if (typeof product.pricing.retail === 'object') {
            // New structure with inflation options
            return isInflated ? 
                (product.pricing.retail.inflated || product.pricing.retail.uninflated + (settings.inflationFee || 5)) : 
                product.pricing.retail.uninflated;
        } else {
            // Old structure (backward compatibility)
            return product.pricing.retail;
        }
    }
    
    return product.price || 0;
}

// Update the displayProductsByCategory function
function displayProductsByCategory(productsToShow = products) {
    try {
        const categorySections = document.getElementById('category-sections');
        if (!categorySections) return;
        categorySections.innerHTML = '';

        // Filter products based on account type
        const filteredProducts = filterProductsForAccount(productsToShow);
        
        if (!filteredProducts || filteredProducts.length === 0) {
            categorySections.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No products found</h3>
                    <p>Try a different search term or check back later.</p>
                </div>
            `;
            return;
        }

        const productsByCategory = {};
        filteredProducts.forEach(product => {
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });

        for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
            const section = document.createElement('section');
            section.classList.add('category-section');

            const heading = document.createElement('h2');
            heading.classList.add('category-heading');
            heading.textContent = category;
            section.appendChild(heading);

            const productContainer = document.createElement('div');
            productContainer.classList.add('product-container');

            categoryProducts.forEach(product => {
                const accountType = sessionStorage.getItem('accountType') || 'retail';
                const displayPrice = getProductPrice(product, accountType, false); // Default to uninflated
                const minOrder = getMinimumOrderQuantity(product);
                const buttonText = accountType === 'wholesale' ? 
                    `Add ${minOrder} to Cart` : 'Add to Cart';

                const productCard = document.createElement("div");
                productCard.classList.add("card");
                productCard.style.cursor = 'pointer';
                productCard.addEventListener('click', () => showProductDetails(product.id));

                // Price display for retail with inflation info
                let priceDisplay = '';
                if (accountType === 'retail' && product.pricing && typeof product.pricing.retail === 'object') {
                    const uninflatedPrice = product.pricing.retail.uninflated;
                    const inflatedPrice = product.pricing.retail.inflated || uninflatedPrice + (settings.inflationFee || 5);
                    priceDisplay = `
                        <p class="text-price">
                            $${uninflatedPrice.toFixed(2)} (Uninflated)<br>
                            <small style="font-size: 0.9em;">or $${inflatedPrice.toFixed(2)} (Inflated)</small>
                        </p>
                    `;
                } else {
                    priceDisplay = `<p class="text-price">$${displayPrice.toFixed(2)} ${accountType === 'wholesale' ? '/unit' : ''}</p>`;
                }



                productCard.innerHTML = `
                    <img src="${getListingImage(product)}" alt="${product.name}" class="card-img" 
                         onerror="handleImageError(this)" loading="lazy">
                    <div class="card-info">
                        <h3 class="text-title">${product.name}</h3>
                        <p class="text-body">${product.description || ''}</p>
                        ${accountType === 'wholesale' ? 
                            `<p class="min-order-notice">
                                <i class="fas fa-box"></i> Minimum Order: ${minOrder} units
                            </p>` : ''
                        }
                        ${priceDisplay}
                        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id}, this)">
                            <span class="button-text">${buttonText}</span>
                        </button>
                    </div>
                `;
                productContainer.appendChild(productCard);
            });

            section.appendChild(productContainer);
            categorySections.appendChild(section);
        }
    } catch (error) {
        console.error('Error displaying products by category:', error);
        showNotification('Error displaying products', 'error');
    }
}
// In product-details.js addToCartHandler function, add:
function addToCartHandler() {
    const minOrder = getMinimumOrderQuantity(product);
    const quantityInput = document.getElementById('quantity');
    let quantity = parseInt(quantityInput?.value) || minOrder;
    
    // Get inflation option for retail
    let inflationOption = null;
    if (accountType === 'retail') {
        const inflationSelect = document.getElementById('inflation-select');
        inflationOption = inflationSelect ? inflationSelect.value : 'uninflated';
    }
    
    // ... rest of the function remains the same, but include inflationOption in the cart item
    
    // In the cart.push section, add:
    cart.push({
        ...product,
        price: currentPrice,
        selectedOptions: product.options ? selectedOptions : null,
        quantity: quantity,
        image: document.getElementById('product-main-image').src,
        minOrder: accountType === 'wholesale' ? minOrder : 1,
        inflationOption: inflationOption // Add this line
    });
    
    // ... rest of function
}