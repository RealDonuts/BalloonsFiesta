// catalog.js - Complete version with wholesale access control (retail price removed)
let allProducts = [];
let filteredProducts = [];
let currentSort = 'name';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Catalog page loaded');
    
    // Check if user has wholesale access
    if (!hasWholesaleAccess()) {
        showWholesaleAccessMessage();
        return; // Stop execution for non-wholesale users
    }
    
    // Continue with normal initialization for wholesale users
    updateCartCount();
    updateUserInfo();
    createStoreClock();
    initDropdown();
    setInterval(updateClock, 1000);
    loadCatalogProducts();
    setupCatalogSearch();
    setupCatalogFilters();
    showCatalogContent();
});

// Check if user has wholesale access
function hasWholesaleAccess() {
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    const accountType = sessionStorage.getItem('accountType') || 'retail';
    
    console.log('Access check - Logged in:', isLoggedIn, 'Account type:', accountType);
    return isLoggedIn && accountType === 'wholesale';
}

// Show wholesale access required message
function showWholesaleAccessMessage() {
    const accessMessage = document.getElementById('wholesale-access-message');
    const catalogContent = document.getElementById('catalog-content');
    
    if (accessMessage) accessMessage.style.display = 'block';
    if (catalogContent) catalogContent.style.display = 'none';
    
    // Still update header info
    updateCartCount();
    updateUserInfo();
    createStoreClock();
    initDropdown();
    setInterval(updateClock, 1000);
}

// Show catalog content for wholesale users
function showCatalogContent() {
    const accessMessage = document.getElementById('wholesale-access-message');
    const catalogContent = document.getElementById('catalog-content');
    
    if (accessMessage) accessMessage.style.display = 'none';
    if (catalogContent) catalogContent.style.display = 'block';
}

// Load products from web.json
function loadCatalogProducts() {
    console.log('Loading catalog products...');
    fetch("web.json")
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            console.log('Products data loaded:', data);
            const jsonData = data[0];
            allProducts = jsonData.products || [];
            filteredProducts = [...allProducts];
            console.log(`Loaded ${allProducts.length} products`);
            displayCatalogProducts();
            updateProductCount();
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            showNotification('Error loading catalog. Please refresh the page.', 'error');
            allProducts = [];
            filteredProducts = [];
            displayCatalogProducts();
        });
}

// Display products in catalog
function displayCatalogProducts() {
    const catalogGrid = document.getElementById('catalog-grid');
    console.log('Displaying products:', filteredProducts);
    
    if (!filteredProducts || filteredProducts.length === 0) {
        catalogGrid.innerHTML = `
            <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #667eea; margin-bottom: 20px;"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }

    catalogGrid.innerHTML = '';

    filteredProducts.forEach(product => {
        console.log('Processing product:', product);
        const wholesalePrice = getProductPrice(product, 'wholesale');
        const minOrder = getMinimumOrderQuantity(product);

        const productCard = document.createElement("div");
        productCard.classList.add("catalog-product-card");
        
        productCard.innerHTML = `
            <div class="catalog-product-image">
                <img src="${getListingImage(product)}" alt="${product.name}" 
                     onerror="handleCatalogImageError(this)" loading="lazy">
            </div>
            <div class="catalog-product-info">
                <h3 class="catalog-product-title">${product.name}</h3>
                <p class="catalog-product-category">${product.category}</p>
                <p class="catalog-product-description">${product.description || 'Premium quality balloon'}</p>
                
                <div class="catalog-pricing">
                    <div class="wholesale-price">$${wholesalePrice.toFixed(2)} per unit</div>
                </div>
                
                ${product.details ? `
                <div class="catalog-product-details">
                    ${Object.entries(product.details).map(([key, value]) => 
                        `<div class="detail-item"><strong>${key}:</strong> ${value}</div>`
                    ).join('')}
                </div>
                ` : ''}
                
                ${product.options && Object.keys(product.options).length > 0 ? `
                <div class="catalog-product-options">
                    <div class="options-label">Available Options:</div>
                    ${Object.entries(product.options).map(([key, values]) => 
                        `<div class="option-item"><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</div>`
                    ).join('')}
                </div>
                ` : ''}
                
                <div class="catalog-min-order">
                    <i class="fas fa-box"></i>
                    Minimum Order: ${minOrder} units
                </div>
                
                <div class="catalog-product-actions">
                    <button class="view-in-shop-btn" onclick="viewInShop(${product.id})">
                        <i class="fas fa-shopping-cart"></i>
                        View in Shop
                    </button>
                    <button class="quick-add-btn" onclick="quickAddToCart(${product.id})">
                        <i class="fas fa-plus"></i>
                        Quick Add ${minOrder}
                    </button>
                </div>
            </div>
        `;
        
        catalogGrid.appendChild(productCard);
    });
}

// Filter products by category
function setupCatalogFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    console.log('Setting up filters:', filterButtons.length);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.dataset.category;
            console.log('Filtering by category:', category);
            filterProductsByCategory(category);
        });
    });
}

function filterProductsByCategory(category) {
    if (category === 'all') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => {
            // Handle the escaped quote in category name
            const productCategory = product.category ? product.category.replace(/\\/g, '') : '';
            const filterCategory = category.replace(/\\/g, '');
            return productCategory === filterCategory;
        });
    }
    
    sortProducts();
    displayCatalogProducts();
    updateProductCount();
}

// Sort products
function sortProducts() {
    const sortSelect = document.getElementById('sort-select');
    currentSort = sortSelect ? sortSelect.value : 'name';
    console.log('Sorting by:', currentSort);
    
    filteredProducts.sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'price':
                return getProductPrice(a, 'wholesale') - getProductPrice(b, 'wholesale');
            case 'price-desc':
                return getProductPrice(b, 'wholesale') - getProductPrice(a, 'wholesale');
            case 'category':
                return (a.category || '').localeCompare(b.category || '');
            default:
                return 0;
        }
    });
    
    displayCatalogProducts();
}

// Search functionality
function setupCatalogSearch() {
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                console.log('Searching for:', searchTerm);
                if (searchTerm === '') {
                    filteredProducts = [...allProducts];
                } else {
                    filteredProducts = allProducts.filter(product =>
                        product.name.toLowerCase().includes(searchTerm) ||
                        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                        (product.category && product.category.toLowerCase().includes(searchTerm))
                    );
                }
                sortProducts();
                displayCatalogProducts();
                updateProductCount();
            }, 300);
        });
    }
}

// Update product count
function updateProductCount() {
    const countElement = document.getElementById('product-count');
    if (countElement) {
        countElement.textContent = `Showing ${filteredProducts.length} of ${allProducts.length} products`;
    }
}

// View product in shop
function viewInShop(productId) {
    sessionStorage.setItem('highlightProduct', productId);
    window.location.href = 'web.html';
}

// Quick add to cart
function quickAddToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }

    const minOrder = getMinimumOrderQuantity(product);
    const quantityToAdd = minOrder;

    // Add to cart logic
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = cart.findIndex(item => 
        item.id === productId
    );

    if (existingItemIndex !== -1) {
        cart[existingItemIndex].quantity += quantityToAdd;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: getProductPrice(product, 'wholesale'),
            quantity: quantityToAdd,
            image: getListingImage(product),
            category: product.category,
            selectedOptions: null,
            minOrder: minOrder
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${quantityToAdd} ${product.name} added to cart`, 'success');
}

// Download catalog as PDF
function downloadCatalogPDF() {
    showNotification('Generating PDF catalog...', 'success');
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(102, 126, 234);
        doc.text('Balloons Fiesta - Wholesale Product Catalog', 20, 20);
        
        // Add date and info
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Total Products: ${filteredProducts.length}`, 20, 37);
        doc.text(`Account: ${sessionStorage.getItem('username') || 'Wholesale Customer'}`, 20, 44);
        
        let yPosition = 60;
        let page = 1;
        
        // Add products to PDF
        filteredProducts.forEach((product, index) => {
            // Check if we need a new page
            if (yPosition > 250) {
                doc.addPage();
                page++;
                yPosition = 20;
                // Add header to new page
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Balloons Fiesta Wholesale Catalog - Page ${page}`, 20, 10);
            }
            
            // Product name
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 128);
            doc.text(product.name, 20, yPosition);
            
            // Category and description
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Category: ${product.category}`, 20, yPosition + 7);
            
            // Wrap description text
            const description = product.description || 'Premium quality balloon';
            const splitDescription = doc.splitTextToSize(description, 170);
            doc.text(splitDescription, 20, yPosition + 14);
            
            // Wholesale pricing only
            doc.setTextColor(0, 0, 0);
            const wholesalePrice = getProductPrice(product, 'wholesale');
            const pricingHeight = 14 + (splitDescription.length * 5);
            doc.text(`Wholesale Price: $${wholesalePrice.toFixed(2)} per unit`, 20, yPosition + pricingHeight + 7);
            
            // Minimum order
            const minOrder = getMinimumOrderQuantity(product);
            doc.text(`Minimum Order: ${minOrder} units`, 20, yPosition + pricingHeight + 14);
            
            yPosition += pricingHeight + 30;
        });
        
        // Add footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Confidential - For wholesale customers only', 20, 280);
        doc.text('© ' + new Date().getFullYear() + ' Balloons Fiesta - All rights reserved', 120, 280);
        
        // Save the PDF
        doc.save(`BalloonsFiesta-Wholesale-Catalog-${new Date().toISOString().split('T')[0]}.pdf`);
        showNotification('PDF catalog downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    }
}

// ========== HELPER FUNCTIONS ==========

function getProductPrice(product, accountType) {
    if (!product) return 0;
    
    if (product.pricing) {
        if (product.pricing[accountType] !== undefined) {
            return product.pricing[accountType];
        }
        if (product.pricing.retail !== undefined) {
            return product.pricing.retail;
        }
    }
    
    return product.price || 0;
}

function getMinimumOrderQuantity(product) {
    if (product.minimumOrderQuantity) {
        return product.minimumOrderQuantity;
    }
    
    if (product.category === "NUMBER BALLOONS") return 5;
    if (product.category === "18\" foil balloon") return 10;
    if (product.category === "Standard") return 50;
    if (product.category === "Clearance") return 1;
    
    return 5;
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

function handleCatalogImageError(img) {
    console.log('Image error, setting default:', img.src);
    img.src = 'img/default-balloon.jpg';
    img.alt = 'Default balloon image';
    img.onerror = null;
}

function showNotification(message, type) {
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
    }, 5000);
}

// ========== HEADER FUNCTIONS ==========

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(el => {
            el.textContent = cartCount || 0;
        });
    } catch (e) {
        console.error("Error updating cart count:", e);
    }
}

function updateUserInfo() {
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    const accountType = sessionStorage.getItem('accountType') || 'retail';
    const userDropdown = document.getElementById('user-dropdown');
    const loginSection = document.getElementById('login-section');
    const usernameDisplays = document.querySelectorAll('#dropdown-username');
    const catalogButtons = document.querySelectorAll('.catalog-menu-item');

    if (isLoggedIn) {
        if (userDropdown) userDropdown.style.display = 'inline-block';
        if (loginSection) loginSection.style.display = 'none';
        
        const username = sessionStorage.getItem('username') || 'User';
        usernameDisplays.forEach(display => {
            if (display) display.textContent = username;
        });

        // Show/hide catalog based on account type
        if (accountType === 'wholesale') {
            // Show catalog in dropdown
            catalogButtons.forEach(button => {
                if (button) button.style.display = 'flex';
            });
        } else {
            // Hide catalog from retail customers
            catalogButtons.forEach(button => {
                if (button) button.style.display = 'none';
            });
        }
    } else {
        if (userDropdown) userDropdown.style.display = 'none';
        if (loginSection) loginSection.style.display = 'inline-block';
        
        // Hide catalog when not logged in
        catalogButtons.forEach(button => {
            if (button) button.style.display = 'none';
        });
    }
}

function initDropdown() {
    const dropdownToggle = document.getElementById('user-dropdown-toggle');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    
    if (!dropdownToggle || !dropdownMenu) return;
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', function(e) {
        if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    const dropdownItems = dropdownMenu.querySelectorAll('.user-dropdown-item:not(#dropdown-logout-btn)');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
    });
    
    const logoutBtn = document.getElementById('dropdown-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.clear();
                localStorage.removeItem('cart');
                window.location.href = 'web.html';
            }
            dropdownMenu.classList.remove('show');
        });
    }
    
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Store clock functionality
const STORE_HOURS = {
    monday: { open: "10:00", close: "20:00", closed: false },
    tuesday: { open: "10:00", close: "20:00", closed: false },
    wednesday: { open: "10:00", close: "20:00", closed: false },
    thursday: { open: "10:00", close: "20:00", closed: false },
    friday: { open: "10:00", close: "21:00", closed: false },
    saturday: { open: "10:00", close: "21:00", closed: false },
    sunday: { open: "11:00", close: "18:00", closed: false }
};

function createStoreClock() {
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

// Export functions for global access
window.downloadCatalogPDF = downloadCatalogPDF;
window.sortProducts = sortProducts;
window.viewInShop = viewInShop;
window.quickAddToCart = quickAddToCart;
window.handleCatalogImageError = handleCatalogImageError;