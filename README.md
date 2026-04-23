# SubTracker Admin Dashboard

Administrative dashboard for managing all user subscriptions with real-time analytics and automatic currency conversion.

![Admin Dashboard](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Firebase](https://img.shields.io/badge/Firebase-Realtime-orange)

## Features

- Secure admin login (admin/admin123)
- Real-time dashboard with live statistics
- Auto-detects admin's location and converts all currencies to local currency
- View all subscriptions from all users in one table
- **Yearly Revenue** calculation alongside monthly revenue
- Analytics charts (Category distribution, Billing cycle breakdown, Revenue trend, Status distribution)
- Search and filter subscriptions
- Export data to CSV
- Fully mobile responsive with collapsible sidebar
- Real-time sync with SubTracker app

## What's New

| Feature | Description |
|---------|-------------|
| Yearly Revenue | Annual recurring revenue calculation |
| Location Detection | Auto-detects admin country and converts all currencies |
| Real-time Sync | Live updates from SubTracker app |
| Mobile Responsive | Works on all devices with touch-friendly design |
| Export to CSV | Download subscription data for reporting |

## Try Live

**[Try Admin Dashboard](https://subtracker-admin.vercel.app)**


## How to Use

1. Open the Admin Dashboard
2. Login with credentials above
3. View real-time statistics on the Dashboard
4. Browse all subscriptions in the Subscriptions tab
5. Analyze trends in the Analytics tab
6. Export data to CSV for reporting

## Currency Conversion

The admin dashboard automatically:
1. Detects your location from IP address
2. Fetches real-time exchange rates
3. Converts all subscription prices to your local currency
4. Shows consistent pricing across all user subscriptions

**Example:** If you're in Kenya, all prices show as KSh. If you're in the US, all prices show as USD.

## Statistics Displayed

| Statistic | Description |
|-----------|-------------|
| Total Subscriptions | Count of all subscriptions across all users |
| Monthly Revenue | Total monthly recurring revenue (converted to admin's currency) |
| Yearly Revenue | Total yearly recurring revenue (converted to admin's currency) |
| Due This Week | Subscriptions expiring in the next 7 days |

## Analytics Charts

| Chart | Description |
|-------|-------------|
| Category Distribution | Bar chart showing popular subscription categories |
| Billing Cycle Breakdown | Pie chart of weekly/monthly/quarterly/yearly |
| Revenue Trend | Line chart showing monthly revenue over time |
| Status Distribution | Doughnut chart of active/cancelled/paused |

## Supported Currencies

| Code | Currency | Symbol |
|:----:|:---------|:------:|
| USD | US Dollar | $ |
| KES | Kenyan Shilling | KSh |
| EUR | Euro | € |
| GBP | British Pound | £ |
| NGN | Nigerian Naira | ₦ |
| ZAR | South African Rand | R |
| INR | Indian Rupee | ₹ |
| CAD | Canadian Dollar | C$ |
| AUD | Australian Dollar | A$ |
| JPY | Japanese Yen | ¥ |

## Browser Support

| Browser | Support |
|:--------|:-------:|
| Chrome | ✅ Yes |
| Firefox | ✅ Yes |
| Safari | ✅ Yes |
| Edge | ✅ Yes |
| Opera | ✅ Yes |
| Mobile Chrome | ✅ Yes |
| Mobile Safari | ✅ Yes |

## Technologies Used

- HTML5
- CSS3 (Flexbox, Grid, Media Queries)
- Vanilla JavaScript (ES6+)
- Firebase Firestore (Real-time database)
- Chart.js (Analytics charts)
- ExchangeRate-API (Currency conversion)

## Mobile Responsive

The admin dashboard is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px-1024px)
- Mobile Landscape (480px-768px)
- Mobile Portrait (320px-480px)

**Mobile Features:**
- Collapsible sidebar with hamburger menu
- Touch-friendly buttons and cards
- Responsive stats grid (4 → 2 → 1 columns)
- Horizontal scrollable tables
- Optimized font sizes

## Installation
```bash
git clone https://github.com/David-Kimath1/subtracker-admin.git
cd subtracker-admin
Open index.html in your browser
```

# Connecting to SubTracker
The admin dashboard automatically syncs with the same Firebase database as the SubTracker app. No additional configuration needed!

Both apps use the same Firebase configuration.

## Author
# David Kimathi

GitHub: https://github.com/David-Kimath1
Project: https://github.com/David-Kimath1/subtracker-admin

# Contributing
Contributions are welcome! Feel free to:

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

## License
This project is licensed under the MIT License.

## Acknowledgments
Icons by FontAwesome

Font by Google Fonts

Firebase for real-time database

Chart.js for beautiful charts

ExchangeRate-API for currency conversion

## Support
If you find this useful, please give it a ⭐ on GitHub!

Found a bug? Open an issue

# Made with Lots of Love ❤️ by David Kimathi
