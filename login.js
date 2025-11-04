const validCredentials = {
    retail: [
        { 
            username: 'customer', 
            password: 'customer120', 
            email: 'customer@example.com', 
            phone: '1234567890', 
            accountType: 'retail' 
        }
    ],
    wholesale: [
        { 
            username: 'Balloons_Fiesta', 
            password: 'Balloons123', 
            email: 'wholesale@example.com', 
            phone: '9876543210', 
            accountType: 'wholesale' 
        }
    ],
    admin: [
        { 
            username: 'Muzammil', 
            password: 'Muzammil@#$1', 
            email: 'admin@example.com', 
            phone: '1112223333', 
            accountType: 'admin' 
        }
    ]
};

// Simple hash function for demo (use proper bcrypt in production)
function hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength++;
    else feedback.push('at least 8 characters');
    
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    else feedback.push('both uppercase and lowercase letters');
    
    if (password.match(/\d/)) strength++;
    else feedback.push('at least one number');
    
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    else feedback.push('at least one special character');
    
    return { strength, feedback };
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (sessionStorage.getItem('loggedIn') === 'true') {
        window.location.href = 'web.html';
        return;
    }

    // Toggle between login and create account forms
    document.getElementById('show-create-account').addEventListener('click', function() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('create-account-section').style.display = 'none';
        document.getElementById('create-account-form').style.display = 'block';
        document.getElementById('wholesale-request-form').style.display = 'none';
        clearLoginMessages();
    });

    document.getElementById('cancel-create-account').addEventListener('click', function() {
        document.getElementById('create-account-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('create-account-section').style.display = 'block';
        document.getElementById('wholesale-request-form').style.display = 'none';
        clearRegistrationForm();
        clearLoginMessages();
    });

    // Toggle wholesale request form
    document.getElementById('show-wholesale-request').addEventListener('click', function() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('create-account-section').style.display = 'none';
        document.getElementById('create-account-form').style.display = 'none';
        document.getElementById('wholesale-request-form').style.display = 'block';
        clearLoginMessages();
    });

    document.getElementById('cancel-wholesale-request').addEventListener('click', function() {
        document.getElementById('wholesale-request-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('create-account-section').style.display = 'block';
        document.getElementById('create-account-form').style.display = 'none';
        clearWholesaleRequestForm();
        clearLoginMessages();
    });

    // Real-time password strength indicator
    const newPasswordInput = document.getElementById('new-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            if (password.length === 0) {
                document.getElementById('password-strength').innerHTML = '';
                return;
            }
            
            const { strength, feedback } = checkPasswordStrength(password);
            const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength];
            const strengthColors = ['#ff4757', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'];
            
            document.getElementById('password-strength').innerHTML = `
                <div style="margin-top: 8px; font-size: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <div style="flex: 1; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                            <div style="width: ${(strength + 1) * 20}%; height: 100%; background: ${strengthColors[strength]}; transition: all 0.3s ease;"></div>
                        </div>
                        <span style="font-weight: 600; color: ${strengthColors[strength]};">${strengthText}</span>
                    </div>
                    ${feedback.length > 0 ? `<div style="color: #666; font-size: 0.8rem;">Needs: ${feedback.join(', ')}</div>` : ''}
                </div>
            `;
        });
    }

    // Handle login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate inputs
        if (!username || !password) {
            showLoginMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Add loading state
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        loginBtn.disabled = true;
        
        // Simulate network delay
        setTimeout(() => {
            // Check credentials and automatically detect account type
            const loginResult = validateLogin(username, password);
            
            if (loginResult.valid) {
                // Store login info in sessionStorage
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('accountType', loginResult.accountType);
                
                // Store additional user info if available
                const user = getUserInfo(username, loginResult.accountType);
                if (user) {
                    if (user.email) sessionStorage.setItem('userEmail', user.email);
                    if (user.phone) sessionStorage.setItem('userPhone', user.phone);
                }
                
                // Store login timestamp
                sessionStorage.setItem('loginTime', new Date().toISOString());
                
                showLoginMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to main page
                setTimeout(() => {
                    window.location.href = 'web.html';
                }, 1500);
            } else {
                showLoginMessage('Invalid username or password', 'error');
                // Reset button
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1000);
    });

    // Handle registration form submission
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        // Validate inputs
        if (!username || !password || !confirmPassword || !email) {
            showLoginMessage('Please fill in all required fields', 'error');
            return;
        }

        if (username.length < 3) {
            showLoginMessage('Username must be at least 3 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showLoginMessage('Passwords do not match', 'error');
            return;
        }
        
        const { strength } = checkPasswordStrength(password);
        if (strength < 2) {
            showLoginMessage('Password is too weak. Please choose a stronger password.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showLoginMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (phone && !isValidPhone(phone)) {
            showLoginMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Check if username already exists
        if (isUsernameTaken(username)) {
            showLoginMessage('Username already exists', 'error');
            return;
        }
        
        // Add loading state
        const registerBtn = document.querySelector('#register-form .login-btn');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        registerBtn.disabled = true;
        
        // Simulate network delay
        setTimeout(() => {
            // Create new account with default account type 'retail'
            createNewAccount(username, password, email, phone, 'retail');
            
            showLoginMessage('Account created successfully! You can now login.', 'success');
            
            // Switch back to login form after delay
            setTimeout(() => {
                document.getElementById('create-account-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('create-account-section').style.display = 'block';
                
                // Clear registration form
                clearRegistrationForm();
                
                // Reset button
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            }, 2000);
        }, 1000);
    });

    // Handle wholesale account request submission
    document.getElementById('wholesale-request-form-data').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const businessName = document.getElementById('business-name').value.trim();
        const contactName = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('wholesale-email').value.trim();
        const phone = document.getElementById('wholesale-phone').value.trim();
        const businessAddress = document.getElementById('business-address').value.trim();
        const businessType = document.getElementById('business-type').value;
        const taxId = document.getElementById('tax-id').value.trim();
        const expectedVolume = document.getElementById('expected-volume').value;
        const additionalInfo = document.getElementById('additional-info').value.trim();
        
        // Validate required fields
        if (!businessName || !contactName || !email || !phone || !businessType) {
            showLoginMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showLoginMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showLoginMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Add loading state
        const submitBtn = document.querySelector('#wholesale-request-form-data .login-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Request...';
        submitBtn.disabled = true;
        
        // Simulate network delay
        setTimeout(() => {
            // Send wholesale account request email
            sendWholesaleRequestEmail({
                businessName,
                contactName,
                email,
                phone,
                businessAddress,
                businessType,
                taxId,
                expectedVolume,
                additionalInfo,
                requestDate: new Date().toISOString()
            });
            
            showLoginMessage('Wholesale account request submitted successfully! We will contact you within 2 business days.', 'success');
            
            // Switch back to login form after delay
            setTimeout(() => {
                document.getElementById('wholesale-request-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('create-account-section').style.display = 'block';
                
                // Clear wholesale request form
                clearWholesaleRequestForm();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        }, 1000);
    });

    // Forgot password functionality
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        
        let username = document.getElementById('username').value;
        if (!username) {
            username = prompt('Please enter your username:');
            if (!username) return;
        }

        // Check if username exists
        const userExists = isUsernameTaken(username);

        if (userExists) {
            showLoginMessage('Password reset instructions have been sent to your registered email.', 'success');
        } else {
            showLoginMessage('No account found with that username.', 'error');
        }
    });

    // Enter key support
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }
    });

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }
    });
});

// Helper functions
function validateLogin(username, password) {
    const hashedPassword = hashPassword(password);
    
    // Check predefined credentials in both retail and wholesale
    for (const accountType in validCredentials) {
        const users = validCredentials[accountType];
        const match = users.find(user => 
            user.username === username && hashPassword(user.password) === hashedPassword
        );
        
        if (match) {
            return { valid: true, accountType: accountType };
        }
    }
    
    // Check created accounts
    const createdAccounts = JSON.parse(localStorage.getItem('createdAccounts')) || [];
    const createdMatch = createdAccounts.find(account => 
        account.username === username && account.password === hashedPassword
    );
    
    if (createdMatch) {
        return { valid: true, accountType: createdMatch.accountType };
    }
    
    return { valid: false, accountType: null };
}

function getUserInfo(username, accountType) {
    // Check predefined users first
    const predefinedUsers = validCredentials[accountType] || [];
    let user = predefinedUsers.find(u => u.username === username);
    
    if (user) return user;
    
    // Check created accounts
    const createdAccounts = JSON.parse(localStorage.getItem('createdAccounts')) || [];
    user = createdAccounts.find(acc => acc.username === username);
    
    return user;
}

function isUsernameTaken(username) {
    // Check predefined credentials
    for (const type in validCredentials) {
        if (validCredentials[type].some(user => user.username === username)) {
            return true;
        }
    }
    
    // Check created accounts
    const createdAccounts = JSON.parse(localStorage.getItem('createdAccounts')) || [];
    return createdAccounts.some(account => account.username === username);
}

function createNewAccount(username, password, email, phone, accountType) {
    const newAccount = {
        username: username,
        password: hashPassword(password), // Store hashed password
        email: email,
        phone: phone,
        accountType: accountType,
        created: new Date().toISOString(),
        lastLogin: null
    };
    
    const createdAccounts = JSON.parse(localStorage.getItem('createdAccounts')) || [];
    createdAccounts.push(newAccount);
    localStorage.setItem('createdAccounts', JSON.stringify(createdAccounts));
    
    // Log account creation
    console.log('New account created:', { username, email, accountType });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function showLoginMessage(message, type) {
    // Remove any existing messages
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `login-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.insertBefore(messageDiv, loginCard.firstChild);
    }

    // Auto-remove success messages after delay
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

function getMessageIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

function clearLoginMessages() {
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

function clearRegistrationForm() {
    document.getElementById('register-form').reset();
    document.getElementById('password-strength').innerHTML = '';
}

function clearWholesaleRequestForm() {
    document.getElementById('wholesale-request-form-data').reset();
}

// Wholesale Request Email Function
async function sendWholesaleRequestEmail(requestData) {
    try {
        console.log('🔄 Preparing wholesale request email');
        
        // Format the email content
        const emailContent = `
New Wholesale Account Request Received

Business Details:
• Business Name: ${requestData.businessName}
• Contact Person: ${requestData.contactName}
• Email: ${requestData.email}
• Phone: ${requestData.phone}
• Business Type: ${requestData.businessType}
• Tax ID: ${requestData.taxId || 'Not provided'}
• Expected Monthly Volume: ${requestData.expectedVolume || 'Not specified'}

Business Address:
${requestData.businessAddress || 'Not provided'}

Additional Information:
${requestData.additionalInfo || 'No additional information provided'}

Request Submitted: ${new Date(requestData.requestDate).toLocaleString()}

Please review this wholesale account request and contact the business within 2 business days.
        `;

        // Email data for EmailJS
        const emailData = {
            to_email: 'balloonfiesta824@gmail.com', // Your email address
            from_name: 'Balloons Fiesta Website',
            reply_to: requestData.email,
            subject: `New Wholesale Account Request - ${requestData.businessName}`,
            message: emailContent,
            business_name: requestData.businessName,
            contact_name: requestData.contactName,
            contact_email: requestData.email,
            contact_phone: requestData.phone,
            business_type: requestData.businessType,
            request_date: new Date().toLocaleDateString()
        };

        console.log('📧 Sending wholesale request email');
        console.log('📋 Email data:', emailData);
        
        // Send email using EmailJS
        if (window.emailjs) {
            const result = await emailjs.send('service_61xskrn', 'template_bda3cl2', emailData);
            console.log('✅ Wholesale request email sent successfully!', result);
        } else {
            console.log('📝 Wholesale request (EmailJS not available):', emailContent);
            // Fallback: Store in localStorage for manual review
            const wholesaleRequests = JSON.parse(localStorage.getItem('wholesaleRequests')) || [];
            wholesaleRequests.push({
                ...requestData,
                id: 'REQ-' + Date.now(),
                status: 'pending'
            });
            localStorage.setItem('wholesaleRequests', JSON.stringify(wholesaleRequests));
        }
        
    } catch (error) {
        console.error('❌ Wholesale request email failed:', error);
        // Fallback: Store in localStorage for manual review
        const wholesaleRequests = JSON.parse(localStorage.getItem('wholesaleRequests')) || [];
        wholesaleRequests.push({
            ...requestData,
            id: 'REQ-' + Date.now(),
            status: 'pending'
        });
        localStorage.setItem('wholesaleRequests', JSON.stringify(wholesaleRequests));
    }
}

    document.getElementById('wholesale-request-form-data').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const businessName = document.getElementById('business-name').value.trim();
        const contactName = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('wholesale-email').value.trim();
        const phone = document.getElementById('wholesale-phone').value.trim();
        const businessAddress = document.getElementById('business-address').value.trim();
        const businessType = document.getElementById('business-type').value;
        const taxId = document.getElementById('tax-id').value.trim();
        const expectedVolume = document.getElementById('expected-volume').value;
        const additionalInfo = document.getElementById('additional-info').value.trim();
        
        // Validate required fields
        if (!businessName || !contactName || !email || !phone || !businessType || !taxId || !expectedVolume || !businessAddress) {
            showLoginMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showLoginMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showLoginMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Validate Tax ID format (basic validation)
        if (taxId.length < 3) {
            showLoginMessage('Please enter a valid Tax ID or Business Number (minimum 3 characters)', 'error');
            return;
        }
        
        // Add loading state
        const submitBtn = document.querySelector('#wholesale-request-form-data .login-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Request...';
        submitBtn.disabled = true;
        
        // Simulate network delay
        setTimeout(() => {
            // Send wholesale account request email
            sendWholesaleRequestEmail({
                businessName,
                contactName,
                email,
                phone,
                businessAddress,
                businessType,
                taxId,
                expectedVolume,
                additionalInfo,
                requestDate: new Date().toISOString()
            });
            
            showLoginMessage('Wholesale account request submitted successfully! We will contact you within 2 business days.', 'success');
            
            // Switch back to login form after delay
            setTimeout(() => {
                document.getElementById('wholesale-request-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'block';
                document.getElementById('create-account-section').style.display = 'block';
                
                // Clear wholesale request form
                clearWholesaleRequestForm();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        }, 1000);
    });
    // Add this to the DOMContentLoaded event listener in login.js
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Add password toggle functionality
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
                this.setAttribute('aria-label', 'Hide password');
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
                this.setAttribute('aria-label', 'Show password');
            }
            
            // Refocus on the input field
            passwordInput.focus();
        });
    });
    
    // ... rest of existing code ...
});

// Also add this helper function if you want to allow keyboard shortcuts
function toggleAllPasswords() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.click();
    });
}