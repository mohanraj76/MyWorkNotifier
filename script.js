document.addEventListener("DOMContentLoaded", () => {
  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  startClock();
});

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const completedList = document.getElementById("completedList");
const deletedList = document.getElementById("deletedList");
const recurringList = document.getElementById("recurringList");
const todayList = document.getElementById("todayList");
const pendingList = document.getElementById("pendingList");
const searchToday = document.getElementById("searchToday");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let completedTasks = JSON.parse(localStorage.getItem("completedTasks")) || [];
let deletedTasks = JSON.parse(localStorage.getItem("deletedTasks")) || [];
let pendingTasks = JSON.parse(localStorage.getItem("pendingTasks")) || [];

function saveAll() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("completedTasks", JSON.stringify(completedTasks));
  localStorage.setItem("deletedTasks", JSON.stringify(deletedTasks));
  localStorage.setItem("pendingTasks", JSON.stringify(pendingTasks));
}

function renderTasks() {
  taskList.innerHTML = "";
  recurringList.innerHTML = "";
  completedList.innerHTML = "";
  deletedList.innerHTML = "";
  pendingList.innerHTML = "";
  todayList.innerHTML = "";

  const today = new Date();

  tasks.forEach((task, index) => {
    const li = createTaskElement(task, index, "upcoming");
    if (task.repeat !== "none") recurringList.appendChild(li);
    else taskList.appendChild(li);

    const taskDate = new Date(task.time);
    if (taskDate.toDateString() === today.toDateString()) {
      todayList.appendChild(createTaskElement(task, index, "today"));
    }
  });

  completedTasks.forEach((task, index) => {
    completedList.appendChild(createTaskElement(task, index, "completed"));
  });

  deletedTasks.forEach((task, index) => {
    deletedList.appendChild(createTaskElement(task, index, "deleted"));
  });

  pendingTasks.forEach((task, index) => {
    pendingList.appendChild(createTaskElement(task, index, "pending"));
  });
}

function createTaskElement(task, index, type) {
  const li = document.createElement("li");
  li.textContent = `${task.name} - ${new Date(task.time).toLocaleString()} | ${task.description || ""}`;

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  if (type === "upcoming" || type === "today") {
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
  }

  if (type === "completed") {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = () => moveToDeleted(completedTasks, index);
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Restore";
    restoreBtn.classList.add("restore-btn");
    restoreBtn.onclick = () => restoreTask(completedTasks, index);
    actions.appendChild(deleteBtn);
    actions.appendChild(restoreBtn);
  }

  if (type === "deleted") {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Permanently";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = () => permanentlyDelete(index);
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Restore";
    restoreBtn.classList.add("restore-btn");
    restoreBtn.onclick = () => restoreTask(deletedTasks, index);
    actions.appendChild(deleteBtn);
    actions.appendChild(restoreBtn);
  }

  if (type === "pending") {
    const completeBtn = document.createElement("button");
    completeBtn.textContent = "Complete";
    completeBtn.classList.add("complete-btn");
    completeBtn.onclick = () => markPendingComplete(index);
    actions.appendChild(completeBtn);
  }

  li.appendChild(actions);
  return li;
}

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("taskName").value;
  const time = document.getElementById("taskTime").value;
  const desc = document.getElementById("taskDesc") ? document.getElementById("taskDesc").value : "";
  const icon = document.getElementById("taskIcon").value;
  const repeat = document.getElementById("taskRepeat").value;

  const newTask = { name, time, description: desc, icon, repeat };
  tasks.push(newTask);
  saveAll();
  renderTasks();
  taskForm.reset();
});

function deleteTask(index) {
  const task = tasks.splice(index, 1)[0];
  deletedTasks.push(task);
  saveAll();
  renderTasks();
}

function restoreTask(list, index) {
  const task = list.splice(index, 1)[0];
  tasks.push(task);
  saveAll();
  renderTasks();
}

function moveToDeleted(list, index) {
  const task = list.splice(index, 1)[0];
  deletedTasks.push(task);
  saveAll();
  renderTasks();
}

function permanentlyDelete(index) {
  deletedTasks.splice(index, 1);
  saveAll();
  renderTasks();
}

function markComplete(index) {
  const task = tasks.splice(index, 1)[0];
  completedTasks.push(task);

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

function markPendingComplete(index) {
  const task = pendingTasks.splice(index, 1)[0];
  completedTasks.push(task);
  saveAll();
  renderTasks();
}

setInterval(() => {
  const now = new Date();
  tasks.forEach((task, index) => {
    const taskTime = new Date(task.time);
    if (
      taskTime.getFullYear() === now.getFullYear() &&
      taskTime.getMonth() === now.getMonth() &&
      taskTime.getDate() === now.getDate() &&
      taskTime.getHours() === now.getHours() &&
      taskTime.getMinutes() === now.getMinutes()
    ) {
      triggerAlarm(task, index);
    }
  });
}, 60000);

function triggerAlarm(task, index) {
  const audio = new Audio("alarm.mp3");
  audio.play();

  const pendingTask = tasks.splice(index, 1)[0];
  pendingTasks.push(pendingTask);
  saveAll();
  renderTasks();

  if (Notification.permission === "granted") {
    const notif = new Notification(`${task.name}`, {
      body: task.description || "Task Reminder",
      icon: task.icon || ""
    });
    notif.onclick = () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }
}

function startClock() {
  const clock = document.getElementById("timerClock");
  setInterval(() => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
  }, 1000);
}

searchToday.addEventListener("input", () => {
  const query = searchToday.value.toLowerCase();
  todayList.innerHTML = "";
  const today = new Date();
  tasks.forEach((task, index) => {
    const taskDate = new Date(task.time);
    if (taskDate.toDateString() === today.toDateString()) {
      if (task.name.toLowerCase().includes(query) || taskDate.toLocaleDateString().includes(query)) {
        todayList.appendChild(createTaskElement(task, index, "today"));
      }
    }
  });
});

renderTasks();
