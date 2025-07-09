class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || {};
        this.currentDate = new Date().toISOString().split('T')[0];
        this.initializeElements();
        this.setupEventListeners();
        this.loadTasks();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTask');
        this.currentDateInput = document.getElementById('currentDate');
        this.prevDayBtn = document.getElementById('prevDay');
        this.nextDayBtn = document.getElementById('nextDay');
        this.carriedOverList = document.getElementById('carriedOverList');
        this.todayList = document.getElementById('todayList');
        this.carriedOverSection = document.getElementById('carriedOverTasks');
        
        this.currentDateInput.value = this.currentDate;
    }

    setupEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.currentDateInput.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.loadTasks();
        });
        
        this.prevDayBtn.addEventListener('click', () => this.navigateDate(-1));
        this.nextDayBtn.addEventListener('click', () => this.navigateDate(1));
    }

    navigateDate(direction) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + direction);
        this.currentDate = date.toISOString().split('T')[0];
        this.currentDateInput.value = this.currentDate;
        this.loadTasks();
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        if (!this.tasks[this.currentDate]) {
            this.tasks[this.currentDate] = [];
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdDate: this.currentDate,
            originalDate: this.currentDate
        };

        this.tasks[this.currentDate].push(task);
        this.saveToStorage();
        this.taskInput.value = '';
        this.loadTasks();
    }

    toggleTask(date, taskId) {
        const task = this.tasks[date]?.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.loadTasks();
        }
    }

    deleteTask(date, taskId) {
        if (this.tasks[date]) {
            this.tasks[date] = this.tasks[date].filter(t => t.id !== taskId);
            if (this.tasks[date].length === 0) {
                delete this.tasks[date];
            }
            this.saveToStorage();
            this.loadTasks();
        }
    }

    moveTask(fromDate, taskId, toDate) {
        const task = this.tasks[fromDate]?.find(t => t.id === taskId);
        if (task) {
            // Remove from original date
            this.tasks[fromDate] = this.tasks[fromDate].filter(t => t.id !== taskId);
            if (this.tasks[fromDate].length === 0) {
                delete this.tasks[fromDate];
            }

            // Add to new date
            if (!this.tasks[toDate]) {
                this.tasks[toDate] = [];
            }
            this.tasks[toDate].push(task);
            
            this.saveToStorage();
            this.loadTasks();
        }
    }

    getCarriedOverTasks() {
        const carriedOver = [];
        const currentDateObj = new Date(this.currentDate);
        
        for (const [date, tasks] of Object.entries(this.tasks)) {
            const taskDate = new Date(date);
            if (taskDate < currentDateObj) {
                const incompleteTasks = tasks.filter(task => !task.completed);
                carriedOver.push(...incompleteTasks.map(task => ({
                    ...task,
                    fromDate: date
                })));
            }
        }
        
        return carriedOver.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate));
    }

    loadTasks() {
        const todayTasks = this.tasks[this.currentDate] || [];
        const carriedOverTasks = this.getCarriedOverTasks();
        
        this.renderTasks(this.todayList, todayTasks, this.currentDate, false);
        this.renderTasks(this.carriedOverList, carriedOverTasks, null, true);
        
        // Show/hide carried over section
        this.carriedOverSection.style.display = carriedOverTasks.length > 0 ? 'block' : 'none';
    }

    renderTasks(container, tasks, date, isCarriedOver) {
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = isCarriedOver ? 'No carried over tasks' : 'No tasks for today';
            container.appendChild(emptyState);
            return;
        }

        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${isCarriedOver ? 'carried-over' : ''}`;
            
            const taskDate = isCarriedOver ? task.fromDate : date;
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                ${isCarriedOver ? `<span class="task-date">From ${this.formatDate(task.fromDate)}</span>` : ''}
                <div class="task-actions">
                    <button class="move-btn" onclick="app.promptMoveTask('${taskDate}', ${task.id})">Move</button>
                    <button class="delete-btn" onclick="app.deleteTask('${taskDate}', ${task.id})">Delete</button>
                </div>
            `;
            
            const checkbox = taskItem.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(taskDate, task.id));
            
            container.appendChild(taskItem);
        });
    }

    promptMoveTask(fromDate, taskId) {
        const newDate = prompt('Enter new date (YYYY-MM-DD):');
        if (newDate && this.isValidDate(newDate)) {
            this.moveTask(fromDate, taskId, newDate);
        } else if (newDate) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
        }
    }

    isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    saveToStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
const app = new TodoApp();
