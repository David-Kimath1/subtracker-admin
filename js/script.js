// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDd75ps84KlSHaG2iiJB46Nm3IDExOxy5g",
    authDomain: "subscriptiontracker-c2ca3.firebaseapp.com",
    projectId: "subscriptiontracker-c2ca3",
    storageBucket: "subscriptiontracker-c2ca3.firebasestorage.app",
    messagingSenderId: "765974058769",
    appId: "1:765974058769:web:143080d8088fa3244f5eb0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Set persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(error => console.error("Persistence error:", error));

let subscriptions = [];
let charts = {};
let adminCurrency = 'USD';
let adminSymbol = '$';
let exchangeRates = {};

// Admin email that has access
const ADMIN_EMAIL = 'admin@subtracker.com';

// Currency symbols
const symbols = { 
    USD: '$', KES: 'KSh', EUR: '€', GBP: '£', 
    NGN: '₦', ZAR: 'R', INR: '₹', CAD: 'C$', 
    AUD: 'A$', JPY: '¥', CNY: '¥', CHF: 'Fr',
    SEK: 'kr', NZD: 'NZ$', SGD: 'S$', MXN: '$'
};

// Country to currency mapping
const countryCurrency = {
    'KE': 'KES', 'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
    'IT': 'EUR', 'ES': 'EUR', 'NG': 'NGN', 'ZA': 'ZAR', 'IN': 'INR',
    'CA': 'CAD', 'AU': 'AUD', 'JP': 'JPY', 'CN': 'CNY', 'CH': 'CHF',
    'SE': 'SEK', 'NZ': 'NZD', 'SG': 'SGD', 'MX': 'MXN'
};

// Category colors
const categoryColors = {
    entertainment: '#e94560',
    music: '#48dbfb',
    productivity: '#2ecc71',
    cloud: '#FF9A86',
    fitness: '#a29bfe',
    gaming: '#FFF0BE',
    education: '#f39c12',
    news: '#B6F500',
    shopping: '#e94560',
    food: '#48dbfb',
    vpn: '#2ecc71',
    other: '#a29bfe'
};

const chartColors = ['#e94560', '#48dbfb', '#2ecc71', '#FF9A86', '#a29bfe', '#FFF0BE', '#f39c12', '#B6F500'];

// ==================== AUTHENTICATION ====================

async function signInAdmin(email, password) {
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.querySelector('#loginForm button');
    const originalText = loginBtn.innerHTML;
    
    const originalWidth = loginBtn.offsetWidth;
    loginBtn.style.minWidth = originalWidth + 'px';
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-pulse"></i> Signing in...';
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        if (userCredential.user.email !== ADMIN_EMAIL) {
            await auth.signOut();
            throw new Error('You do not have admin privileges');
        }
        
        console.log("Admin signed in:", userCredential.user.email);
        await detectAdminLocation();
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('adminName').textContent = userCredential.user.email;
        
        initAdminDashboard();
        
    } catch (error) {
        console.error("Admin sign in error:", error);
        errorDiv.style.display = 'block';
        errorDiv.textContent = error.message || 'Invalid admin credentials';
        
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        loginBtn.style.minWidth = '';
    }
}

async function signOutAdmin() {
    try {
        await auth.signOut();
        
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                charts[key].destroy();
                charts[key] = null;
            }
        });
        
        subscriptions = [];
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginForm').reset();
        
    } catch (error) {
        console.error("Sign out error:", error);
    }
}

// ==================== LOCATION & CURRENCY ====================

async function detectAdminLocation() {
    console.log("Detecting admin location...");
    
    try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        const countryCode = ipData.country_code;
        
        adminCurrency = countryCurrency[countryCode] || 'USD';
        adminSymbol = symbols[adminCurrency] || '$';
        
        console.log(`Detected: ${countryCode} → Currency: ${adminCurrency} (${adminSymbol})`);
        
        const currencyBadge = document.getElementById('currencyBadge');
        if (currencyBadge) {
            currencyBadge.textContent = `${adminSymbol} ${adminCurrency}`;
        }
        
        await getExchangeRates();
        
    } catch (error) {
        console.error("Location detection failed, using USD:", error);
        adminCurrency = 'USD';
        adminSymbol = '$';
        await getExchangeRates();
    }
}

async function getExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = data.rates;
        console.log("Exchange rates loaded");
    } catch (error) {
        console.error("Failed to get exchange rates:", error);
        exchangeRates = { 
            USD: 1, KES: 130, EUR: 0.92, GBP: 0.79, 
            NGN: 1500, ZAR: 19, INR: 83, CAD: 1.35,
            AUD: 1.5, JPY: 150, CNY: 7.2, CHF: 0.85,
            SEK: 10.5, NZD: 1.65, SGD: 1.35, MXN: 17
        };
    }
}

function convertToAdminCurrency(price, fromCurrency) {
    if (!price || price === 0) return 0;
    if (!fromCurrency || fromCurrency === adminCurrency) return price;
    
    const toUSD = exchangeRates[fromCurrency] ? 1 / exchangeRates[fromCurrency] : 1;
    const fromUSD = price * toUSD;
    const toAdmin = fromUSD * (exchangeRates[adminCurrency] || 1);
    
    return toAdmin;
}

// ==================== REAL-TIME LISTENER ====================

function setupRealtimeListener() {
    db.collection('subscriptions').onSnapshot((snapshot) => {
        subscriptions = [];
        const uniqueUsers = new Set();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            subscriptions.push({ 
                id: doc.id, 
                name: data.name || 'Untitled',
                category: data.category || 'other',
                price: data.price || 0,
                originalPrice: data.price || 0,
                currency: data.currency || 'USD',
                convertedPrice: convertToAdminCurrency(data.price || 0, data.currency || 'USD'),
                billingCycle: data.billingCycle || 'monthly',
                nextBillingDate: data.nextBillingDate,
                status: data.status || 'active',
                userId: data.userId || 'unknown',
                userEmail: data.userEmail || 'N/A',
                color: categoryColors[data.category] || '#e94560'
            });
            
            if (data.userId) uniqueUsers.add(data.userId);
        });
        
        console.log(`Admin loaded ${subscriptions.length} subscriptions from ${uniqueUsers.size} unique users`);
        
        updateStats();
        renderSubscriptionsTable();
        updateCategoryChart();
        updateCycleChart();
        updateRevenueChart();
        updateStatusChart();
        
    }, (error) => {
        console.error('Realtime error:', error);
    });
}

// ==================== STATS ====================

function updateStats() {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active');
    const uniqueUsers = new Set(subscriptions.map(s => s.userId).filter(id => id && id !== 'unknown'));
    
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    
    active.forEach(sub => {
        let price = sub.convertedPrice;
        
        let monthlyPrice = price;
        if (sub.billingCycle === 'weekly') monthlyPrice = price * 4.33;
        else if (sub.billingCycle === 'quarterly') monthlyPrice = price / 3;
        else if (sub.billingCycle === 'yearly') monthlyPrice = price / 12;
        monthlyRevenue += monthlyPrice;
        
        let yearlyPrice = price;
        if (sub.billingCycle === 'weekly') yearlyPrice = price * 52;
        else if (sub.billingCycle === 'monthly') yearlyPrice = price * 12;
        else if (sub.billingCycle === 'quarterly') yearlyPrice = price * 4;
        else if (sub.billingCycle === 'yearly') yearlyPrice = price;
        yearlyRevenue += yearlyPrice;
    });
    
    const today = new Date();
    const dueThisWeek = subscriptions.filter(s => {
        if (s.status !== 'active') return false;
        if (!s.nextBillingDate) return false;
        const dueDate = new Date(s.nextBillingDate);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 7;
    }).length;
    
    document.getElementById('totalSubs').textContent = total;
    document.getElementById('monthlyRevenue').textContent = `${adminSymbol} ${monthlyRevenue.toFixed(2)}`;
    document.getElementById('yearlyRevenue').textContent = `${adminSymbol} ${yearlyRevenue.toFixed(2)}`;
    document.getElementById('dueThisWeek').textContent = dueThisWeek;
}

// ==================== TABLE RENDER ====================

function renderSubscriptionsTable() {
    const searchTerm = document.getElementById('searchSubs')?.value.toLowerCase() || '';
    const filtered = subscriptions.filter(s => 
        s.name?.toLowerCase().includes(searchTerm) || 
        s.category?.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('subscriptionsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = filtered.map(sub => {
        const originalDisplay = sub.currency !== adminCurrency ? 
            `<small style="color:#64748b"> (${sub.currency} ${sub.originalPrice})</small>` : '';
        
        return `
            <tr>
                <td><strong>${escapeHtml(sub.name)}</strong><br>
                    <small style="color:#64748b; font-size: 10px;">User: ${escapeHtml(sub.userEmail)}</small>
                </td>
                <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${categoryColors[sub.category] || '#e94560'}; margin-right:8px;"></span>${escapeHtml(sub.category)}</td>
                <td>${adminSymbol} ${sub.convertedPrice.toFixed(2)}${originalDisplay}</td>
                <td>${sub.billingCycle}</td>
                <td>${sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
            </tr>
        `;
    }).join('');
}

// ==================== CHARTS ====================

function updateCategoryChart() {
    const categoryCount = {};
    subscriptions.forEach(sub => {
        const cat = sub.category || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;
    
    const categoryList = Object.keys(categoryCount);
    const backgroundColors = categoryList.map((cat, index) => categoryColors[cat] || chartColors[index % chartColors.length]);
    
    if (charts.category) charts.category.destroy();
    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoryList,
            datasets: [{ 
                label: 'Number of Subscriptions', 
                data: Object.values(categoryCount), 
                backgroundColor: backgroundColors,
                borderRadius: 8
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });
}

function updateCycleChart() {
    const cycleCount = { weekly: 0, monthly: 0, quarterly: 0, yearly: 0 };
    subscriptions.forEach(sub => {
        const cycle = sub.billingCycle;
        if (cycle === 'weekly') cycleCount.weekly++;
        else if (cycle === 'monthly') cycleCount.monthly++;
        else if (cycle === 'quarterly') cycleCount.quarterly++;
        else if (cycle === 'yearly') cycleCount.yearly++;
        else cycleCount.monthly++;
    });
    
    const ctx = document.getElementById('cycleChart')?.getContext('2d');
    if (!ctx) return;
    
    if (charts.cycle) charts.cycle.destroy();
    charts.cycle = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'],
            datasets: [{ 
                data: [cycleCount.weekly, cycleCount.monthly, cycleCount.quarterly, cycleCount.yearly],
                backgroundColor: chartColors.slice(0, 4),
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateRevenueChart() {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    subscriptions.forEach(sub => {
        if (sub.status === 'active') {
            let monthlyPrice = sub.convertedPrice;
            if (sub.billingCycle === 'weekly') monthlyPrice = sub.convertedPrice * 4.33;
            else if (sub.billingCycle === 'quarterly') monthlyPrice = sub.convertedPrice / 3;
            else if (sub.billingCycle === 'yearly') monthlyPrice = sub.convertedPrice / 12;
            
            const currentMonth = months[new Date().getMonth()];
            monthlyData[currentMonth] = (monthlyData[currentMonth] || 0) + monthlyPrice;
        }
    });
    
    const chartData = months.map(month => monthlyData[month] || 0);
    
    const ctx = document.getElementById('revenueTrendChart')?.getContext('2d');
    if (!ctx) return;
    
    if (charts.revenue) charts.revenue.destroy();
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{ 
                label: `Monthly Revenue (${adminSymbol})`, 
                data: chartData, 
                borderColor: '#10b981', 
                backgroundColor: '#10b98120',
                tension: 0.4, 
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            plugins: {
                tooltip: { callbacks: { label: (ctx) => `${adminSymbol}${ctx.raw.toFixed(2)}` } }
            }
        }
    });
}

function updateStatusChart() {
    const statusCount = { active: 0, cancelled: 0, paused: 0 };
    subscriptions.forEach(sub => {
        if (sub.status === 'active') statusCount.active++;
        else if (sub.status === 'cancelled') statusCount.cancelled++;
        else if (sub.status === 'paused') statusCount.paused++;
        else statusCount.active++;
    });
    
    const ctx = document.getElementById('statusChart')?.getContext('2d');
    if (!ctx) return;
    
    if (charts.status) charts.status.destroy();
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Cancelled', 'Paused'],
            datasets: [{ 
                data: [statusCount.active, statusCount.cancelled, statusCount.paused],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ==================== EXPORT ====================

function exportToCSV() {
    const headers = ['Service', 'Category', 'Original Price', 'Original Currency', 'Converted Price', 'Converted Currency', 'Billing Cycle', 'Next Billing', 'Status', 'User ID', 'User Email'];
    const rows = subscriptions.map(sub => [
        sub.name, 
        sub.category, 
        sub.originalPrice, 
        sub.currency, 
        sub.convertedPrice.toFixed(2), 
        adminCurrency,
        sub.billingCycle, 
        sub.nextBillingDate, 
        sub.status,
        sub.userId,
        sub.userEmail
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_${adminCurrency}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== NAVIGATION ====================

function initAdminDashboard() {
    setupRealtimeListener();
    
    const searchSubs = document.getElementById('searchSubs');
    if (searchSubs) searchSubs.addEventListener('input', renderSubscriptionsTable);
    
    const exportBtn = document.getElementById('exportCSVBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const pageElement = document.getElementById(`${page}Page`);
            if (pageElement) pageElement.classList.add('active');
            
            if (page === 'analytics') {
                setTimeout(() => {
                    updateRevenueChart();
                    updateStatusChart();
                }, 100);
            }
        });
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (sidebar && !sidebar.contains(e.target) && e.target !== newBtn && !newBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
}

// ==================== HELPER ====================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== INITIALIZE ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin dashboard loaded");
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await signInAdmin(email, password);
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => signOutAdmin());
    }
    
    auth.onAuthStateChanged(async (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            await detectAdminLocation();
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            document.getElementById('adminName').textContent = user.email;
            initAdminDashboard();
        }
    });
});