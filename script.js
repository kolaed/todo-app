// Firebase config (replace with your own config if you change project)
const firebaseConfig = {
  apiKey: "AIzaSyCx9m5wdsSjnKyhcxq1ud32dVkEBxCR3ms",
  authDomain: "to-do-work-12598.firebaseapp.com",
  projectId: "to-do-work-12598",
  storageBucket: "to-do-work-12598.appspot.com",
  messagingSenderId: "563904850644",
  appId: "1:563904850644:web:b90876be891912ad2b2941",
  measurementId: "G-CYQJ7GJRWJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
if (firebase.analytics) firebase.analytics();

class TodoApp {
  constructor() {
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
    this.searchInput = document.getElementById('searchInput');
    this.searchBtn = document.getElementById('searchBtn');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.searchResults = document.getElementById('searchResults');
    this.searchList = document.getElementById('searchList');
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

    this.searchBtn.addEventListener('click', () => this.searchTasks());
    this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchTasks();
    });
  }

  navigateDate(direction) {
    const date = new Date(this.currentDate);
    date.setDate(date.getDate() + direction);
    this.currentDate = date.toISOString().split('T')[0];
    this.currentDateInput.value = this.currentDate;
    this.loadTasks();
  }

  async addTask() {
    const taskText = this.taskInput.value.trim();
    if (!taskText) return;
    await db.collection("todos").add({
      text: taskText,
      completed: false,
      date: this.currentDate,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    this.taskInput.value = '';
    this.loadTasks();
  }

  async toggleTask(taskId, completed) {
    await db.collection("todos").doc(taskId).update({ completed: !completed });
    this.loadTasks();
  }

  async deleteTask(taskId) {
    await db.collection("todos").doc(taskId).delete();
    this.loadTasks();
  }

  async moveTask(taskId, fromDate) {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', fromDate);
    if (newDate && this.isValidDate(newDate)) {
      await db.collection("todos").doc(taskId).update({ date: newDate });
      this.loadTasks();
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

  async loadTasks() {
    // Hide search results if visible
    this.searchResults.style.display = "none";
    this.clearSearchBtn.style.display = "none";
    this.searchInput.value = "";

    // Today's tasks
    const todaySnap = await db.collection("todos")
      .where("date", "==", this.currentDate)
      .orderBy("createdAt")
      .get();
    const todayTasks = todaySnap.docs.map(doc => ({
      id: doc.id, ...doc.data()
    }));

    // Carried over tasks: incomplete from previous days
    const carriedSnap = await db.collection("todos")
      .where("date", "<", this.currentDate)
      .where("completed", "==", false)
      .orderBy("date")
      .orderBy("createdAt")
      .get();
    const carriedTasks = carriedSnap.docs.map(doc => ({
      id: doc.id, ...doc.data()
    }));

    this.renderTasks(this.todayList, todayTasks, this.currentDate, false);
    this.renderTasks(this.carriedOverList, carriedTasks, null, true);
    this.carriedOverSection.style.display = carriedTasks.length > 0 ? 'block' : 'none';
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
      taskItem.className = `task-item${task.completed ? ' completed' : ''}${isCarriedOver ? ' carried-over' : ''}`;

      const taskDate = isCarriedOver ? task.date : date;

      taskItem.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        ${isCarriedOver ? `<span class="task-date">From ${this.formatDate(task.date)}</span>` : ''}
        <div class="task-actions">
          <button class="move-btn">Move</button>
          <button class="delete-btn">Delete</button>
        </div>
      `;
      // Checkbox
      taskItem.querySelector('.task-checkbox').addEventListener('change', () =>
        this.toggleTask(task.id, task.completed)
      );
      // Move button
      taskItem.querySelector('.move-btn').addEventListener('click', () =>
        this.moveTask(task.id, task.date)
      );
      // Delete button
      taskItem.querySelector('.delete-btn').addEventListener('click', () =>
        this.deleteTask(task.id)
      );

      container.appendChild(taskItem);
    });
  }

  async searchTasks() {
    const searchTerm = this.searchInput.value.trim();
    if (!searchTerm) return;
    // Simple search: find tasks that contain the search term (case-insensitive)
    // Firestore can't do case-insensitive search natively, so we fetch all tasks for now
    // For large data sets, use a search index or a 3rd-party service
    const allSnap = await db.collection("todos")
      .orderBy("createdAt", "desc")
      .limit(100) // limit for demo
      .get();
    const tasks = allSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(task => task.text.toLowerCase().includes(searchTerm.toLowerCase()));
    this.renderTasks(this.searchList, tasks, null, false);
    this.searchResults.style.display = "block";
    this.clearSearchBtn.style.display = "inline-block";
    this.carriedOverSection.style.display = "none";
    document.getElementById("todayTasks").style.display = "none";
  }

  clearSearch() {
    this.searchResults.style.display = "none";
    this.clearSearchBtn.style.display = "none";
    this.searchInput.value = "";
    document.getElementById("todayTasks").style.display = "block";
    this.loadTasks();
  }
}

window.onload = () => { window.app = new TodoApp(); };
