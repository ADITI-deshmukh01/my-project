// CampusPlacement Portal Frontend Application
class CampusPlacementApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    // Authentication Methods
    async checkAuthStatus() {
        if (this.token) {
            try {
                const response = await this.apiCall('GET', '/auth/me');
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.showUserMenu();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await this.apiCall('POST', '/auth/login', {
                email,
                password
            });

            if (response.success) {
                this.token = response.data.token;
                this.currentUser = response.data.user;
                localStorage.setItem('token', this.token);
                this.showUserMenu();
                this.closeModal('login-modal');
                this.showNotification('Login successful!', 'success');
                this.loadDashboardData();
            } else {
                this.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = {
            firstName: document.getElementById('register-firstName').value,
            lastName: document.getElementById('register-lastName').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value,
            role: document.getElementById('register-role').value
        };

        // Add student-specific fields if role is student
        if (formData.role === 'student') {
            formData.studentId = document.getElementById('register-studentId').value;
            formData.department = document.getElementById('register-department').value;
            formData.year = parseInt(document.getElementById('register-year').value);
        }

        // Validate password confirmation
        const confirmPassword = document.getElementById('register-confirmPassword').value;
        if (formData.password !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }

        try {
            const response = await this.apiCall('POST', '/auth/register', formData);

            if (response.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.closeModal('registerModal');
                this.showLoginModal();
                // Clear form
                document.getElementById('registerForm').reset();
            } else {
                this.showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        this.showAuthButtons();
        this.showNotification('Logged out successfully!', 'success');
    }

    // UI Methods
    showAuthButtons() {
        document.getElementById('auth-buttons').style.display = 'flex';
        document.getElementById('user-menu').style.display = 'none';
    }

    showUserMenu() {
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-menu').style.display = 'flex';
        document.getElementById('user-name').textContent = this.currentUser.firstName;
    }

    showLoginModal() {
        console.log('Opening login modal...');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (loginModal) {
            loginModal.classList.add('show');
        } else {
            console.error('Login modal not found');
        }
        
        if (registerModal) {
            registerModal.classList.remove('show');
        }
    }

    showRegisterModal() {
        console.log('Opening register modal...');
        const registerModal = document.getElementById('registerModal');
        const loginModal = document.getElementById('loginModal');
        
        if (registerModal) {
            registerModal.classList.add('show');
        } else {
            console.error('Register modal not found');
        }
        
        if (loginModal) {
            loginModal.classList.remove('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    toggleStudentFields() {
        const role = document.getElementById('register-role').value;
        const studentFields = document.getElementById('student-fields');
        const studentFieldsRow = document.getElementById('student-fields-row');
        
        if (role === 'student') {
            studentFields.style.display = 'block';
            studentFieldsRow.style.display = 'flex';
            // Make fields required
            document.getElementById('register-studentId').required = true;
            document.getElementById('register-department').required = true;
            document.getElementById('register-year').required = true;
        } else {
            studentFields.style.display = 'none';
            studentFieldsRow.style.display = 'none';
            // Remove required attribute
            document.getElementById('register-studentId').required = false;
            document.getElementById('register-department').required = false;
            document.getElementById('register-year').required = false;
        }
    }

    // Chatbot Methods
    toggleChatbot() {
        const chatbotContainer = document.getElementById('chatbotContainer');
        const isExpanded = chatbotContainer.classList.contains('expanded');
        
        if (isExpanded) {
            chatbotContainer.classList.remove('expanded');
        } else {
            chatbotContainer.classList.add('expanded');
            // Focus on input when opened
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    chatInput.focus();
                }
            }, 300);
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        input.value = '';

        // Show typing indicator
        this.addTypingIndicator();

        try {
            const response = await this.apiCall('POST', '/chatbot/chat', {
                message: message,
                context: 'general',
                userId: this.currentUser?._id
            });

            if (response.success) {
                // Remove typing indicator and add bot response
                this.removeTypingIndicator();
                this.addMessageToChat('bot', response.data.message);
            } else {
                this.removeTypingIndicator();
                this.addMessageToChat('bot', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.removeTypingIndicator();
            this.addMessageToChat('bot', 'Sorry, I\'m having trouble connecting. Please try again later.');
        }
    }

    addMessageToChat(sender, content) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (typeof content === 'string') {
            messageContent.innerHTML = `<p>${content}</p>`;
        } else {
            messageContent.innerHTML = content;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Dashboard Data Loading
    async loadDashboardData() {
        try {
            // Load placement statistics
            const placementResponse = await this.apiCall('GET', '/placements/stats/overview');
            if (placementResponse.success) {
                this.updateDashboardStats(placementResponse.data);
            }

            // Load training statistics
            const trainingResponse = await this.apiCall('GET', '/training/featured/list');
            if (trainingResponse.success) {
                this.updateFeaturedTrainings(trainingResponse.data.trainings);
            }

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboardStats(data) {
        const stats = data.overview;
        if (stats) {
            // Update KPI numbers with animation
            this.animateNumber('hiring-partners', stats.totalPlacements || 120);
            this.animateNumber('practice-sets', stats.totalOffers || 500);
            this.animateNumber('interview-ready', Math.round((stats.totalAccepted / (stats.totalPlacements || 1)) * 100) || 95);
            this.animateNumber('students-supported', stats.totalPlacements * 250 || 30000);
        }
    }

    updateFeaturedTrainings(trainings) {
        // This would update featured training cards if they exist
        console.log('Featured trainings loaded:', trainings);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentText = element.textContent;
        const currentValue = parseInt(currentText.replace(/\D/g, '')) || 0;
        const increment = (targetValue - currentValue) / 50;
        let current = currentValue;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                clearInterval(timer);
            }
            
            const suffix = currentText.includes('+') ? '+' : 
                          currentText.includes('%') ? '%' : 
                          currentText.includes('K') ? 'K' : '';
            
            element.textContent = Math.round(current) + suffix;
        }, 20);
    }

    // API Helper Methods
    async apiCall(method, endpoint, data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'API request failed');
            }
            
            return result;
        } catch (error) {
            console.error(`API ${method} ${endpoint} failed:`, error);
            throw error;
        }
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        // Enter key in chat input
        document.getElementById('chat-input')?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CampusPlacementApp();
});

// Global functions for HTML onclick handlers
function showLoginModal() {
    window.app.showLoginModal();
}

function showRegisterModal() {
    window.app.showRegisterModal();
}

function closeModal(modalId) {
    window.app.closeModal(modalId);
}

function toggleStudentFields() {
    window.app.toggleStudentFields();
}

function toggleChatbot() {
    window.app.toggleChatbot();
}

function sendMessage() {
    window.app.sendMessage();
}

function logout() {
    window.app.logout();
}

function handleLogin(event) {
    window.app.handleLogin(event);
}

function handleRegister(event) {
    window.app.handleRegister(event);
}
