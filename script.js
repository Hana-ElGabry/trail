document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');

    // Load tasks from local storage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Sound Effect using Web Audio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playSuccessSound() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioCtx.currentTime + 0.1); // C6

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateUI();
    }

    function updateUI() {
        // Update list
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

                // Event Listeners for this item
                const checkbox = li.querySelector('input');
                checkbox.addEventListener('change', () => toggleTask(index));

                const deleteBtn = li.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteTask(index, li));

                taskList.appendChild(li);
            });
        }

        // Update Progress
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        progressFill.style.width = `${percentage}%`;
        progressLabel.textContent = `${percentage}% Done`;
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            tasks.unshift({ text, completed: false }); // Add to top
            taskInput.value = '';
            saveTasks();
        }
    }

    function toggleTask(index) {
        tasks[index].completed = !tasks[index].completed;
        if (tasks[index].completed) {
            playSuccessSound();
            confettiEffect();
        }
        saveTasks();
    }

    function deleteTask(index, element) {
        element.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
        }, 300);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Confetti Effect (Simple CSS/JS implementation)
    function confettiEffect() {
        const count = 20;
        const defaults = {
            origin: { y: 0.7 }
        };

        // Since we can't easily import a library without CDN, let's do a simple visual pop
        // We could add a class to the body or container for a flash effect
        const container = document.querySelector('.container');
        container.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.5)';
        setTimeout(() => {
            container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
        }, 300);
    }

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Initial Render
    updateUI();
});
