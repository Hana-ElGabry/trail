import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// TODO: Replace the following config with your own from the Firebase Console.
const firebaseConfig = {
    authDomain: "my-todo-app-9d46e.firebaseapp.com",
    projectId: "my-todo-app-9d46e",
    storageBucket: "my-todo-app-9d46e.firebasestorage.app",
    messagingSenderId: "384897406576",
    appId: "1:384897406576:web:f2a64e049f5576d0f386b5",
    measurementId: "G-K0S65PZY5Q"
};

// Initialize Firebase
let app, auth, db;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization failed. Did you update the config?", e);
}

// --- APP STATE ---
let currentUser = null;
let isGuest = false;
let tasks = [];

// --- DOM ELEMENTS ---
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const loginOverlay = document.getElementById('login-overlay');
const googleLoginBtn = document.getElementById('google-login-btn');
const guestLoginBtn = document.getElementById('guest-login-btn');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// --- AUDIO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSuccessSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
}

// --- AUTHENTICATION ---

// Listen for auth state changes
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            isGuest = false;
            showApp(user);
            subscribeToTasks(user.uid);
        } else {
            // User is signed out
            currentUser = null;
            if (!isGuest) {
                showLogin();
            }
        }
    });
}

async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error signing in:", error);
        alert("Failed to sign in: " + error.message);
    }
}

function signOutUser() {
    if (isGuest) {
        isGuest = false;
        showLogin();
        tasks = [];
        updateUI();
    } else {
        signOut(auth).catch((error) => console.error("Sign out error", error));
    }
}

function continueAsGuest() {
    isGuest = true;
    currentUser = { uid: 'guest', displayName: 'Guest', photoURL: 'https://ui-avatars.com/api/?name=Guest' };
    showApp(currentUser);
    // Load local tasks
    const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = localTasks;
    updateUI();
}

// --- UI NAVIGATION ---

function showLogin() {
    loginOverlay.style.display = 'flex';
    userProfile.style.display = 'none';
}

function showApp(user) {
    loginOverlay.style.display = 'none';
    userProfile.style.display = 'flex';
    userAvatar.src = user.photoURL || 'https://ui-avatars.com/api/?name=User';
    userName.textContent = user.displayName || 'User';
}

// --- DATA MANAGEMENT ---

let unsubscribe = null;

function subscribeToTasks(uid) {
    if (unsubscribe) unsubscribe();

    const q = query(
        collection(db, "tasks"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        tasks = [];
        snapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        updateUI();
    }, (error) => {
        console.error("Error getting tasks:", error);
        // Fallback for permission errors (e.g. if rules aren't set up)
        if (error.code === 'permission-denied') {
            alert("Please set up Firestore Security Rules to allow access.");
        }
    });
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    if (isGuest) {
        tasks.unshift({ id: Date.now().toString(), text, completed: false, createdAt: Date.now() });
        saveLocalTasks();
        updateUI();
    } else {
        try {
            await addDoc(collection(db, "tasks"), {
                uid: currentUser.uid,
                text: text,
                completed: false,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error adding task: ", e);
        }
    }
    taskInput.value = '';
}

async function toggleTask(index) {
    const task = tasks[index];
    const newStatus = !task.completed;

    if (newStatus) {
        playSuccessSound();
        confettiEffect();
    }

    if (isGuest) {
        tasks[index].completed = newStatus;
        saveLocalTasks();
        updateUI();
    } else {
        const taskRef = doc(db, "tasks", task.id);
        await updateDoc(taskRef, {
            completed: newStatus
        });
    }
}

async function deleteTask(index, element) {
    const task = tasks[index];

    element.style.animation = 'fadeOut 0.3s ease forwards';

    setTimeout(async () => {
        if (isGuest) {
            tasks.splice(index, 1);
            saveLocalTasks();
            updateUI();
        } else {
            await deleteDoc(doc(db, "tasks", task.id));
        }
    }, 300);
}

function saveLocalTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// --- UI RENDERING ---

function updateUI() {
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <button class="delete-btn">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            const checkbox = li.querySelector('input');
            checkbox.addEventListener('change', () => toggleTask(index));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(index, li));

            taskList.appendChild(li);
        });
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressFill.style.width = `${percentage}%`;
    progressLabel.textContent = `${percentage}% Done`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function confettiEffect() {
    const container = document.querySelector('.container');
    container.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
    setTimeout(() => {
        container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
    }, 300);
}

// --- EVENT LISTENERS ---
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
googleLoginBtn.addEventListener('click', signInWithGoogle);
guestLoginBtn.addEventListener('click', continueAsGuest);
logoutBtn.addEventListener('click', signOutUser);

// Initial check
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    console.warn("Firebase config is missing. Please update script.js");
}
