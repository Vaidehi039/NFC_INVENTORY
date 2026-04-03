# 🚀 How to Run NFC Inventory Project

Follow these steps to run the complete system (Backend, Web, and Mobile) and solve the "Module Not Found" error.

### 1️⃣ Fix the "Could not import module 'main'" Error
The error happened because the server was being started from the wrong folder or with the wrong command. I have fixed this by:
* Adding an automatic startup block to `nfc-inventory-server/main.py`.
* Updating `start_project.bat` to use the correct directory and port (**8000**).

---

### 2️⃣ The "Proper Way" to Run (Local Network)
If you are on the same Wi-Fi as your computer, just follow these steps:

1.  **Open VS Code** at the root of `f:\NFC_Inventory\NFC_Inventory`.
2.  **Run with One Click**: Double-click the **`start_project.bat`** file in the root folder.
    *   This will automatically detect your IP and start all 3 parts.
    *   **Backend**: http://localhost:8000/docs
    *   **Web Admin**: http://localhost:5173
    *   **Mobile Gateway**: Check the terminal for the QR code.

---

### 3️⃣ Using Ngrok for Global Access (Phone on Mobile Data)
If you want to use the app from anywhere (not on same Wi-Fi):

1.  **Start Ngrok**: Open a terminal and type:
    ```bash
    ngrok http 8000
    ```
2.  **Copy the URL**: Copy the `https://...ngrok-free.app` link.
3.  **Configure the Project**: Run this command in your VS Code terminal (replace with your actual link):
    ```powershell
    powershell -File update_config.ps1 -PublicUrl https://your-link.ngrok-free.app
    ```
4.  **Start normally**: Run `start_project.bat`. Now your phone will connect to the internet URL instead of your local IP.

---

### 4️⃣ Building the APK
To use **Real NFC Tags**, you MUST build an APK. Expo Go (the mobile app) does NOT support real NFC hardware.

1.  Open a terminal in `nfc-inventory-mobile`.
2.  Run the build script:
    ```batch
    ..\build_mobile_app.bat
    ```
3.  Select **Option 1** (Build Android APK).
4.  Follow the link provided at the end to download and install the APK on your phone.

---

### 📊 System Ports Legend
*   **Backend (FastAPI)**: Port 8000 (I unified this for consistency).
*   **Web (React)**: Port 5173.
*   **Mobile (Expo)**: Port 8081.

---
**💡 Troubleshooting**: If you still see module errors, run `pip install uvicorn fastapi sqlalchemy pymysql` inside the `nfc-inventory-server` folder.
