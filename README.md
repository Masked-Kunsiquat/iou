# IOU Tracker

A lightweight, offline-first Progressive Web App (PWA) for tracking money you owe and money owed to you. Built with vanilla JavaScript, no frameworks, no servers, no build tools - just pure simplicity.

## 🚀 Features

- **Offline-First**: Works completely offline after first load
- **Privacy-Focused**: All data stored locally on your device
- **Progressive Web App**: Install it like a native app
- **Contact Integration**: Pick contacts directly from your phone (Android)
- **Full CRUD Operations**: Create, read, update, and delete all records
- **Payment Tracking**: Record partial payments with custom dates
- **Statistics Dashboard**: Visual charts and net balance calculations
- **Import/Export**: Backup and restore your data as JSON
- **Auto-Updates**: Automatically notifies when new versions are available

## 📱 Demo

Try it now: [https://masked-kunsiquat.github.io/iou/](https://masked-kunsiquat.github.io/iou/)

## 🛠️ Installation

### Method 1: Use Hosted Version (Recommended)
1. Visit the demo link on your Android phone
2. Tap the menu (⋮) → "Add to Home screen"
3. Name it "IOU Tracker" and tap Add
4. Launch from your home screen!

### Method 2: Self-Host
1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/iou.git
   ```
2. Serve the files using any web server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

## 💾 Data Storage

- **Primary Storage**: IndexedDB (reliable, persistent)
- **Fallback**: localStorage (if IndexedDB unavailable)
- **Data Privacy**: All data stays on your device
- **No Cloud Sync**: Each device maintains its own data
- **Manual Backup**: Use Export/Import for data transfer

## 📋 Core Features

### People Management
- Add contacts manually or pick from phone contacts
- Unique ID generation using SHA-256(name + last 4 digits)
- Edit/delete functionality with transaction protection

### Transaction Types
- **IOU (I Owe You)**: Money you need to pay others
- **UOM (You Owe Me)**: Money others need to pay you

### Payment Tracking
- Record partial payments
- Custom payment dates
- Payment history with notes
- Automatic status updates (Paid/Pending/Overdue)

### Statistics
- Net balance calculation
- Overdue transaction counts
- Monthly cash flow chart
- Total amounts by type

## 🔧 Technical Details

### Files Structure
```
iou-tracker/
├── index.html          # Main HTML shell
├── styles.css          # Utility classes & layout
├── db.js              # IndexedDB/localStorage wrapper
├── contact-helper.js   # Contact picker + SHA-256
├── app.js             # Core app logic & UI
├── service-worker.js   # Offline caching
└── manifest.json      # PWA configuration
```

### Technologies Used
- **Frontend**: Vanilla JavaScript (ES2023)
- **Styling**: Custom utility CSS (Tailwind-inspired)
- **Charts**: Chart.js (via CDN)
- **Storage**: IndexedDB with localStorage fallback
- **PWA**: Service Worker + Web App Manifest

### Browser Requirements
- Modern browsers with ES2023 support
- IndexedDB support (fallback available)
- Service Worker support for offline mode
- Contact Picker API (Android only)

## 🔄 Updates

The app automatically checks for updates when opened. When a new version is available:
1. You'll see a notification prompt
2. Click "Reload to update"
3. Your data is preserved across updates

## 📱 Privacy & Security

- **No Server**: Runs entirely in your browser
- **No Tracking**: Zero analytics or telemetry
- **No Network Requests**: Except initial Chart.js CDN load
- **Local Storage Only**: Data never leaves your device
- **Open Source**: Audit the code yourself

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Enhancements

- [ ] Biometric authentication
- [ ] Multi-currency support
- [ ] Recurring transactions
- [ ] Transaction categories
- [ ] Data sync between devices
- [ ] Export to CSV/PDF
- [ ] Dark mode

## 🐛 Known Issues

- Contact Picker API only works on Android devices
- Clearing browser data will delete all IOUs (always backup!)
- No data sync between different browsers on same device

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Fork and submit a PR
- Star the repo if you find it useful!

---

Built with ❤️ for anyone tired of forgetting who owes what