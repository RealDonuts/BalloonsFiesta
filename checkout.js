const STORE_HOURS = {
    monday: { open: "10:00", close: "20:00", closed: false },
    tuesday: { open: "10:00", close: "20:00", closed: false },
    wednesday: { open: "10:00", close: "20:00", closed: false },
    thursday: { open: "10:00", close: "20:00", closed: false },
    friday: { open: "10:00", close: "21:00", closed: false },
    saturday: { open: "10:00", close: "21:00", closed: false },
    sunday: { open: "11:00", close: "18:00", closed: false }
};



// Store hours helper functions
function isStoreOpen() {
    try {
        const now = new Date();
        const day = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
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

function getStoreHoursMessage() {
    try {
        const now = new Date();
        const day = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.toTimeString().slice(0, 5);
        
        const todayHours = STORE_HOURS[day];
        
        if (isStoreOpen()) {
            const closeTime = todayHours.close;
            return `🟢 Store is OPEN • Closes at ${formatTime(closeTime)} today`;
        } else {
            const nextOpen = getNextOpenDay();
            if (nextOpen) {
                const nextDate = nextOpen.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                const nextOpenTime = nextOpen.hours.open;
                return `🔴 Store is CLOSED • Opens ${nextDate} at ${formatTime(nextOpenTime)}`;
            }
            return "🔴 Store is currently closed";
        }
    } catch (error) {
        console.error('Error getting store hours message:', error);
        return "🔴 Store status unavailable";
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

function validatePickupTime(selectedDate, selectedTime) {
    try {
        const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);
        const selectedDay = selectedDateTime.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = STORE_HOURS[selectedDay];
        
        // Check if store is closed on selected day
        if (!dayHours || dayHours.closed) {
            return { valid: false, message: `Store is closed on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}` };
        }
        
        // Check if selected time is within store hours
        const selectedTimeStr = selectedTime.slice(0, 5);
        if (selectedTimeStr < dayHours.open || selectedTimeStr > dayHours.close) {
            return { 
                valid: false, 
                message: `Store hours on ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}: ${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}` 
            };
        }
        
        // Check if pickup time is at least 30 minutes before closing
        const closingTime = new Date(`${selectedDate}T${dayHours.close}`);
        const thirtyMinutesBeforeClose = new Date(closingTime.getTime() - (30 * 60 * 1000)); // 30 minutes before close
        
        if (selectedDateTime > thirtyMinutesBeforeClose) {
            return { 
                valid: false, 
                message: `Pickup must be at least 30 minutes before closing (${formatTime(dayHours.close)})` 
            };
        }
        
        // Allow same-day orders - only check if date is not in the past
        const now = new Date();
        if (selectedDateTime < now) {
            return { valid: false, message: "Cannot select a date/time in the past" };
        }
        
        // Allow same-day ordering even if store is currently closed
        // (They can order for later in the day when store opens)
        
        return { valid: true, message: "" };
    } catch (error) {
        console.error('Error validating pickup time:', error);
        return { valid: false, message: "Invalid date/time selection" };
    }
}

// Function to show notification messages
function showMessage(message, type = 'info') {
    try {
        const existingMsg = document.querySelector('.notification-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = `notification-message ${type}`;
        msgDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' :
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(msgDiv);

        // Auto remove after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (msgDiv.parentNode) {
                    msgDiv.remove();
                }
            }, 5000);
        }
    } catch (error) {
        console.error('Error showing message:', error);
    }
}

// Function to update cart count display
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
        return count;
    } catch (error) {
        console.error('Error updating cart count:', error);
        return 0;
    }
}

// FIXED: Enhanced form validation for payment
function validateAndGetFormData(accountType) {
    try {
        const formElements = {
            name: document.getElementById('name'),
            email: document.getElementById('email'),
            address: document.getElementById('address'),
            phone: document.getElementById('phone'),
            pickupDate: document.getElementById('pickup-date'),
            pickupTime: document.getElementById('pickup-time')
        };

        // Reset error states
        Object.values(formElements).forEach(element => {
            if (element) {
                element.classList.remove('error');
                const errorElement = document.getElementById(`${element.id}-error`);
                if (errorElement) errorElement.style.display = 'none';
            }
        });



        let isValid = true;
        
        // Required fields validation
        Object.entries(formElements).forEach(([key, element]) => {
            if (!element) return;
            
            const isPickupField = key.startsWith('pickup');
            const isRequired = !isPickupField || (isPickupField && accountType === 'retail');
            
            if (isRequired && !element.value.trim()) {
                isValid = false;
                element.classList.add('error');
                const errorElement = document.getElementById(`${element.id}-error`);
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = `Please enter your ${key.replace('pickup', '').toLowerCase() || key}`;
                }
            }
        });

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formElements.email && formElements.email.value.trim() && !emailRegex.test(formElements.email.value.trim())) {
            isValid = false;
            formElements.email.classList.add('error');
            const errorElement = document.getElementById('email-error');
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = 'Please enter a valid email address';
            }
        }

        // Phone number validation (basic)
        if (formElements.phone && formElements.phone.value.trim()) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const phoneValue = formElements.phone.value.trim().replace(/[-\s\(\)]/g, '');
            if (!phoneRegex.test(phoneValue)) {
                isValid = false;
                formElements.phone.classList.add('error');
                const errorElement = document.getElementById('phone-error');
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = 'Please enter a valid phone number';
                }
            }
        }

        // Validate pickup date is not in the past for retail accounts
        if (accountType === 'retail') {
            if (formElements.pickupDate && !formElements.pickupDate.value) {
                isValid = false;
                formElements.pickupDate.classList.add('error');
                const errorElement = document.getElementById('pickup-date-error');
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = 'Please select a pickup date';
                }
            }
            
            if (formElements.pickupTime && !formElements.pickupTime.value) {
                isValid = false;
                formElements.pickupTime.classList.add('error');
                const errorElement = document.getElementById('pickup-time-error');
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.textContent = 'Please select a pickup time';
                }
            }

            if (formElements.pickupDate && formElements.pickupDate.value) {
                const selectedDate = new Date(formElements.pickupDate.value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    isValid = false;
                    formElements.pickupDate.classList.add('error');
                    const errorElement = document.getElementById('pickup-date-error');
                    if (errorElement) {
                        errorElement.style.display = 'block';
                        errorElement.textContent = 'Pickup date cannot be in the past';
                    }
                }
            }

            // Validate pickup time against store hours
            if (formElements.pickupDate && formElements.pickupTime && 
                formElements.pickupDate.value && formElements.pickupTime.value) {
                
                const validation = validatePickupTime(formElements.pickupDate.value, formElements.pickupTime.value);
                if (!validation.valid) {
                    isValid = false;
                    showMessage(validation.message, 'error');
                }
            }
        }

        if (!isValid) {
            showMessage('Please fill out all required fields correctly', 'error');
            return null;
        }

        // Get cart data
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            showMessage('Your cart is empty', 'error');
            return null;
        }

        // Calculate subtotal and shipping
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let shipping = 0;
        
        if (accountType === 'wholesale') {
            shipping = subtotal >= 300 ? 0 : 4.99;
        }

        // Return form data
        const formData = {
            name: formElements.name.value.trim(),
            email: formElements.email.value.trim(),
            address: formElements.address.value.trim(),
            phone: formElements.phone.value.trim(),
            cart: cart,
            date: new Date().toISOString(),
            accountType: accountType,
            subtotal: subtotal,
            shipping: shipping,
            total: subtotal + shipping,

        };

        if (accountType === 'retail') {
            formData.pickupDate = formElements.pickupDate?.value || '';
            formData.pickupTime = formElements.pickupTime?.value || '';
            formData.storeStatus = isStoreOpen() ? 'open' : 'closed';
            formData.storeHoursMessage = getStoreHoursMessage();
        }

        return formData;
    } catch (error) {
        console.error('Error validating form data:', error);
        showMessage('Error validating form data', 'error');
        return null;
    }
}









// FIXED: Main Order Submission Function with Payment Integration
async function handleOrderSubmission(formData) {
    const submitBtn = document.getElementById('submit-btn');
    const loadingDiv = document.getElementById('loading');
    
    try {
        // Show loading state
        if (submitBtn) submitBtn.disabled = true;
        if (loadingDiv) loadingDiv.style.display = 'block';

        // Generate order ID
        const orderId = 'ORD-' + Date.now();
        
        // Store order in localStorage
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderWithId = {
            ...formData,
            orderId: orderId,
            status: 'pending',
            paymentStatus: 'pending',
            paymentDate: new Date().toISOString()
        };
        
        orders.push(orderWithId);
        localStorage.setItem('orders', JSON.stringify(orders));

        console.log('🔄 Processing order:', orderId);
        showMessage('Processing your order...', 'info');

        // Send emails with better error handling
        let customerEmailResult = { success: false };


        


        showMessage('Order placed successfully!', 'success');

        // Clear cart and redirect after success
        setTimeout(() => {
            localStorage.removeItem('cart');
            updateCartCount();
            window.location.href = 'order-confirmation.html?order=' + orderId;
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error processing order:', error);
        showMessage('Error processing order: ' + error.message, 'error');
        
        // Re-enable form
        if (submitBtn) submitBtn.disabled = false;
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

// FIXED: Form Submission Handler
function setupFormSubmission(accountType) {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate form data
            const formData = validateAndGetFormData(accountType);
            if (!formData) {
                return;
            }

            // Process the order
            await handleOrderSubmission(formData);
        });
    } else {
        console.error('Checkout form not found');
        showMessage('Checkout form not found', 'error');
    }
}

function updateOrderSummary() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const accountType = sessionStorage.getItem('accountType') || 'retail';
        
        // Calculate subtotal
        const subtotal = cart.reduce((sum, item) => {
            const price = item.price || item.basePrice || 0;
            const quantity = item.quantity || 0;
            return sum + (price * quantity);
        }, 0);
        
        // Calculate shipping
        let shipping = 0;
        if (accountType === 'wholesale') {
            shipping = subtotal >= 300 ? 0 : 4.99;
        }
        
        const total = subtotal + shipping;
        
        // Update summary display
        const subtotalElement = document.getElementById('summary-subtotal');
        const shippingElement = document.getElementById('summary-shipping');
        const totalElement = document.getElementById('summary-total');
        const freeShippingMsg = document.getElementById('free-shipping-message');
        const shippingProgress = document.getElementById('shipping-progress');
        
        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingElement) {
            if (accountType === 'wholesale') {
                shippingElement.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
            } else {
                shippingElement.textContent = 'Pickup';
            }
        }
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
        
        // Show/hide free shipping messages for wholesale
        if (accountType === 'wholesale') {
            if (freeShippingMsg) {
                freeShippingMsg.style.display = shipping === 0 ? 'block' : 'none';
            }
            
            if (shippingProgress) {
                if (subtotal > 0 && subtotal < 300) {
                    const amountNeeded = (300 - subtotal).toFixed(2);
                    shippingProgress.style.display = 'block';
                    shippingProgress.innerHTML = `<i class="fas fa-truck"></i> Add $${amountNeeded} more for free shipping!`;
                } else {
                    shippingProgress.style.display = 'none';
                }
            }
        } else {
            // Hide shipping messages for retail
            if (freeShippingMsg) freeShippingMsg.style.display = 'none';
            if (shippingProgress) shippingProgress.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating order summary:', error);
    }
}

// Store hours display functions
function addStoreHoursDisplay() {
    try {
        // Check if already exists
        if (document.querySelector('.store-hours-info')) return;
        
        const storeHoursHTML = `
            <div class="store-hours-info">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-store"></i>
                    <strong>Store Hours & Pickup Information</strong>
                </div>
                <div id="current-store-status" style="margin-bottom: 10px; font-weight: 600;"></div>
                <div style="font-size: 0.8rem; color: #666;">
                    <strong>Store Hours:</strong><br>
                    Mon-Thu: 10:00 AM - 8:00 PM • Fri-Sat: 10:00 AM - 9:00 PM • Sun: 11:00 AM - 6:00 PM<br>
                    <strong>⚠️ Pickup Deadline:</strong> Orders must be picked up 30 minutes before closing
                </div>
            </div>
        `;
        
        const formArea = document.querySelector('.form_area');
        if (formArea) {
            const title = formArea.querySelector('.title');
            if (title) {
                title.insertAdjacentHTML('afterend', storeHoursHTML);
                updateStoreStatusDisplay();
            }
        }
        
        // Update pickup date restrictions
        updatePickupDateRestrictions();
    } catch (error) {
        console.error('Error adding store hours display:', error);
    }
}

function updateStoreStatusDisplay() {
    try {
        const statusElement = document.getElementById('current-store-status');
        if (statusElement) {
            statusElement.innerHTML = getStoreHoursMessage();
        }
    } catch (error) {
        console.error('Error updating store status display:', error);
    }
}

function updatePickupDateRestrictions() {
    try {
        const pickupDateInput = document.getElementById('pickup-date');
        if (!pickupDateInput) return;
        
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days in advance
        
        pickupDateInput.min = today.toISOString().split('T')[0];
        pickupDateInput.max = maxDate.toISOString().split('T')[0];
        
        // ALWAYS default to today to encourage same-day orders
        pickupDateInput.value = today.toISOString().split('T')[0];
        
        // Add change event listener to validate pickup date
        pickupDateInput.addEventListener('change', function() {
            validatePickupDateTime();
            updateAvailableTimes(); // Update available times when date changes
        });
        
        // Also validate when time changes
        const pickupTimeInput = document.getElementById('pickup-time');
        if (pickupTimeInput) {
            pickupTimeInput.addEventListener('change', function() {
                validatePickupDateTime();
            });
            
            // Generate available time slots
            updateAvailableTimes();
        }
    } catch (error) {
        console.error('Error updating pickup date restrictions:', error);
    }
}

function validatePickupDateTime() {
    try {
        const pickupDate = document.getElementById('pickup-date')?.value;
        const pickupTime = document.getElementById('pickup-time')?.value;
        
        if (!pickupDate || !pickupTime) return;
        
        const validation = validatePickupTime(pickupDate, pickupTime);
        
        // Remove any existing validation messages
        const existingMessage = document.querySelector('.pickup-validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        if (!validation.valid) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'pickup-validation-message';
            messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${validation.message}`;
            
            const pickupSection = document.getElementById('pickup-section');
            if (pickupSection) {
                const submitButton = document.querySelector('.btn');
                if (submitButton) {
                    pickupSection.insertBefore(messageDiv, submitButton);
                } else {
                    pickupSection.appendChild(messageDiv);
                }
            }
            
            // Disable submit button
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
            }
        } else {
            // Enable submit button
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error validating pickup date time:', error);
    }
}

function updateAvailableTimes() {
    try {
        const pickupDateInput = document.getElementById('pickup-date');
        const pickupTimeInput = document.getElementById('pickup-time');
        
        if (!pickupDateInput || !pickupTimeInput) return;
        
        const selectedDate = pickupDateInput.value;
        const selectedDay = new Date(selectedDate).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
        const dayHours = STORE_HOURS[selectedDay];
        
        if (!dayHours || dayHours.closed) {
            pickupTimeInput.innerHTML = '<option value="">Store closed</option>';
            return;
        }
        
        // Generate time slots every 30 minutes
        let timeSlots = [];
        const [openHour, openMinute] = dayHours.open.split(':').map(Number);
        const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
        
        let currentTime = new Date();
        currentTime.setHours(openHour, openMinute, 0, 0);
        
        const closingTime = new Date();
        closingTime.setHours(closeHour, closeMinute, 0, 0);
        
        // 30 minutes before closing (pickup deadline)
        const pickupDeadline = new Date(closingTime.getTime() - (30 * 60 * 1000));
        
        while (currentTime <= pickupDeadline) {
            const timeString = currentTime.toTimeString().slice(0, 5);
            const displayTime = formatTime(timeString);
            
            timeSlots.push({
                value: timeString,
                display: displayTime,
                time: new Date(currentTime)
            });
            
            // Add 30 minutes
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        
        // Update the time input options
        pickupTimeInput.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select pickup time';
        pickupTimeInput.appendChild(defaultOption);
        
        // Add available time slots
        timeSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.value;
            option.textContent = slot.display;
            
            // Disable past times for today
            const now = new Date();
            if (selectedDate === now.toISOString().split('T')[0] && slot.time < now) {
                option.disabled = true;
                option.textContent += ' (Past)';
            }
            
            pickupTimeInput.appendChild(option);
        });
        
        // Auto-select the next available time for today
        if (selectedDate === new Date().toISOString().split('T')[0] && timeSlots.length > 0) {
            const now = new Date();
            const nextAvailable = timeSlots.find(slot => slot.time > now);
            if (nextAvailable) {
                pickupTimeInput.value = nextAvailable.value;
            }
        }
    } catch (error) {
        console.error('Error updating available times:', error);
    }
}



// Set account type
function setAccountType(type) {
    try {
        sessionStorage.setItem('accountType', type);
        updateOrderSummary();
        
        // Update pickup section visibility
        const pickupSection = document.getElementById('pickup-section');
        if (pickupSection) {
            if (type === 'retail') {
                pickupSection.style.display = 'block';
                // Set minimum date for pickup to today
                const today = new Date().toISOString().split('T')[0];
                const pickupDate = document.getElementById('pickup-date');
                if (pickupDate) {
                    pickupDate.min = today;
                }
            } else {
                pickupSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error setting account type:', error);
    }
}

// CSS Injection Function
function injectCheckoutStyles() {
    if (document.querySelector('#checkout-styles')) return;
    
    const styles = `
        .notification-message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        }
        
        .notification-message.success {
            background: #4CAF50;
        }
        
        .notification-message.error {
            background: #f44336;
        }
        
        .notification-message.warning {
            background: #ff9800;
        }
        
        .notification-message.info {
            background: #2196F3;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .pickup-validation-message {
            background: #ffebee;
            color: #d32f2f;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #f44336;
            font-size: 0.9rem;
        }
        
        .store-hours-info {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #4CAF50;
            font-size: 0.9rem;
        }
        
        #loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .form-group.error input,
        .form-group.error select {
            border-color: #f44336 !important;
            background-color: #ffebee;
        }
        
        .error-message {
            color: #f44336;
            font-size: 0.8rem;
            margin-top: 5px;
            display: none;
        }
        

    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'checkout-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// Helper functions for better organization
function setupAccountType(accountType) {
    const pickupSection = document.getElementById('pickup-section');
    if (pickupSection) {
        if (accountType === 'retail') {
            pickupSection.style.display = 'block';
        } else {
            pickupSection.style.display = 'none';
        }
    }
}

function prefillUserInfo() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        if (userData && Object.keys(userData).length > 0) {
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const phoneField = document.getElementById('phone');
            
            if (nameField) nameField.value = userData.username || userData.name || '';
            if (emailField) emailField.value = userData.email || '';
            if (phoneField) phoneField.value = userData.phone || '';
        }
    } catch (e) {
        console.error('Error pre-filling form:', e);
    }
}





// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Checkout page loaded');
    
    // Inject styles first
    injectCheckoutStyles();
    
    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    if (!isLoggedIn) {
        showMessage('Please login to proceed with checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // Initialize EmailJS check
    if (typeof emailjs === 'undefined') {
        console.warn('⚠️ EmailJS not loaded yet, waiting...');
    } else {
        console.log('✅ EmailJS is ready');
    }

    // Initialize components with error handling
    try {
        updateCartCount();
        updateOrderSummary();
        addStoreHoursDisplay();
        
        let accountType = sessionStorage.getItem('accountType') || 'retail';
        console.log('👤 Current account type:', accountType);
        
        // Setup form based on account type
        setupAccountType(accountType);
        
        // Pre-fill form with user info
        prefillUserInfo();
        



        
        // Setup form submission
        setupFormSubmission(accountType);
        

        
    } catch (error) {
        console.error('Error during checkout initialization:', error);
        showMessage('Error initializing checkout page', 'error');
    }
});

// Make functions available globally for debugging

window.updateCartCount = updateCartCount;
window.updateOrderSummary = updateOrderSummary;
window.isStoreOpen = isStoreOpen;
window.getStoreHoursMessage = getStoreHoursMessage;


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
    setActiveDropdownItem();
});