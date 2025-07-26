// Enhanced Todo List Application
// Author: TaskFlow Pro Team

// Global Variables
let tasks = [];
let completedTasks = [];
let taskIdCounter = 1;

// Initialize Application
$(document).ready(function() {
    loadTasksFromStorage();
    createTaskTables();
    updateStats();
    updateProgressCircle();
});

// Storage Functions
function loadTasksFromStorage() {
    const storedTasks = localStorage.getItem('taskStorage');
    const storedCompleted = localStorage.getItem('completedTaskStorage');
    
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
    
    if (storedCompleted) {
        completedTasks = JSON.parse(storedCompleted);
    }
    
    // Set task ID counter to avoid conflicts
    const allTasks = [...tasks, ...completedTasks];
    if (allTasks.length > 0) {
        taskIdCounter = Math.max(...allTasks.map(task => task.id || 0)) + 1;
    }
}

function saveTasksToStorage() {
    localStorage.setItem('taskStorage', JSON.stringify(tasks));
    localStorage.setItem('completedTaskStorage', JSON.stringify(completedTasks));
}

// Modal Functions
function showAddTaskModal() {
    $('#addTaskModal').modal('show');
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    $('#addETA').val(tomorrow.toISOString().slice(0, 16));
}

// Task Management Functions
function addTask() {
    const formData = $('#taskInputForm').serializeArray();
    const taskObject = {};
    
    // Process form data
    formData.forEach(item => {
        taskObject[item.name] = item.value;
    });
    
    // Validate required fields
    if (!taskObject.taskDescription.trim()) {
        showNotification('Error', 'Please enter a task description', 'error');
        return;
    }
    
    if (!taskObject.taskResponsiblePerson.trim()) {
        showNotification('Error', 'Please enter a responsible person', 'error');
    }
    
    if (!taskObject.taskETA) {
        showNotification('Error', 'Please select a due date', 'error');
        return;
    }
    
    // Add additional properties
    taskObject.id = taskIdCounter++;
    taskObject.createdAt = new Date().toISOString();
    taskObject.status = 'active';
    
    // Add to tasks array
    tasks.push(taskObject);
    
    // Save and update UI
    saveTasksToStorage();
    createTaskTables();
    updateStats();
    updateProgressCircle();
    
    // Close modal and reset form
    $('#addTaskModal').modal('hide');
    $('#taskInputForm')[0].reset();
    
    // Show success notification
    showNotification('Success', 'Task added successfully!', 'success');
}

function editTask(index) {
    const task = tasks[index];
    if (!task) return;
    
    // Populate edit form
    $('#editTaskTextArea').val(task.taskDescription);
    $('#editResponsiblePerson').val(task.taskResponsiblePerson);
    $('#editETA').val(task.taskETA);
    $('#editPriority').val(task.taskPriority || 'medium');
    $('#editIndex').val(index);
    
    // Show modal
    $('#updateTaskModal').modal('show');
}

function updateTask() {
    const formData = $('#taskUpdateForm').serializeArray();
    const taskObject = {};
    let taskIndex;
    
    // Process form data
    formData.forEach(item => {
        if (item.name === 'taskIndex') {
            taskIndex = parseInt(item.value);
        } else {
            taskObject[item.name] = item.value;
        }
    });
    
    // Validate
    if (!taskObject.taskDescription.trim()) {
        showNotification('Error', 'Please enter a task description', 'error');
        return;
    }
    
    // Update task
    if (tasks[taskIndex]) {
        Object.assign(tasks[taskIndex], taskObject);
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        // Save and update UI
        saveTasksToStorage();
        createTaskTables();
        updateStats();
        
        // Close modal
        $('#updateTaskModal').modal('hide');
        
        // Show success notification
        showNotification('Success', 'Task updated successfully!', 'success');
    }
}

function completeTask(index) {
    const task = tasks[index];
    if (!task) return;
    
    // Add completion data
    task.completedAt = new Date().toISOString();
    task.status = 'completed';
    
    // Move to completed tasks
    completedTasks.unshift(task);
    tasks.splice(index, 1);
    
    // Save and update UI with animation
    const row = $(`#activeTasksBody tr:nth-child(${index + 1})`);
    row.addClass('task-row-complete');
    
    setTimeout(() => {
        saveTasksToStorage();
        createTaskTables();
        updateStats();
        updateProgressCircle();
        showNotification('Success', 'Task completed! Great job!', 'success');
    }, 500);
}

function deleteTask(index, isCompleted = false) {
    const taskArray = isCompleted ? completedTasks : tasks;
    const task = taskArray[index];
    
    if (!task) return;
    
    // Confirm deletion
    if (confirm('Are you sure you want to delete this task?')) {
        // Remove with animation
        const tableBody = isCompleted ? '#completedTasksBody' : '#activeTasksBody';
        const row = $(`${tableBody} tr:nth-child(${index + 1})`);
        row.addClass('task-row-delete');
        
        setTimeout(() => {
            taskArray.splice(index, 1);
            saveTasksToStorage();
            createTaskTables();
            updateStats();
            updateProgressCircle();
            showNotification('Info', 'Task deleted', 'info');
        }, 500);
    }
}

function restoreTask(index) {
    const task = completedTasks[index];
    if (!task) return;
    
    // Remove completion data
    delete task.completedAt;
    task.status = 'active';
    
    // Move back to active tasks
    tasks.push(task);
    completedTasks.splice(index, 1);
    
    // Save and update UI
    saveTasksToStorage();
    createTaskTables();
    updateStats();
    updateProgressCircle();
    
    showNotification('Info', 'Task restored to active list', 'info');
}

// UI Generation Functions
function createTaskTables() {
    createActiveTasksTable();
    createCompletedTasksTable();
}

function createActiveTasksTable() {
    let html = '';
    
    if (tasks.length === 0) {
        html = `
            <tr>
                <td colspan="6" class="no-tasks">
                    <div class="empty-state">
                        <i class="bi bi-clipboard-x"></i>
                        <p>No active tasks yet. Add your first task!</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tasks.forEach((task, index) => {
            const dueDate = new Date(task.taskETA);
            const isOverdue = dueDate < new Date();
            const priority = task.taskPriority || 'medium';
            
            html += `
                <tr class="task-row-enter">
                    <td><strong>#${task.id}</strong></td>
                    <td class="text-start">
                        <div class="task-description">
                            ${escapeHtml(task.taskDescription)}
                        </div>
                        ${isOverdue ? '<small class="text-danger"><i class="bi bi-exclamation-triangle"></i> Overdue</small>' : ''}
                    </td>
                    <td>
                        <div class="d-flex align-items-center justify-content-center">
                            <i class="bi bi-person-circle me-2"></i>
                            ${escapeHtml(task.taskResponsiblePerson)}
                        </div>
                    </td>
                    <td>
                        <div class="text-center">
                            <div>${formatDate(dueDate)}</div>
                            <small class="text-muted">${formatTime(dueDate)}</small>
                        </div>
                    </td>
                    <td>
                        <span class="priority-badge priority-${priority}">
                            ${priority}
                        </span>
                    </td>
                    <td>
                        <div class="d-flex justify-content-center gap-1">
                            <span class="action-icon action-complete" onclick="completeTask(${index})" title="Mark as Complete">
                                <i class="bi bi-check-circle"></i>
                            </span>
                            <span class="action-icon action-edit" onclick="editTask(${index})" title="Edit Task">
                                <i class="bi bi-pencil-square"></i>
                            </span>
                            <span class="action-icon action-delete" onclick="deleteTask(${index})" title="Delete Task">
                                <i class="bi bi-trash"></i>
                            </span>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    $('#activeTasksBody').html(html);
}

function createCompletedTasksTable() {
    let html = '';
    
    if (completedTasks.length === 0) {
        html = `
            <tr>
                <td colspan="5" class="no-tasks">
                    <div class="empty-state">
                        <i class="bi bi-trophy"></i>
                        <p>No completed tasks yet. Complete your first task!</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        completedTasks.forEach((task, index) => {
            const completedDate = new Date(task.completedAt);
            
            html += `
                <tr class="completed-task">
                    <td><strong>#${task.id}</strong></td>
                    <td class="text-start">
                        <div class="task-description">
                            ${escapeHtml(task.taskDescription)}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center justify-content-center">
                            <i class="bi bi-person-check me-2"></i>
                            ${escapeHtml(task.taskResponsiblePerson)}
                        </div>
                    </td>
                    <td>
                        <div class="text-center">
                            <div class="text-success">
                                <i class="bi bi-check-circle-fill completion-checkmark"></i>
                                ${formatDate(completedDate)}
                            </div>
                            <small class="text-muted">${formatTime(completedDate)}</small>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex justify-content-center gap-1">
                            <span class="action-icon action-restore" onclick="restoreTask(${index})" title="Restore Task">
                                <i class="bi bi-arrow-counterclockwise"></i>
                            </span>
                            <span class="action-icon action-delete" onclick="deleteTask(${index}, true)" title="Delete Forever">
                                <i class="bi bi-trash"></i>
                            </span>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    $('#completedTasksBody').html(html);
}

// Statistics and Progress Functions
function updateStats() {
    const activeCount = tasks.length;
    const completedCount = completedTasks.length;
    const totalCount = activeCount + completedCount;
    
    // Update counters
    $('#activeTasksCount').text(activeCount);
    $('#completedTasksCount').text(completedCount);
    $('#totalTasksCount').text(totalCount);
    $('#taskCount').text(activeCount);
    
    // Update badges
    $('#activeBadge').text(activeCount);
    $('#completedBadge').text(completedCount);
    
    // Animate counter changes
    animateCounters();
}

function updateProgressCircle() {
    const totalTasks = tasks.length + completedTasks.length;
    const completedCount = completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    
    // Update progress circle
    const circle = $('#progressCircle');
    const degrees = (percentage / 100) * 360;
    
    circle.css('background', `conic-gradient(var(--success-color) ${degrees}deg, var(--gray-200) ${degrees}deg)`);
    $('#progressPercent').text(`${percentage}%`);
    
    // Add animation class
    circle.addClass('pulse');
    setTimeout(() => circle.removeClass('pulse'), 500);
}

function animateCounters() {
    $('.stats-content h3').each(function() {
        const $this = $(this);
        $this.addClass('pulse');
        setTimeout(() => $this.removeClass('pulse'), 300);
    });
}

// Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notification System
function showNotification(title, message, type = 'info') {
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const notification = $(`
        <div class="notification ${type}">
            <div class="notification-icon">
                <i class="bi ${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <h6>${title}</h6>
                <p>${message}</p>
            </div>
        </div>
    `);
    
    $('body').append(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.css('animation', 'slideOutRight 0.5s ease-in-out forwards');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
    
    // Click to dismiss
    notification.click(() => {
        notification.css('animation', 'slideOutRight 0.5s ease-in-out forwards');
        setTimeout(() => notification.remove(), 500);
    });
}

// Keyboard Shortcuts
$(document).keydown(function(e) {
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showAddTaskModal();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        $('.modal').modal('hide');
    }
});

// Auto-save functionality
setInterval(() => {
    if (tasks.length > 0 || completedTasks.length > 0) {
        saveTasksToStorage();
    }
}, 30000); // Auto-save every 30 seconds

// Initialize tooltips
$(function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
});

// Export functionality (bonus feature)
function exportTasks() {
    const data = {
        exportDate: new Date().toISOString(),
        activeTasks: tasks,
        completedTasks: completedTasks,
        totalTasks: tasks.length + completedTasks.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Success', 'Tasks exported successfully!', 'success');
}

// Performance optimization: Debounce functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced save function
const debouncedSave = debounce(saveTasksToStorage, 1000);

// Enhanced error handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    showNotification('Error', 'An unexpected error occurred. Please refresh the page.', 'error');
});

// Service Worker registration for offline support (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}