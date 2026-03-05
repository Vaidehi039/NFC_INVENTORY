# 📦 NFC Inventory Pro - Project Setup Guide

To run this project in VS Code without any errors, follow these simple steps:

### 1️⃣ Open in VS Code
1. Open **VS Code**.
2. Go to `File > Open Folder`.
3. Select the `f:\NFC_Inventory` folder.

### 2️⃣ Python Backend Setup
1. Open a new Terminal in VS Code.
2. Type: `cd nfc-inventory-server`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Make sure your **XAMPP MySQL** is running.

### 3️⃣ Frontend Setup
1. Open another Terminal tab.
2. Type: `cd nfc-inventory-web`
3. Install dependencies:
   ```bash
   npm install
   ```

### 4️⃣ One-Click Start 🚀
Double-click the **`start_project.bat`** file in the root directory. This will automatically:
* **Update Network Configuration**: Detects your local IP and fixes all links.
* Initialize your MySQL database.
* Start the Backend (Port 3000).
* Start the Frontend (Port 5173).
* Start the Mobile Gateway (Port 8081).

### 🌐 Running on any IP (Network Access)
This project is built to be "Network Ready". When you run `start_project.bat`, it automatically:
1. Detects your computer's **Local IP Address**.
2. Updates `nfc-inventory-mobile\src\api.ts` so your phone can connect.
3. Updates `nfc-inventory-web\vite.config.ts` for the web proxy.

**To use your phone:**
1. Ensure your phone and computer are on the **same Wi-Fi**.
2. Run `start_project.bat`.
3. Scan the QR code shown in the **Nfc Mobile Gateway** terminal.

---
**💡 Pro Tip**: If you see a "Module Not Found" error, just run `pip install pymysql fastapi uvicorn sqlalchemy` again in the server folder.
