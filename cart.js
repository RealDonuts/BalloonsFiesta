let cart = JSON.parse(localStorage.getItem('cart')) || [];
let settings = {};
const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
const accountType = sessionStorage.getItem('accountType') || 'retail';

// Only redirect to login if trying to access wholesale prices
if (accountType === 'wholesale' && !isLoggedIn) {
    window.location.href = 'login.html';
}

// DOM Elements
const cartItemsContainer = document.getElementById('cart-items');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const totalElement = document.getElementById('total');

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    fetchSettings();
    setupEventListeners();
    setupResponsiveHandlers();
    
    // Add elegant entrance animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Setup event listeners
function setupEventListeners() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
}

// Setup responsive handlers
function setupResponsiveHandlers() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCartDisplay();
        }, 250);
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(updateCartDisplay, 100);
    });
}

// Fetch settings for pricing
function fetchSettings() {
    fetch("web.json")
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const jsonData = data[0];
            settings = jsonData.settings || {};
            updateCartDisplay();
        })
        .catch(error => {
            console.error("Error fetching settings:", error);
            updateCartDisplay();
        });
}

// Helper function to get product price - UPDATED TO MATCH web.js
function getProductPrice(item) {
    if (!item) return 0;
    
    // Use the pricing structure from web.js
    if (item.pricing) {
        const accountType = sessionStorage.getItem('accountType') || 'retail';
        const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
        const currentAccountType = isLoggedIn ? accountType : 'retail';
        
        // Handle retail pricing with inflation
        if (currentAccountType === 'retail' && item.inflationOption) {
            if (typeof item.pricing.retail === 'object') {
                return item.inflationOption === 'inflated' ? 
                    (item.pricing.retail.inflated || item.pricing.retail.uninflated + 5) : 
                    item.pricing.retail.uninflated;
            }
        }
        
        // Handle wholesale pricing
        if (currentAccountType === 'wholesale' && item.pricing.wholesale) {
            return item.pricing.wholesale;
        }
        
        // Fallback to retail pricing
        if (item.pricing.retail) {
            if (typeof item.pricing.retail === 'object') {
                return item.pricing.retail.uninflated;
            }
            return item.pricing.retail;
        }
    }
    
    // Final fallback
    return item.price || item.basePrice || 0;
}

// Helper function to get product image - UPDATED TO MATCH web.js
function getProductImage(item) {
    try {
        // Use the same logic as web.js for consistency
        if (item.imageMap && item.selectedOptions) {
            const color = item.selectedOptions.color || Object.keys(item.imageMap)[0];
            const number = item.selectedOptions.number || "0";
            
            if (item.imageMap[color] && item.imageMap[color][number]) {
                return item.imageMap[color][number];
            }
        }
        return item.image || 'img/default-balloon.jpg';
    } catch (e) {
        console.error("Error getting product image:", e);
        return item.image || 'img/default-balloon.jpg';
    }
}

// Handle image errors - UPDATED TO MATCH web.js
function handleImageError(img) {
    img.src = 'img/default-balloon.jpg';
    img.alt = 'Default balloon image';
    img.onerror = null;
}

// Check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// Initialize cart display
function updateCartDisplay() {
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-elegant">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h3>Your Balloon Cart is Empty</h3>
                <p>Add some colorful balloons to make your celebration special</p>
                <a href="index.html" class="shop-now-btn">
                    <i class="fas fa-sparkles"></i>
                    Start Shopping
                </a>
            </div>
        `;
        updateTotals();
        return;
    }
    
    const isMobile = isMobileDevice();
    
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item-elegant');
        cartItem.dataset.itemIndex = index;
        
        // Get current price
        const itemPrice = getProductPrice(item);
        const itemTotal = itemPrice * item.quantity;
        
        // Display selected options if they exist
        let optionsText = '';
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
            optionsText = Object.entries(item.selectedOptions)
                .map(([key, value]) => `<span class="option-tag">${key}: ${value}</span>`)
                .join('');
        }
        
        // Show inflation option for retail
        let inflationText = '';
        if (accountType === 'retail' && item.inflationOption) {
            inflationText = `<span class="option-tag">${item.inflationOption === 'inflated' ? 'Inflated' : 'Uninflated'}</span>`;
        }
        
        // Show minimum order warning if below minimum for wholesale
        const minOrderWarning = accountType === 'wholesale' && item.minOrder && item.quantity < item.minOrder ? 
            `<div class="min-order-warning" style="color: #e74c3c; font-size: 0.8rem; margin-top: 5px;">
                <i class="fas fa-exclamation-triangle"></i> Minimum order: ${item.minOrder} units
            </div>` : '';
        
        if (isMobile) {
            // Mobile layout
            cartItem.innerHTML = `
                <div class="cart-item-mobile">
                    <div class="item-image-container">
                        <img src="${getProductImage(item)}" alt="${item.name}" onerror="handleImageError(this)">
                    </div>
                    <div class="item-details-mobile">
                        <div class="item-header">
                            <h4 class="item-title">${item.name}</h4>
                            <span class="item-price-mobile">$${itemPrice.toFixed(2)}</span>
                        </div>
                        ${optionsText ? `<div class="item-options">${optionsText}</div>` : ''}
                        ${inflationText ? `<div class="item-options">${inflationText}</div>` : ''}
                        ${minOrderWarning}
                        <div class="quantity-controls-mobile">
                            <button class="qty-btn qty-decrease" data-action="decrease">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="qty-display">${item.quantity}</span>
                            <button class="qty-btn qty-increase" data-action="increase">
                                <i class="fas fa-plus"></i>
                            </button>
                            <span class="item-total-mobile">$${itemTotal.toFixed(2)}</span>
                            <button class="remove-btn-elegant" title="Remove item">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Desktop layout
            cartItem.innerHTML = `
                <div class="cart-item-desktop">
                    <div class="item-image-container">
                        <img src="${getProductImage(item)}" alt="${item.name}" onerror="handleImageError(this)">
                    </div>
                    <div class="item-info">
                        <div class="item-main">
                            <h4 class="item-title">${item.name}</h4>
                            ${optionsText ? `<div class="item-options">${optionsText}</div>` : ''}
                            ${inflationText ? `<div class="item-options">${inflationText}</div>` : ''}
                            ${minOrderWarning}
                        </div>
                    </div>
                    <div class="item-price">
                        <span class="unit-price">$${itemPrice.toFixed(2)}</span>
                    </div>
                    <div class="quantity-controls">
                        <button class="qty-btn qty-decrease" data-action="decrease">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn qty-increase" data-action="increase">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-total">
                        <span class="total-price">$${itemTotal.toFixed(2)}</span>
                    </div>
                    <button class="remove-btn-elegant" title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        // Add event listeners
        const decreaseBtn = cartItem.querySelector('.qty-decrease');
        const increaseBtn = cartItem.querySelector('.qty-increase');
        const removeBtn = cartItem.querySelector('.remove-btn-elegant');
        
        decreaseBtn.addEventListener('click', () => handleQuantityChange(index, -1));
        increaseBtn.addEventListener('click', () => handleQuantityChange(index, 1));
        removeBtn.addEventListener('click', () => removeItem(index));
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    updateTotals();
}

// Handle quantity changes - ADD MINIMUM ORDER CHECK
function handleQuantityChange(index, change) {
    if (index < 0 || index >= cart.length) return;
    
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    // Check minimum order for wholesale items
    if (accountType === 'wholesale' && item.minOrder && newQuantity < item.minOrder) {
        showElegantNotification(`Minimum order for this item is ${item.minOrder} units`, 'warning');
        return;
    }
    
    if (newQuantity <= 0) {
        removeItem(index);
    } else {
        cart[index].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
        updateCartCount();
        showElegantNotification(`Quantity updated to ${newQuantity}`, 'success');
    }
}

function removeItem(index) {
    if (index < 0 || index >= cart.length) return;
    
    const removedItem = cart[index];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    showElegantNotification(`${removedItem.name} removed from cart`, 'success');
    updateCartDisplay();
    updateCartCount();
}

function checkout() {
    if (cart.length === 0) {
        showElegantNotification('Your cart is empty!', 'warning');
        return;
    }

    // Check if any wholesale items are below minimum order
    if (accountType === 'wholesale') {
        const itemsBelowMinimum = cart.filter(item => item.minOrder && item.quantity < item.minOrder);
        if (itemsBelowMinimum.length > 0) {
            showElegantNotification('Some items are below minimum order quantity. Please adjust quantities before checkout.', 'error');
            return;
        }
    }

    const userInfo = {
        username: sessionStorage.getItem('username'),
        email: sessionStorage.getItem('userEmail'),
        phone: sessionStorage.getItem('userPhone'),
        accountType: accountType
    };

    localStorage.setItem('checkoutPrefill', JSON.stringify(userInfo));
    localStorage.setItem('cart', JSON.stringify(cart));
    
    window.location.href = 'checkout.html';
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => {
        const itemPrice = getProductPrice(item);
        return sum + (itemPrice * item.quantity);
    }, 0);

    let shipping = 0;
    let total = subtotal;
    
    if (accountType === 'wholesale') {
        const freeShippingThreshold = settings.wholesaleSettings?.freeShippingThreshold || 300;
        shipping = subtotal >= freeShippingThreshold ? 0 : 4.99;
        total = subtotal + shipping;
    }
    
    // Update the order summary section
    updateOrderSummary(subtotal, shipping, total);
}

function updateOrderSummary(subtotal, shipping, total) {
    let orderSummary = document.querySelector('.order-summary');
    
    if (!orderSummary) {
        orderSummary = document.createElement('div');
        orderSummary.className = 'order-summary';
        document.querySelector('.master-container').appendChild(orderSummary);
    }
    
    const shippingText = accountType === 'wholesale' 
        ? (shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`)
        : 'Pickup';
    
    const freeShippingThreshold = settings.wholesaleSettings?.freeShippingThreshold || 300;
    
    orderSummary.innerHTML = `
        <div class="summary-header">
            <h3>Order Summary</h3>
        </div>
        <div class="summary-details">
            <div class="summary-row">
                <span>Subtotal (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>${accountType === 'wholesale' ? 'Shipping' : 'Delivery'}</span>
                <span class="${shipping === 0 ? 'free-shipping' : ''}">${shippingText}</span>
            </div>
            ${accountType === 'wholesale' && subtotal > 0 && subtotal < freeShippingThreshold ? `
                <div class="shipping-notice">
                    <i class="fas fa-truck"></i>
                    <span>Add $${(freeShippingThreshold - subtotal).toFixed(2)} for free shipping</span>
                </div>
            ` : ''}
            <div class="summary-total">
                <span>Total</span>
                <span class="total-amount">$${total.toFixed(2)}</span>
            </div>
        </div>
        <button class="checkout-btn ${cart.length === 0 ? 'disabled' : ''}">
            Proceed to Checkout
        </button>
    `;
    
    // Add event listener to checkout button
    const checkoutBtn = orderSummary.querySelector('.checkout-btn');
    if (checkoutBtn && !checkoutBtn.classList.contains('disabled')) {
        checkoutBtn.addEventListener('click', checkout);
    }
}

function updateCartCount() {
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Elegant notification system
function showElegantNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.elegant-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `elegant-notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-triangle',
        warning: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add('visible');
    }, 100);

    // Auto remove
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add this to your cart.js file to validate stock on page load
function validateCartStock() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = [];
    let hasChanges = false;

    cart.forEach(item => {
        // In a real application, you would fetch current stock from the server
        // For now, we'll use the stored stock or assume it's available
        if (item.stock !== undefined && item.quantity > item.stock) {
            showElegantNotification(`Reduced quantity of ${item.name} to available stock (${item.stock} units)`, 'warning');
            item.quantity = item.stock;
            hasChanges = true;
        }
        updatedCart.push(item);
    });

    if (hasChanges) {
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        updateCartDisplay();
    }
}

// Call this when the cart page loads
document.addEventListener('DOMContentLoaded', function() {
    validateCartStock();
});

// Add beautiful CSS styles
if (!document.querySelector('#elegant-cart-styles')) {
    const style = document.createElement('style');
    style.id = 'elegant-cart-styles';
    style.textContent = `
        /* Beautiful Cart Styles */
        :root {
            --primary: #667eea;
            --primary-dark: #5a6fd8;
            --secondary: #764ba2;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --background: #f8fafc;
            --surface: #ffffff;
            --text: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--background);
            color: var(--text);
            line-height: 1.6;
        }

        .master-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        /* Cart Items */
        .cart-item-elegant {
            background: var(--surface);
            border-radius: 12px;
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
            transition: all 0.3s ease;
        }

        .cart-item-desktop {
            display: grid;
            grid-template-columns: 80px 1fr auto auto auto auto;
            gap: 1rem;
            align-items: center;
            padding: 1.5rem;
        }

        .item-image-container img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 8px;
        }

        .item-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .item-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--text);
        }

        .item-options {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .option-tag {
            background: var(--gradient);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .min-order-warning {
            background: #fef3c7;
            color: #92400e;
            padding: 0.5rem;
            border-radius: 6px;
            border-left: 3px solid #f59e0b;
        }

        .item-price .unit-price {
            color: var(--primary);
            font-weight: 600;
            font-size: 0.9rem;
        }

        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8fafc;
            padding: 0.5rem;
            border-radius: 8px;
        }

        .qty-btn {
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            background: white;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .qty-btn:hover {
            background: var(--primary);
            color: white;
        }

        .qty-display {
            min-width: 30px;
            text-align: center;
            font-weight: 600;
        }

        .item-total .total-price {
            font-weight: 700;
            font-size: 1rem;
            color: var(--text);
        }

        .remove-btn-elegant {
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 8px;
            background: #fee2e2;
            color: #dc2626;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .remove-btn-elegant:hover {
            background: #dc2626;
            color: white;
        }

        /* Mobile Layout */
        .cart-item-mobile {
            padding: 1rem;
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }

        .cart-item-mobile .item-image-container img {
            width: 50px;
            height: 50px;
        }

        .item-details-mobile {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
        }

        .item-price-mobile {
            color: var(--primary);
            font-weight: 600;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .quantity-controls-mobile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: #f8fafc;
            padding: 0.5rem;
            border-radius: 8px;
            justify-content: space-between;
        }

        .item-total-mobile {
            font-weight: 700;
            color: var(--text);
            margin-left: auto;
        }

        /* Empty Cart */
        .empty-cart-elegant {
            text-align: center;
            padding: 3rem 1rem;
            background: var(--surface);
            border-radius: 16px;
            box-shadow: var(--shadow);
        }

        .empty-cart-icon {
            width: 80px;
            height: 80px;
            background: var(--gradient);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 2rem;
        }

        .empty-cart-elegant h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text);
        }

        .empty-cart-elegant p {
            color: var(--text-light);
            margin-bottom: 2rem;
        }

        .shop-now-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: var(--gradient);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .shop-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        /* Order Summary */
        .order-summary {
            background: var(--surface);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: var(--shadow);
            border: 1px solid var(--border);
            position: sticky;
            top: 2rem;
            height: fit-content;
        }

        .summary-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border);
        }

        .summary-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text);
        }

        .summary-details {
            margin-bottom: 1.5rem;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--border);
        }

        .summary-row:last-child {
            border-bottom: none;
        }

        .free-shipping {
            color: var(--success);
            font-weight: 600;
        }

        .shipping-notice {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: #f0f9ff;
            border-radius: 8px;
            margin: 0.75rem 0;
            font-size: 0.875rem;
            color: #0369a1;
        }

        .shipping-notice i {
            color: #0284c7;
        }

        .summary-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-top: 2px solid var(--border);
            margin-top: 0.5rem;
            font-weight: 600;
        }

        .total-amount {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }

        .checkout-btn {
            width: 100%;
            padding: 1rem 1.5rem;
            background: var(--gradient);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .checkout-btn:hover:not(.disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .checkout-btn.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        /* Notifications */
        .elegant-notification {
            position: fixed;
            top: 1rem;
            right: 1rem;
            background: var(--surface);
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: var(--shadow);
            border-left: 4px solid var(--primary);
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 1000;
            max-width: 300px;
        }

        .elegant-notification.visible {
            transform: translateX(0);
            opacity: 1;
        }

        .elegant-notification.success {
            border-left-color: var(--success);
        }

        .elegant-notification.error {
            border-left-color: var(--error);
        }

        .elegant-notification.warning {
            border-left-color: var(--warning);
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
            .master-container {
                grid-template-columns: 1fr 350px;
                padding: 2rem;
            }

            .cart-item-desktop:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
            }
        }

        @media (max-width: 767px) {
            .master-container {
                padding: 1rem;
                gap: 1.5rem;
            }

            .cart-item-desktop {
                grid-template-columns: 60px 1fr auto;
                gap: 0.75rem;
                padding: 1rem;
            }

            .item-price,
            .quantity-controls,
            .item-total {
                grid-column: 2 / 4;
                justify-self: start;
            }

            .remove-btn-elegant {
                grid-column: 3;
                grid-row: 1;
            }

            .quantity-controls {
                margin-top: 0.5rem;
            }

            .order-summary {
                position: relative;
                top: 0;
            }

            .elegant-notification {
                right: 1rem;
                left: 1rem;
                max-width: none;
            }
        }

        @media (max-width: 480px) {
            .master-container {
                padding: 0.5rem;
            }

            .cart-item-mobile {
                padding: 0.75rem;
            }

            .quantity-controls-mobile {
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .item-total-mobile {
                margin-left: 0;
                flex-basis: 100%;
                text-align: center;
                padding-top: 0.5rem;
            }

            .order-summary {
                padding: 1.25rem;
            }

            .checkout-btn {
                padding: 0.875rem 1.25rem;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            :root {
                --background: #0f172a;
                --surface: #1e293b;
                --text: #f1f5f9;
                --text-light: #94a3b8;
                --border: #334155;
            }

            .quantity-controls,
            .quantity-controls-mobile {
                background: #1e293b;
            }

            .remove-btn-elegant {
                background: #7f1d1d;
                color: #fecaca;
            }

            .remove-btn-elegant:hover {
                background: #dc2626;
                color: white;
            }

            .shipping-notice {
                background: #1e3a5f;
                color: #bfdbfe;
            }

            .min-order-warning {
                background: #451a03;
                color: #fdba74;
                border-left-color: #f59e0b;
            }
        }
    `;
    document.head.appendChild(style);
}