// Request notification permission once at startup
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const completedList = document.getElementById("completedList");
const alarmControls = document.getElementById("alarmControls");
const pauseBtn = document.getElementById("pauseAlarm");
const stopBtn = document.getElementById("stopAlarm");
const testBtn = document.getElementById("testAlarm");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let completedTasks = JSON.parse(localStorage.getItem("completedTasks")) || [];
let alarmAudio = null;

// Render tasks
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${task.name} - ${new Date(task.time).toLocaleString()}`;

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

    const completeBtn = document.createElement("button");
    completeBtn.textContent = "Complete";
    completeBtn.classList.add("complete-btn");
    completeBtn.onclick = () => markComplete(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = () => deleteTask(index);

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(actions);

    taskList.appendChild(li);
  });

  completedList.innerHTML = "";
  completedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `${task.name} - ${new Date(task.time).toLocaleString()}`;
    li.classList.add("completed");
    completedList.appendChild(li);
  });
}
renderTasks();

// Add task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const time = document.getElementById("taskTime").value;

  const newTask = { name, time };
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
  taskForm.reset();
});

// Delete task
function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// Mark task complete
function markComplete(index) {
  const task = tasks.splice(index, 1)[0];
  completedTasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  renderTasks();
}

// Check tasks every minute
setInterval(() => {
  const now = new Date();
  tasks.forEach((task) => {
    const taskTime = new Date(task.time);
    if (
      taskTime.getFullYear() === now.getFullYear() &&
      taskTime.getMonth() === now.getMonth() &&
      taskTime.getDate() === now.getDate() &&
      taskTime.getHours() === now.getHours() &&
      taskTime.getMinutes() === now.getMinutes()
    ) {
      triggerAlarm(task.name);
    }
  });

  // Daily summary at 9 AM
  if (now.getHours() === 9 && now.getMinutes() === 0) {
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.time);
      return taskDate.toDateString() === now.toDateString();
    });
    if (todayTasks.length > 0) {
      showNotification("📌 Today's Tasks", todayTasks.map(t => t.name).join(", "));
    }
  }
}, 60000);

// Trigger alarm immediately + notification
function triggerAlarm(taskName) {
  // Play audio instantly
  alarmAudio = new Audio("alarm.mp3"); // <-- place your audio file in project folder
  alarmAudio.loop = true;
  alarmAudio.play();

  // Show control panel
  alarmControls.classList.remove("hidden");

  // Fire Windows notification simultaneously
  showNotification("⏰ Task Reminder", taskName);
}

// Notification function using Windows toast style
function showNotification(title, bodyText) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: bodyText,
      icon: "https://cdn-icons-png.flaticon.com/512/1827/1827312.png" // optional icon
    });
  }
}

// Pause and Stop buttons
pauseBtn.addEventListener("click", () => {
  if (alarmAudio) {
    if (alarmAudio.paused) {
      alarmAudio.play();
      pauseBtn.textContent = "Pause";
    } else {
      alarmAudio.pause();
      pauseBtn.textContent = "Resume";
    }
  }
});

stopBtn.addEventListener("click", () => {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    alarmControls.classList.add("hidden");
    pauseBtn.textContent = "Pause";
  }
});

// Test button to verify notifications + alarm
testBtn.addEventListener("click", () => {
  triggerAlarm("Test Alarm");
});
