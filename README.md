# IOU Tracker

A lightweight, offline-first Progressive Web App (PWA) for tracking money you owe and money owed to you. This application is built with vanilla JavaScript, offering a simple, framework-free solution for managing personal debts.

## 🚀 Features

* **Offline-First**: The app is fully functional offline after the initial load, thanks to its service worker integration.
* **Privacy-Focused**: All data is stored locally on your device, ensuring your financial information remains private.
* **Progressive Web App**: You can install it on your device like a native application for easy access.
* **Contact Integration**: The app can pick contacts directly from your phone (Android).
* **Full CRUD Operations**: It allows you to create, read, update, and delete all your financial records.
* **Payment Tracking**: You can record partial payments with custom dates to keep your balances accurate.
* **Statistics Dashboard**: Visual charts and net balance calculations provide a clear overview of your finances.
* **Import/Export**: You can back up and restore your data using JSON files.
* **Auto-Updates**: The app automatically notifies you when a new version is available.

## 🛠️ Installation

You can install the IOU Tracker by following these methods:

### Method 1: Use Hosted Version (Recommended)

1.  Visit the [demo link](https://masked-kunsiquat.github.io/iou/) on your Android phone.
2.  Tap the menu (⋮) and select "Add to Home screen".
3.  Name it "IOU Tracker" and tap "Add".
4.  Launch the app from your home screen.

### Method 2: Self-Host

1.  Clone this repository.
2.  Serve the files using a web server.
3.  Open `http://localhost:8000` in your browser.

## 🔧 Technical Details

### File Structure

The project is organized into several directories to separate concerns:

* `core/`: Contains the main application logic, state management, and constants.
* `features/`: Includes modules for specific functionalities like transactions, statistics, and data import/export.
* `ui/`: Manages the user interface, including modals, navigation, and rendering.
* `index.html`: The main HTML file for the application.
* `styles.css`: Contains all the styles for the app.
* `db.js`: A wrapper for IndexedDB with a fallback to localStorage.
* `service-worker.js`: Handles caching for offline use.
* `manifest.json`: The PWA configuration file.

### Technologies Used

* **Frontend**: Vanilla JavaScript (ES2023)
* **Styling**: Custom utility CSS (Tailwind-inspired)
* **Charts**: Chart.js (via CDN)
* **Storage**: IndexedDB with localStorage fallback
* **PWA**: Service Worker + Web App Manifest

## 📝 License

This project is open source and available under the MIT License.
