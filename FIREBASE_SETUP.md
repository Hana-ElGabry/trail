# Setting Up Firebase for Sync

To enable Google Sign-In and cloud sync, you need to create a free Firebase project.

## Step 1: Create a Firebase Project
1.  Go to [console.firebase.google.com](https://console.firebase.google.com/).
2.  Click **Add project**.
3.  Name it (e.g., "My Todo App") and follow the steps (you can disable Google Analytics).

## Step 2: Enable Authentication
1.  In your project dashboard, click **Build** > **Authentication**.
2.  Click **Get Started**.
3.  Select **Google** from the Sign-in method list.
4.  Click **Enable**, select your support email, and click **Save**.

## Step 3: Enable Database
1.  Click **Build** > **Firestore Database**.
2.  Click **Create Database**.
3.  Choose a location (e.g., `eur3` or `us-central`).
4.  **IMPORTANT**: Start in **Test Mode** (this allows read/write access for 30 days, which is easiest for now).
    *   *Later you can secure it, but Test Mode is fine for a personal prototype.*

## Step 4: Get Your Config Code
1.  Click the **Project Overview** (gear icon) > **Project settings**.
2.  Scroll down to "Your apps" and click the **</>** (Web) icon.
3.  Register the app (nickname: "Todo Web").
4.  You will see a code block with `const firebaseConfig = { ... };`.
5.  **Copy the content inside the curly braces `{ ... }`**.

## Step 5: Paste into `script.js`
1.  Open `script.js` on your computer.
2.  Find the lines at the top:
    ```javascript
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY_HERE",
        ...
    };
    ```
3.  Replace that block with the code you copied from Firebase.

## Step 6: Deploy Again
1.  Run these commands in your terminal to push the changes to GitHub:
    ```bash
    git add .
    git commit -m "Add firebase auth"
    git push
    ```
