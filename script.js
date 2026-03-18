document.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
});

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const completedList = document.getElementById("completedList");
const deletedList = document.getElementById("deletedList");
const recurringList = document.getElementById("recurringList");
const alarmControls = document.getElementById("alarmControls");
const pauseBtn = document.getElementById("pauseAlarm");
const stopBtn = document.getElementById("stopAlarm");
const testBtn = document.getElementById("testAlarm");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let completedTasks = JSON.parse(localStorage.getItem("completedTasks")) || [];
let deletedTasks = JSON.parse(localStorage.getItem("deletedTasks")) || [];
let alarmAudio = null;

function saveAll() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  localStorage.setItem("deletedTasks", JSON.stringify(deletedTasks));
}

// Render tasks into separate components
function renderTasks() {
  taskList.innerHTML = "";
  recurringList.innerHTML = "";
  completedList.innerHTML = "";
  deletedList.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${task.emoji || ""} ${task.name} - ${new Date(task.time).toLocaleString()} (${task.repeat})`;

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

    // Separate recurring tasks visually
    if (task.repeat !== "none") {
      recurringList.appendChild(li);
    } else {
      taskList.appendChild(li);
    }
  });

  completedTasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `${task.emoji || ""} ${task.name} - ${new Date(task.time).toLocaleString()}`;
    li.classList.add("completed");
    completedList.appendChild(li);
  });

  deletedTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = `${task.emoji || ""} ${task.name} - ${new Date(task.time).toLocaleString()}`;
    li.classList.add("deleted");

    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Restore";
    restoreBtn.classList.add("restore-btn");
    restoreBtn.onclick = () => restoreTask(index);

    li.appendChild(restoreBtn);
    deletedList.appendChild(li);
  });
}
renderTasks();

// Add task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const time = document.getElementById("taskTime").value;
  const emoji = document.getElementById("taskEmoji").value;
  const repeat = document.getElementById("taskRepeat").value;

  const newTask = { name, time, emoji, repeat };
  tasks.push(newTask);
  saveAll();
  renderTasks();
  taskForm.reset();
});

// Delete task
function deleteTask(index) {
  const task = tasks.splice(index, 1)[0];
  deletedTasks.push(task);
  saveAll();
  renderTasks();
}

// Restore task
function restoreTask(index) {
  const task = deletedTasks.splice(index, 1)[0];
  tasks.push(task);
  saveAll();
  renderTasks();
}

// Mark task complete
function markComplete(index) {
  const task = tasks.splice(index, 1)[0];
  completedTasks.push(task);

  // Handle recurrence
  if (task.repeat !== "none") {
    const nextTime = new Date(task.time);
    if (task.repeat === "daily") nextTime.setDate(nextTime.getDate() + 1);
    if (task.repeat === "weekly") nextTime.setDate(nextTime.getDate() + 7);
    if (task.repeat === "monthly") nextTime.setMonth(nextTime.getMonth() + 1);
    tasks.push({ ...task, time: nextTime.toISOString() });
  }

  saveAll();
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
      triggerAlarm(task);
    }
  });

  // Daily summary at 9 AM
  if (now.getHours() === 9 && now.getMinutes() === 0) {
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.time);
      return taskDate.toDateString() === now.toDateString();
    });
    if (todayTasks.length > 0) {
      showNotification("📌 Today's Tasks", todayTasks.map(t => `${t.emoji || ""} ${t.name}`).join(", "));
    }
  }
}, 60000);

// Trigger alarm immediately + notification
function triggerAlarm(task) {
  alarmAudio = new Audio("alarm.mp3");
  alarmAudio.loop = true;
  alarmAudio.play();

  alarmControls.classList.remove("hidden");

  // Use the task emoji in the notification title
  showNotification(`${task.emoji || ""} Task Reminder`, task.name);
}

// Notification function
function showNotification(title, bodyText) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: bodyText,
      // You can also set a custom icon if you want, but the emoji will show in the title/body
      icon: "https://cdn-icons-png.flaticon.com/512/1827/1827312.png"
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
  triggerAlarm({ name: "Test Alarm", emoji: "🔔", repeat: "none", time: new Date().toISOString() });
});
