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

let subscriptions = [];
let charts = {};
let adminCurrency = 'USD';
let adminSymbol = '$';
let exchangeRates = {};

// Currency symbols (complete list)
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

// Category colors (matching your SubTracker palette)
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

// Chart color palette (your 8 colors)
const chartColors = ['#e94560', '#48dbfb', '#2ecc71', '#FF9A86', '#a29bfe', '#FFF0BE', '#f39c12', '#B6F500'];

// Detect admin's location and get exchange rates
async function detectAdminLocation() {
    console.log("Detecting admin location...");
    
    try {
        // Get country from IP
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        const countryCode = ipData.country_code;
        
        adminCurrency = countryCurrency[countryCode] || 'USD';
        adminSymbol = symbols[adminCurrency] || '$';
        
        console.log(`Detected: ${countryCode} → Currency: ${adminCurrency} (${adminSymbol})`);
        
        // Get exchange rates
        await getExchangeRates();
        
    } catch (error) {
        console.error("Location detection failed, using USD:", error);
        adminCurrency = 'USD';
        adminSymbol = '$';
        await getExchangeRates();
    }
}

// Get real-time exchange rates
async function getExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = data.rates;
        console.log("Exchange rates loaded for", Object.keys(exchangeRates).length, "currencies");
    } catch (error) {
        console.error("Failed to get exchange rates:", error);
        // Fallback rates
        exchangeRates = { 
            USD: 1, KES: 130, EUR: 0.92, GBP: 0.79, 
            NGN: 1500, ZAR: 19, INR: 83, CAD: 1.35,
            AUD: 1.5, JPY: 150, CNY: 7.2, CHF: 0.85,
            SEK: 10.5, NZD: 1.65, SGD: 1.35, MXN: 17
        };
    }
}

// Convert price to admin's currency
function convertToAdminCurrency(price, fromCurrency) {
    if (!price || price === 0) return 0;
    if (!fromCurrency || fromCurrency === adminCurrency) return price;
    
    // Get rate: convert fromCurrency → USD → adminCurrency
    const toUSD = exchangeRates[fromCurrency] ? 1 / exchangeRates[fromCurrency] : 1;
    const fromUSD = price * toUSD;
    const toAdmin = fromUSD * (exchangeRates[adminCurrency] || 1);
    
    return toAdmin;
}

// Login credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Login handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Show loading message
            const loginBtn = loginForm.querySelector('button');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Detecting location...';
            loginBtn.disabled = true;
            
            // Detect location before showing dashboard
            await detectAdminLocation();
            
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            
            sessionStorage.setItem('admin_logged_in', 'true');
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            document.getElementById('adminName').textContent = username;
            
            // Update currency display in header
            const headerTitle = document.querySelector('.logo');
            if (headerTitle && !document.querySelector('.currency-badge')) {
                const currencyBadge = document.createElement('span');
                currencyBadge.className = 'currency-badge';
                currencyBadge.style.cssText = 'background:#3b82f6; padding:4px 8px; border-radius:20px; font-size:11px; margin-left:10px;';
                currencyBadge.textContent = `${adminSymbol} ${adminCurrency}`;
                headerTitle.appendChild(currencyBadge);
            }
            
            initAdminDashboard();
        } else {
            alert('Invalid credentials! Use admin / admin123');
        }
    });
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        location.reload();
    });
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        document.getElementById(`${page}Page`).classList.add('active');
        
        if (page === 'analytics') {
            setTimeout(() => {
                updateRevenueChart();
                updateStatusChart();
            }, 100);
        }
    });
});

function initAdminDashboard() {
    setupRealtimeListener();
    const searchSubs = document.getElementById('searchSubs');
    if (searchSubs) searchSubs.addEventListener('input', renderSubscriptionsTable);
    
    const exportBtn = document.getElementById('exportCSVBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
}

// Real-time listener
function setupRealtimeListener() {
    db.collection('subscriptions').onSnapshot((snapshot) => {
        subscriptions = [];
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
                color: categoryColors[data.category] || data.color || '#e94560'
            });
        });
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

function updateStats() {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active');
    
    // Calculate monthly revenue (converted to admin currency)
    let monthlyRevenue = 0;
    // Calculate yearly revenue (converted to admin currency)
    let yearlyRevenue = 0;
    
    active.forEach(sub => {
        let price = sub.convertedPrice;
        
        // Calculate monthly contribution
        let monthlyPrice = price;
        if (sub.billingCycle === 'weekly') monthlyPrice = price * 4.33;
        else if (sub.billingCycle === 'quarterly') monthlyPrice = price / 3;
        else if (sub.billingCycle === 'yearly') monthlyPrice = price / 12;
        monthlyRevenue += monthlyPrice;
        
        // Calculate yearly contribution
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

    // Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});
    
    const totalSubsEl = document.getElementById('totalSubs');
    const monthlyRevenueEl = document.getElementById('monthlyRevenue');
    const yearlyRevenueEl = document.getElementById('yearlyRevenue');
    const dueThisWeekEl = document.getElementById('dueThisWeek');
    
    if (totalSubsEl) totalSubsEl.textContent = total;
    if (monthlyRevenueEl) monthlyRevenueEl.textContent = `${adminSymbol} ${monthlyRevenue.toFixed(2)}`;
    if (yearlyRevenueEl) yearlyRevenueEl.textContent = `${adminSymbol} ${yearlyRevenue.toFixed(2)}`;
    if (dueThisWeekEl) dueThisWeekEl.textContent = dueThisWeek;
}

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
                <td><strong>${escapeHtml(sub.name)}</strong></td>
                <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${categoryColors[sub.category] || '#e94560'}; margin-right:8px;"></span>${escapeHtml(sub.category)}</td>
                <td>${adminSymbol} ${sub.convertedPrice.toFixed(2)}${originalDisplay}</td>
                <td>${sub.billingCycle}</td>
                <td>${sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
            </tr>
        `;
    }).join('');
}

function updateCategoryChart() {
    const categoryCount = {};
    subscriptions.forEach(sub => {
        const cat = sub.category || 'Other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;
    
    // Use your color palette for categories
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
            plugins: {
                legend: { position: 'top' }
            }
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
            plugins: {
                legend: { position: 'bottom' }
            }
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
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function exportToCSV() {
    const headers = ['Service', 'Category', 'Original Price', 'Original Currency', 'Converted Price', 'Converted Currency', 'Billing Cycle', 'Next Billing', 'Status'];
    const rows = subscriptions.map(sub => [
        sub.name, 
        sub.category, 
        sub.originalPrice, 
        sub.currency, 
        sub.convertedPrice.toFixed(2), 
        adminCurrency,
        sub.billingCycle, 
        sub.nextBillingDate, 
        sub.status
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if already logged in
if (sessionStorage.getItem('admin_logged_in') === 'true') {
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    document.getElementById('adminName').textContent = 'admin';
    // Still need to detect location
    detectAdminLocation().then(() => {
        initAdminDashboard();
    });
}

css/style.css
js/script.js
vercel.json