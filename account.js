document.addEventListener('DOMContentLoaded', () => {
    // Add custom styles
    addAccountStyles();

    // Check if user is logged in
    const username = sessionStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    // Load account info
    const accountType = sessionStorage.getItem('accountType');
    const email = sessionStorage.getItem('userEmail');
    const phone = sessionStorage.getItem('userPhone');

    // Display account info
    const accountInfo = document.getElementById('account-info');
    if (accountInfo) {
        accountInfo.innerHTML = `
            <div class="info-item">
                <div class="info-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div class="info-content">
                    <label>Username</label>
                    <span class="info-value">${username || 'Not available'}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i class="fas fa-envelope"></i>
                </div>
                <div class="info-content">
                    <label>Email</label>
                    <span class="info-value">${email || 'Not provided'}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i class="fas fa-phone"></i>
                </div>
                <div class="info-content">
                    <label>Phone</label>
                    <span class="info-value">${phone || 'Not provided'}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon">
                    <i class="fas fa-calendar"></i>
                </div>
                <div class="info-content">
                    <label>Member Since</label>
                    <span class="info-value">${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>
        `;
    }

    // Show previous orders
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
        try {
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const userOrders = orders.filter(order => order.email === email);
            
            if (userOrders.length === 0) {
                ordersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>No Orders Yet</h3>
                        <p>You haven't placed any orders yet. Start shopping to see your order history here.</p>
                        <button class="btn-primary" onclick="window.location.href='web.html'">
                            Start Shopping
                        </button>
                    </div>
                `;
            } else {
                ordersList.innerHTML = userOrders.map((order, index) => `
                    <div class="order-card">
                        <div class="order-header">
                            <div class="order-id">Order #${String(index + 1).padStart(3, '0')}</div>
                            <div class="order-date">${order.date ? new Date(order.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'N/A'}</div>
                        </div>
                        <div class="order-details">
                            <div class="order-info">
                                <div class="info-row">
                                    <span class="info-label">Pickup Date:</span>
                                    <span class="info-value">${order.pickupDate || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Pickup Time:</span>
                                    <span class="info-value">${order.pickupTime || 'N/A'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Total:</span>
                                    <span class="order-total">$${order.total ? order.total.toFixed(2) : 'N/A'}</span>
                                </div>
                            </div>
                            <div class="order-items">
                                <strong>Items:</strong>
                                <div class="items-list">
                                    ${order.cart ? order.cart.map(item => `
                                        <div class="order-item">
                                            <span class="item-name">${item.name}</span>
                                            <span class="item-quantity">x${item.quantity}</span>
                                            <span class="item-price">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                        </div>
                                    `).join('') : 'No items'}
                                </div>
                            </div>
                        </div>
                        <div class="order-status">
                            <span class="status-badge status-completed">Completed</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Orders</h3>
                    <p>There was a problem loading your order history. Please try again later.</p>
                </div>
            `;
        }
    }

    // Handle password change - FIXED VERSION
    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        // Don't replace the entire form HTML, just enhance it
        const originalFormContent = passwordForm.innerHTML;
        
        // Add password requirements section
        const requirementsHTML = `
            <div class="password-requirements">
                <h4>Password Requirements:</h4>
                <ul>
                    <li class="requirement" data-requirement="length">
                        <i class="fas fa-circle"></i>
                        At least 6 characters long
                    </li>
                    <li class="requirement" data-requirement="different">
                        <i class="fas fa-circle"></i>
                        Different from current password
                    </li>
                    <li class="requirement" data-requirement="match">
                        <i class="fas fa-circle"></i>
                        New passwords must match
                    </li>
                </ul>
            </div>
        `;
        
        // Insert requirements before the submit button
        const submitButton = passwordForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.insertAdjacentHTML('beforebegin', requirementsHTML);
        }

        // Add password match feedback element
        const confirmPasswordGroup = passwordForm.querySelector('#confirm-password').closest('.form-group');
        if (confirmPasswordGroup) {
            confirmPasswordGroup.insertAdjacentHTML('beforeend', '<div id="password-match" class="password-feedback"></div>');
        }

        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = passwordForm.querySelector('button[type="submit"]');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            submitBtn.disabled = true;

            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                showMessage('Please fill in all fields', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            if (newPassword !== confirmPassword) {
                showMessage('New passwords do not match', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            if (newPassword.length < 6) {
                showMessage('Password must be at least 6 characters long', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            if (newPassword === currentPassword) {
                showMessage('New password must be different from current password', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            // Get current user data
            const currentUsername = sessionStorage.getItem('username');
            const currentEmail = sessionStorage.getItem('userEmail');
            
            // Load all accounts
            const createdAccounts = JSON.parse(localStorage.getItem('createdAccounts')) || [];

            // Find the user account in created accounts
            let userAccount = createdAccounts.find(acc => 
                acc.username === currentUsername || acc.email === currentEmail
            );
            
            if (!userAccount) {
                showMessage('You can only change password for accounts created through registration', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            // Verify current password
            if (userAccount.password !== hashPassword(currentPassword)) {
                showMessage('Current password is incorrect', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            // Update password in created accounts
            const updatedAccounts = createdAccounts.map(acc => {
                if (acc.username === currentUsername || acc.email === currentEmail) {
                    return { ...acc, password: hashPassword(newPassword) };
                }
                return acc;
            });
            
            localStorage.setItem('createdAccounts', JSON.stringify(updatedAccounts));

            // Show success message
            showMessage('Password changed successfully! You will be redirected to login page.', 'success');
            
            // Clear form
            passwordForm.reset();
            const passwordStrength = document.getElementById('password-strength');
            if (passwordStrength) passwordStrength.innerHTML = '';
            
            const passwordMatch = document.getElementById('password-match');
            if (passwordMatch) passwordMatch.innerHTML = '';
            
            updatePasswordRequirements([]);

            // Redirect to login page after success
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }, 3000);
        });

        // Real-time password confirmation check
        const confirmPasswordInput = document.getElementById('confirm-password');
        const newPasswordInput = document.getElementById('new-password');
        const passwordMatch = document.getElementById('password-match');
        
        if (confirmPasswordInput && newPasswordInput && passwordMatch) {
            confirmPasswordInput.addEventListener('input', function() {
                const newPassword = newPasswordInput.value;
                const confirmPassword = this.value;
                
                if (confirmPassword.length === 0) {
                    passwordMatch.innerHTML = '';
                    updatePasswordRequirement('match', false);
                    return;
                }

                if (newPassword === confirmPassword) {
                    passwordMatch.innerHTML = `
                        <div class="match-success">
                            <i class="fas fa-check-circle"></i>
                            Passwords match
                        </div>
                    `;
                    updatePasswordRequirement('match', true);
                } else {
                    passwordMatch.innerHTML = `
                        <div class="match-error">
                            <i class="fas fa-times-circle"></i>
                            Passwords do not match
                        </div>
                    `;
                    updatePasswordRequirement('match', false);
                }
            });

            newPasswordInput.addEventListener('input', function() {
                const newPassword = this.value;
                const currentPassword = document.getElementById('current-password').value;
                const confirmPassword = confirmPasswordInput.value;
                
                // Check length requirement
                updatePasswordRequirement('length', newPassword.length >= 6);
                
                // Check if different from current password
                updatePasswordRequirement('different', newPassword !== currentPassword && newPassword.length > 0);
                
                // Update match requirement if confirm password is filled
                if (confirmPassword.length > 0) {
                    updatePasswordRequirement('match', newPassword === confirmPassword);
                }
            });

            // Also check when current password changes
            document.getElementById('current-password').addEventListener('input', function() {
                const currentPassword = this.value;
                const newPassword = newPasswordInput.value;
                
                if (newPassword.length > 0) {
                    updatePasswordRequirement('different', newPassword !== currentPassword);
                }
            });
        }
    }

    // Enhanced password strength indicator
    const newPasswordInput = document.getElementById('new-password');
    const passwordStrength = document.getElementById('password-strength');
    
    if (newPasswordInput && passwordStrength) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            
            if (password.length === 0) {
                passwordStrength.innerHTML = '';
                return;
            }
            
            const { strength, feedback } = checkPasswordStrength(password);
            const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
            const strengthColors = ['#ff4757', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'];
            const strengthIcons = ['fa-times-circle', 'fa-exclamation-circle', 'fa-check-circle', 'fa-check-circle', 'fa-shield-check'];
            
            passwordStrength.innerHTML = `
                <div class="password-strength-meter">
                    <div class="strength-header">
                        <i class="fas ${strengthIcons[strength]}" style="color: ${strengthColors[strength]}"></i>
                        <span class="strength-text" style="color: ${strengthColors[strength]}">${strengthText}</span>
                        <span class="strength-score">${(strength + 1) * 20}%</span>
                    </div>
                    <div class="strength-bar">
                        <div class="strength-fill" style="width: ${(strength + 1) * 20}%; background: ${strengthColors[strength]}"></div>
                    </div>
                </div>
            `;
        });
    }

    // Password toggle functionality
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (passwordInput) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                    this.title = 'Hide password';
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                    this.title = 'Show password';
                }
            }
        });
    });

    // Update cart count
    updateCartCount();

    // Add responsive behavior for touch devices
    addTouchSupport();
});

// Add beautiful styles with enhanced responsive design
function addAccountStyles() {
    const styles = `
        <style>
            /* Your existing CSS styles remain the same */
            .account-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
            }

            .account-card {
                background: white;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                border: 1px solid #eaeaea;
            }

            .account-card h3 {
                color: #2c3e50;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 1.3em;
            }

            .account-card h3 i {
                color: #667eea;
            }

            .info-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .info-item:last-child {
                border-bottom: none;
            }

            .info-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                flex-shrink: 0;
            }

            .info-content {
                flex: 1;
            }

            .info-content label {
                display: block;
                font-weight: 600;
                color: #7f8c8d;
                font-size: 0.85em;
                margin-bottom: 5px;
                text-transform: uppercase;
            }

            .info-value {
                font-size: 1.1em;
                color: #2c3e50;
                font-weight: 500;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #2c3e50;
            }

            .form-group input {
                width: 100%;
                padding: 12px 45px 12px 15px;
                border: 2px solid #e1e5ee;
                border-radius: 10px;
                font-size: 16px;
                transition: all 0.3s ease;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .toggle-password {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #7f8c8d;
                cursor: pointer;
                padding: 5px;
            }

            .password-strength {
                margin-top: 10px;
            }

            .password-requirements {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid #e9ecef;
            }

            .password-requirements h4 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: 1em;
            }

            .password-requirements ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .requirement {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 5px 0;
                color: #7f8c8d;
                font-size: 0.9em;
            }

            .requirement.met {
                color: #27ae60;
            }

            .requirement.met i {
                color: #27ae60;
            }

            .requirement.unmet {
                color: #7f8c8d;
            }

            .requirement.unmet i {
                color: #e0e0e0;
            }

            .password-feedback {
                margin-top: 8px;
            }

            .match-success, .match-error {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.85em;
                font-weight: 500;
                padding: 8px 12px;
                border-radius: 6px;
            }

            .match-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .match-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 10px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }

            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .fa-spin {
                animation: fa-spin 1s infinite linear;
            }

            @keyframes fa-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Order card styles */
            .order-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                border: 1px solid #eaeaea;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }

            .order-header {
                display: flex;
                justify-content: between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #f0f0f0;
            }

            .order-id {
                font-weight: 600;
                color: #2c3e50;
            }

            .order-date {
                color: #7f8c8d;
                font-size: 0.9em;
            }

            .order-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .order-total {
                font-weight: 700;
                color: #27ae60;
            }

            .items-list {
                margin-top: 10px;
            }

            .order-item {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                border-bottom: 1px solid #f8f9fa;
            }

            .status-badge {
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8em;
                font-weight: 600;
            }

            .status-completed {
                background: #d4edda;
                color: #155724;
            }

            .empty-state, .error-state {
                text-align: center;
                padding: 40px 20px;
                color: #7f8c8d;
            }

            .empty-state i, .error-state i {
                font-size: 3em;
                margin-bottom: 15px;
                opacity: 0.5;
            }

            .account-message {
                padding: 15px 20px;
                margin-bottom: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 500;
            }

            .account-message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .account-message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .account-message.info {
                background: #cce7ff;
                color: #004085;
                border: 1px solid #b3d7ff;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .account-container {
                    padding: 15px;
                }

                .account-card {
                    padding: 20px;
                }

                .order-details {
                    grid-template-columns: 1fr;
                }

                .info-item {
                    flex-direction: column;
                    text-align: center;
                    gap: 10px;
                }

                .info-icon {
                    width: 50px;
                    height: 50px;
                }
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// Enhanced password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) {
        strength++;
    } else {
        feedback.push('at least 8 characters');
    }
    
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        strength++;
    } else {
        if (!password.match(/[a-z]/)) feedback.push('lowercase letters');
        if (!password.match(/[A-Z]/)) feedback.push('uppercase letters');
    }
    
    if (password.match(/\d/)) {
        strength++;
    } else {
        feedback.push('at least one number');
    }
    
    if (password.match(/[^a-zA-Z\d]/)) {
        strength++;
    } else {
        feedback.push('at least one special character');
    }
    
    return { strength: Math.min(strength, 4), feedback };
}

// Update individual password requirement
function updatePasswordRequirement(requirement, met) {
    const element = document.querySelector(`[data-requirement="${requirement}"]`);
    if (element) {
        const icon = element.querySelector('i');
        if (met) {
            element.classList.add('met');
            element.classList.remove('unmet');
            icon.className = 'fas fa-check-circle';
        } else {
            element.classList.add('unmet');
            element.classList.remove('met');
            icon.className = 'fas fa-circle';
        }
    }
}

// Update all password requirements
function updatePasswordRequirements(requirements) {
    const requirementElements = document.querySelectorAll('.requirement');
    requirementElements.forEach(element => {
        element.classList.add('unmet');
        element.classList.remove('met');
        const icon = element.querySelector('i');
        icon.className = 'fas fa-circle';
    });
}

// Reset button state
function resetButton(button, originalHTML) {
    button.innerHTML = originalHTML;
    button.disabled = false;
}

// Hash function
function hashPassword(password) {
    if (!password) return '';
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.account-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `account-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${getIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    const accountContainer = document.querySelector('.account-container');
    if (accountContainer) {
        accountContainer.insertBefore(messageDiv, accountContainer.firstChild);
    }

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

function getIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

// Update cart count
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const count = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
        });
    } catch (error) {
        console.error('Error updating cart count:', error);
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = '0';
        });
    }
}

// Add touch support for mobile devices
function addTouchSupport() {
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            button.style.touchAction = 'manipulation';
        });
    }
}