document.addEventListener('DOMContentLoaded', () => {
    const productDetails = document.getElementById('product-details');
    let product;
    let settings = {};
    
    try {
        product = JSON.parse(sessionStorage.getItem('currentProduct'));
    } catch (e) {
        console.error('Error parsing product data:', e);
    }
    
    if (!product) {
        productDetails.innerHTML = '<p>Product not found. <a href="index.html">Return to shop</a></p>';
        return;
    }
    
    const cartCountElement = document.querySelector('.cart-count');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let cartCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
    const accountType = sessionStorage.getItem('accountType') || 'retail';
    
    // Update cart count
    cartCountElement.textContent = cartCount;
    
    // Fetch products and settings from JSON
    fetch("web.json")
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const jsonData = data[0];
            settings = jsonData.settings || {};
            renderProductDetails();
        })
        .catch(error => {
            console.error("Error fetching settings:", error);
            renderProductDetails(); // Render with default prices
        });

    // Product pricing function - use the new pricing structure
    function getProductPrice(product, accountType, isInflated = false) {
        if (!product) return 0;
        
        if (accountType === 'wholesale') {
            if (product.pricing && product.pricing.wholesale) {
                return product.pricing.wholesale;
            }
            return product.basePrice || product.price || 0;
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
        
        return product.basePrice || product.price || 0;
    }

    // Get minimum order quantity - UPDATED
    function getMinimumOrderQuantity(product) {
        if (accountType !== 'wholesale') return 1;
        
        // Use product-specific minimum order if defined
        if (product.minimumOrderQuantity) {
            return product.minimumOrderQuantity;
        }
        
        // Category-based minimum orders
        if (product.category === "NUMBER BALLOONS") return 5;
        if (product.category === "18\" foil balloon") return 10;
        if (product.category === "LETTER BALLOONS") return 5;
        if (product.category === "Standard") return 50;
        if (product.category === "Clearance") return 1;
        
        // Default minimum for wholesale
        return 5;
    }

    // Create visual color selector
    function createColorSelector(colors, label) {
        const colorMap = {
            'lavender': { class: 'color-lavender', display: '' },
            'gold': { class: 'color-gold', display: '' },
            'silver': { class: 'color-silver', display: '' },
            'rose gold': { class: 'color-rose-gold', display: '' },
            'red': { class: 'color-red', display: '' },
            'blue': { class: 'color-blue', display: '' },
            'purple': { class: 'color-purple', display: '' },
            'pink': { class: 'color-pink', display: '' },
            'black': { class: 'color-black', display: '' },
            'rainbow': { class: 'color-rainbow', display: '' },
            'white': { class: 'color-white', display: '' }
        };

        const colorOptions = colors.map(color => {
            const colorKey = color.toLowerCase();
            const colorInfo = colorMap[colorKey] || { class: 'color-default', display: color };
            
            return `
                <div class="color-option ${colorInfo.class} ${color === colors[0] ? 'selected' : ''}" 
                     data-value="${color}" 
                     title="${colorInfo.display}">
                    ${colorInfo.display.length <= 8 ? colorInfo.display : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="color-option-group">
                <label>${label}:</label>
                <div class="color-options" data-option="color">
                    ${colorOptions}
                </div>
                <div class="selected-color-name" id="selected-color-display">
                    ${colorMap[colors[0].toLowerCase()]?.display || colors[0]}
                </div>
                <input type="hidden" id="selected-color" value="${colors[0]}">
            </div>
        `;
    }

    function renderProductDetails() {
        // Check if product should be visible to retail customers
        if (accountType === 'retail' && product.showInRetail === false) {
            productDetails.innerHTML = `
                <div class="access-denied-card">
                    <div class="access-denied-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2>Wholesale Exclusive</h2>
                    <p>This product is only available to wholesale customers. Please contact us to set up a wholesale account.</p>
                    <div class="access-actions">
                        <a href="contact.html" class="contact-support-btn">
                            <i class="fas fa-envelope"></i>
                            Contact Support
                        </a>
                        <a href="index.html" class="continue-shopping-btn">
                            <i class="fas fa-shopping-bag"></i>
                            Continue Shopping
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        const minOrder = getMinimumOrderQuantity(product);
        
        // Debug logging
        console.log('Product:', product);
        console.log('Account Type:', accountType);
        console.log('Product Pricing:', product.pricing);
        
        // Render product details
        let optionsHTML = '';
        
        // Add inflation option for retail accounts
        let inflationOptionHTML = '';
        if (accountType === 'retail' && product.pricing && typeof product.pricing.retail === 'object') {
            const uninflatedPrice = product.pricing.retail.uninflated;
            const inflatedPrice = product.pricing.retail.inflated || uninflatedPrice + (settings.inflationFee || 5);
            
            inflationOptionHTML = `
                <div class="option-group">
                    <label>Inflation Option:</label>
                    <select class="option-select" data-option="inflation" id="inflation-select">
                        <option value="uninflated">Uninflated - $${uninflatedPrice.toFixed(2)}</option>
                        <option value="inflated">Inflated - $${inflatedPrice.toFixed(2)}</option>
                    </select>
                </div>
            `;
        }
        
        if (product.options) {
            for (const [optionType, values] of Object.entries(product.options)) {
                if (optionType === 'number' || optionType === 'numbers') {
                    const label = optionType === 'numbers' ? 'Number' : optionType;
                    optionsHTML += `
                        <div class="option-group">
                            <label>${label}:</label>
                            <select class="option-select" data-option="${optionType === 'numbers' ? 'number' : optionType}">
                                ${values.map(value => `<option value="${value}">${value}</option>`).join('')}
                            </select>
                        </div>
                    `;
                } else if (optionType === 'color' || optionType === 'colors') {
                    const label = optionType === 'colors' ? 'Color' : optionType;
                    optionsHTML += createColorSelector(values, label);
                } else if (optionType === 'designs') {
                    optionsHTML += `
                        <div class="option-group">
                            <label>Design:</label>
                            <select class="option-select" data-option="design">
                                ${values.map(value => `<option value="${value}">${value}</option>`).join('')}
                            </select>
                        </div>
                    `;
                }
            }
        }
        
        // Dynamic price display that updates with inflation selection
        let priceDisplayHTML = '';
        if (accountType === 'wholesale') {
            const displayPrice = getProductPrice(product, accountType);
            priceDisplayHTML = `
                <div class="price-display">
                    <span class="current-price">$${displayPrice.toFixed(2)}</span>
                    <small style="color: #666; margin-left: 10px;">(Wholesale Price)</small>
                </div>
                ${minOrder > 1 ? `
                    <div class="min-order-notice" style="color: #e74c3c; margin: 10px 0; padding: 10px; background: #ffeaa7; border-radius: 5px;">
                        <i class="fas fa-exclamation-circle"></i> 
                        <strong>Minimum Order:</strong> ${minOrder} units required for wholesale purchase
                    </div>
                ` : ''}
            `;
        } else {
            const uninflatedPrice = product.pricing?.retail?.uninflated || getProductPrice(product, accountType);
            const inflatedPrice = product.pricing?.retail?.inflated || uninflatedPrice + (settings.inflationFee || 5);
            
            priceDisplayHTML = `
                <div class="price-display" id="dynamic-price-display">
                    <span class="current-price">$${uninflatedPrice.toFixed(2)}</span>
                    <small style="color: #666; margin-left: 10px;">(Uninflated)</small>
                </div>
            `;
        }
        
        productDetails.innerHTML = `
            <a href="index.html" class="back-to-shop" style="margin-bottom: 20px; display: inline-flex;">
                <i class="fas fa-arrow-left"></i>
                <span>Back to Shop</span>
            </a>
            
            <div class="product-details-card">
                <div class="product-image-container">
                    <img src="${getListingImage(product)}" alt="${product.name}" class="product-image" id="product-main-image">
                </div>
                <div class="product-info">
                    <h2>${product.name}</h2>
                    <p class="product-description">${product.description || 'No description available'}</p>
                    
                    ${optionsHTML}
                    ${inflationOptionHTML}
                    
                    ${priceDisplayHTML}
                    
                    <div class="quantity-selector" style="margin: 20px 0;">
                        <label for="quantity">Quantity:</label>
                        <input type="number" id="quantity" name="quantity" min="${minOrder}" value="${minOrder}" 
                               style="width: 80px; padding: 8px; border: 2px solid #b18597; border-radius: 5px; margin-left: 10px;">
                        ${minOrder > 1 ? `<small style="display: block; color: #666; margin-top: 5px;">Minimum: ${minOrder} units</small>` : ''}
                    </div>
                    
                    <button class="product-add-to-cart" id="add-to-cart-btn" style="width: 100%;">
                        <span class="button_top">
                            ${accountType === 'wholesale' && minOrder > 1 ? `Add ${minOrder} to Cart` : 'Add to Cart'}
                        </span>
                    </button>
                    
                    ${product.details ? `
                    <div class="product-specs">
                        <h3>Product Details</h3>
                        <ul>
                            ${Object.entries(product.details).map(([key, value]) => `
                                <li><strong>${key}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Initialize image and event listeners
        updateImage();
        setupEventListeners();
        
        // Setup inflation price updates for retail
        if (accountType === 'retail' && product.pricing && typeof product.pricing.retail === 'object') {
            setupInflationPriceUpdates();
        }
    }

    // Add this function to handle inflation price updates
    function setupInflationPriceUpdates() {
        const inflationSelect = document.getElementById('inflation-select');
        const priceDisplay = document.getElementById('dynamic-price-display');
        
        if (inflationSelect && priceDisplay) {
            inflationSelect.addEventListener('change', function() {
                const isInflated = this.value === 'inflated';
                const uninflatedPrice = product.pricing.retail.uninflated;
                const inflatedPrice = product.pricing.retail.inflated || uninflatedPrice + (settings.inflationFee || 5);
                const currentPrice = isInflated ? inflatedPrice : uninflatedPrice;
                
                priceDisplay.innerHTML = `
                    <span class="current-price">$${currentPrice.toFixed(2)}</span>
                    <small style="color: #666; margin-left: 10px;">(${isInflated ? 'Inflated' : 'Uninflated'})</small>
                `;
            });
        }
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
    
    function updateImage() {
        // Get selected color from visual selector
        const selectedColorElement = document.querySelector('.color-option.selected');
        const selectedColor = selectedColorElement ? selectedColorElement.getAttribute('data-value') : null;
        
        const selectedNumber = document.querySelector('[data-option="number"]')?.value || "0";
        
        if (product.imageMap && selectedColor) {
            const productImage = document.getElementById('product-main-image');
            const colorImages = product.imageMap[selectedColor];
            if (colorImages && colorImages[selectedNumber]) {
                productImage.src = colorImages[selectedNumber];
            } else if (colorImages && Object.keys(colorImages).length > 0) {
                // Fallback to first available image for this color
                const firstImage = colorImages[Object.keys(colorImages)[0]];
                productImage.src = firstImage;
            } else {
                productImage.src = product.image;
            }
        }
    }
    
    function setupEventListeners() {
        // Add event listeners for option changes
        if (product.options) {
            const optionSelects = document.querySelectorAll('.option-select');
            optionSelects.forEach(select => {
                select.addEventListener('change', () => {
                    if (select.dataset.option === 'number') {
                        updateImage();
                    }
                });
            });
        }
        
        // Add event listeners for color options
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all color options
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Update hidden input and display
                const selectedColor = this.getAttribute('data-value');
                document.getElementById('selected-color').value = selectedColor;
                
                // Update color name display
                const colorDisplay = document.getElementById('selected-color-display');
                const colorMap = {
                    'lavender': 'Lavender',
                    'gold': 'Gold',
                    'silver': 'Silver',
                    'rose gold': 'Rose Gold',
                    'rosegold': 'Rose Gold',
                    'red': 'Red',
                    'blue': 'Blue',
                    'purple': 'Purple',
                    'pink': 'Pink',
                    'black': 'Black',
                    'rainbow': 'Rainbow',
                    'white': 'White'
                };
                colorDisplay.textContent = colorMap[selectedColor.toLowerCase()] || selectedColor;
                
                // Update product image
                updateImage();
            });
        });
        
        // Add to cart button functionality
        document.getElementById('add-to-cart-btn').addEventListener('click', addToCartHandler);
        
        // Update button text when quantity changes
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                const quantity = parseInt(quantityInput.value) || getMinimumOrderQuantity(product);
                const addToCartBtn = document.getElementById('add-to-cart-btn');
                const buttonTop = addToCartBtn.querySelector('.button_top');
                buttonTop.textContent = `Add ${quantity} to Cart`;
            });
        }
    }
    
    function addToCartHandler() {
        const minOrder = getMinimumOrderQuantity(product);
        const quantityInput = document.getElementById('quantity');
        let quantity = parseInt(quantityInput?.value) || minOrder;
        
        // Validate minimum order for wholesale - STRICTER VALIDATION
        if (accountType === 'wholesale') {
            if (quantity < minOrder) {
                showNotification(`Minimum order for ${product.name} is ${minOrder} units`, 'error');
                quantityInput.value = minOrder;
                quantity = minOrder;
                
                // Update button text to reflect minimum order
                const addToCartBtn = document.getElementById('add-to-cart-btn');
                const buttonTop = addToCartBtn.querySelector('.button_top');
                buttonTop.textContent = `Add ${minOrder} to Cart`;
                return;
            }
        }
        
        let selectedOptions = {};
        
        if (product.options) {
            // Get selected color from visual selector
            const selectedColorElement = document.querySelector('.color-option.selected');
            if (selectedColorElement) {
                selectedOptions['color'] = selectedColorElement.getAttribute('data-value');
            }
            
            // Get other options from dropdowns
            const optionSelects = document.querySelectorAll('.option-select');
            optionSelects.forEach(select => {
                if (select.dataset.option !== 'color') { // Skip color as we already handled it
                    selectedOptions[select.dataset.option] = select.value;
                }
            });
        }
        
        // Get inflation option for retail
        let inflationOption = null;
        let currentPrice;
        
        if (accountType === 'retail') {
            const inflationSelect = document.getElementById('inflation-select');
            inflationOption = inflationSelect ? inflationSelect.value : 'uninflated';
            const isInflated = inflationOption === 'inflated';
            currentPrice = getProductPrice(product, accountType, isInflated);
        } else {
            currentPrice = getProductPrice(product, accountType);
        }
        
        // Check if product already in cart (with same options)
        const existingItemIndex = cart.findIndex(item => {
            if (item.id !== product.id) return false;
            if (!product.options) return true;
            
            for (const [option, value] of Object.entries(selectedOptions)) {
                if (item.selectedOptions[option] !== value) return false;
            }
            
            // Also check inflation option for retail
            if (accountType === 'retail' && item.inflationOption !== inflationOption) {
                return false;
            }
            
            return true;
        });
        
        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            const cartItem = {
                ...product,
                price: currentPrice,
                selectedOptions: product.options ? selectedOptions : null,
                quantity: quantity,
                image: document.getElementById('product-main-image').src,
                minOrder: accountType === 'wholesale' ? minOrder : 1
            };
            
            // Add inflation option for retail accounts
            if (accountType === 'retail') {
                cartItem.inflationOption = inflationOption;
            }
            
            cart.push(cartItem);
        }
        
        cartCount += quantity;
        cartCountElement.textContent = cartCount;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Visual feedback
        const button = document.getElementById('add-to-cart-btn');
        button.classList.add('added');
        button.querySelector('.button_top').textContent = `Added ${quantity}!`;
        button.disabled = true;
        
        showNotification(`${quantity} ${product.name} added to cart`, 'success');
        
        setTimeout(() => {
            button.classList.remove('added');
            const minOrder = getMinimumOrderQuantity(product);
            button.querySelector('.button_top').textContent = accountType === 'wholesale' && minOrder > 1 ? 
                `Add ${minOrder} to Cart` : 'Add to Cart';
            button.disabled = false;
        }, 2000);
    }
    
    function showNotification(message, type) {
        // Remove existing notification
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
    
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 300px;
        `;
    
        document.body.appendChild(notification);
    
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
});