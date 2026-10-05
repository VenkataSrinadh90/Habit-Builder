/* =========================================================
   HABIT BUILDER - CORE APPLICATION JAVASCRIPT
   Clean Start Level State, Routing, Dynamic Analytics & Achievements
========================================================= */

(function () {
    'use strict';

    const STORAGE_VERSION = 'hb_v3_empty_start';

    // State
    let habits = [];
    let recentLogs = [];
    let currentFilter = 'all';
    let currentSort = 'recent';
    let currentEditingHabitId = null;

    // Load State from LocalStorage
    function loadState() {
        if (localStorage.getItem('hb_version') !== STORAGE_VERSION) {
            localStorage.removeItem('hb_habits');
            localStorage.removeItem('hb_recent_logs');
            localStorage.setItem('hb_version', STORAGE_VERSION);
        }

        const savedHabits = localStorage.getItem('hb_habits');
        const savedLogs = localStorage.getItem('hb_recent_logs');
        
        habits = savedHabits ? JSON.parse(savedHabits) : [];
        recentLogs = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Theme
        const savedTheme = localStorage.getItem('hb_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function saveState() {
        localStorage.setItem('hb_habits', JSON.stringify(habits));
        localStorage.setItem('hb_recent_logs', JSON.stringify(recentLogs));
    }

    // DOM Elements
    const elements = {
        topbarTitle: document.getElementById('topbar-title-text'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeToggleIcon: document.getElementById('theme-toggle-icon'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        sidebar: document.getElementById('sidebar'),
        navItems: document.querySelectorAll('.sidebar-nav-container .nav-item, .sidebar-footer .nav-item'),
        pageViews: document.querySelectorAll('.page-view'),
        
        // Dashboard elements
        dashHabitsList: document.getElementById('dashboard-habits-list'),
        recentProgressList: document.getElementById('recent-progress-list'),
        
        // My habits elements
        myHabitsGrid: document.getElementById('my-habits-cards-grid'),
        filterPills: document.querySelectorAll('.filter-pill'),
        sortSelect: document.getElementById('sort-habits-select'),
        
        // Achievements container
        achievementsGrid: document.getElementById('achievements-grid-container'),
        
        // Profile stat elements
        profileStreakBadge: document.getElementById('profile-streak-badge'),
        profileActiveHabits: document.getElementById('profile-active-habits'),
        profileTotalCheckins: document.getElementById('profile-total-checkins'),
        profileUnlockedBadges: document.getElementById('profile-unlocked-badges'),

        // Modals
        createHabitModal: document.getElementById('create-habit-modal'),
        viewEditModal: document.getElementById('view-edit-modal'),
        createHabitForm: document.getElementById('create-habit-form'),
        viewEditForm: document.getElementById('view-edit-form'),
        
        // Modal inputs
        editHabitTitle: document.getElementById('edit-modal-habit-title'),
        editHabitSubtitle: document.getElementById('edit-modal-habit-sub'),
        editCompletedCheck: document.getElementById('edit-completed-today'),
        editNotesInput: document.getElementById('edit-today-notes'),
        
        // Toast
        toastContainer: document.getElementById('toast-container')
    };

    // Initialize application
    function init() {
        loadState();
        setupRouting();
        setupEventListeners();
        renderAll();
    }

    // Routing
    function setupRouting() {
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
    }

    function handleHashChange() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(hash, false);
    }

    function navigateTo(viewId, updateHash = true) {
        const validViews = ['dashboard', 'habits', 'analytics', 'achievements', 'profile', 'settings'];
        const targetView = validViews.includes(viewId) ? viewId : 'dashboard';

        if (updateHash) {
            window.location.hash = targetView;
        }

        // Update active class on views
        elements.pageViews.forEach(view => {
            if (view.id === `view-${targetView}`) {
                view.classList.add('active-view');
            } else {
                view.classList.remove('active-view');
            }
        });

        // Update nav items
        elements.navItems.forEach(item => {
            const itemView = item.getAttribute('data-view');
            if (itemView === targetView) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update Topbar Title
        const viewTitles = {
            dashboard: 'Dashboard',
            habits: 'My Habits',
            analytics: 'Analytics',
            achievements: 'Achievements',
            profile: 'Profile',
            settings: 'Settings'
        };
        if (elements.topbarTitle) {
            elements.topbarTitle.textContent = viewTitles[targetView] || 'Dashboard';
        }

        // Close sidebar on mobile if open
        if (elements.sidebar && elements.sidebar.classList.contains('open')) {
            elements.sidebar.classList.remove('open');
        }

        // Re-render specific views if necessary
        if (targetView === 'analytics') {
            renderAnalyticsCharts();
        } else if (targetView === 'achievements') {
            renderAchievements();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event Listeners
    function setupEventListeners() {
        // Nav items click
        elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.getAttribute('data-view');
                if (view) {
                    e.preventDefault();
                    navigateTo(view);
                }
            });
        });

        // Theme Toggle
        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.addEventListener('click', toggleTheme);
        }

        // Mobile menu button
        if (elements.mobileMenuBtn && elements.sidebar) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                elements.sidebar.classList.toggle('open');
            });
        }

        // Filter pills in My Habits
        elements.filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                elements.filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilter = pill.getAttribute('data-filter') || 'all';
                renderMyHabits();
            });
        });

        // Sort select in My Habits
        if (elements.sortSelect) {
            elements.sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                renderMyHabits();
            });
        }

        // Open Create Habit Modal buttons
        document.querySelectorAll('[data-action="open-create-modal"]').forEach(btn => {
            btn.addEventListener('click', () => openModal(elements.createHabitModal));
        });

        // Modal Close buttons
        document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(elements.createHabitModal);
                closeModal(elements.viewEditModal);
            });
        });

        // Close modal when clicking on overlay background
        [elements.createHabitModal, elements.viewEditModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal);
                    }
                });
            }
        });

        // Icon Selector Buttons in Create Modal
        document.querySelectorAll('.icon-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-choice-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                const iconInput = document.getElementById('new-habit-icon');
                if (iconInput) {
                    iconInput.value = btn.getAttribute('data-icon');
                }
            });
        });

        // Form Submit: Create Habit
        if (elements.createHabitForm) {
            elements.createHabitForm.addEventListener('submit', handleCreateHabit);
        }

        // Form Submit: View / Edit Progress
        if (elements.viewEditForm) {
            elements.viewEditForm.addEventListener('submit', handleSaveProgress);
        }

        // Quick navigation buttons in dashboard
        const btnViewHabits = document.getElementById('dash-btn-view-habits');
        if (btnViewHabits) {
            btnViewHabits.addEventListener('click', () => navigateTo('habits'));
        }

        const btnViewAnalytics = document.getElementById('dash-btn-view-analytics');
        if (btnViewAnalytics) {
            btnViewAnalytics.addEventListener('click', () => navigateTo('analytics'));
        }

        // Settings actions: Clear local demo data
        const resetDataBtn = document.getElementById('btn-reset-demo-data');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                if (confirm('Clear all habits, check-ins, analytics, and achievements?')) {
                    localStorage.removeItem('hb_habits');
                    localStorage.removeItem('hb_recent_logs');
                    localStorage.setItem('hb_version', STORAGE_VERSION);
                    loadState();
                    renderAll();
                    showToast('All local habit and check-in data was cleared.');
                }
            });
        }
    }

    // Theme Switcher
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('hb_theme', newTheme);
        updateThemeIcon(newTheme);
        renderAnalyticsCharts();
        showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme enabled`);
    }

    function updateThemeIcon(theme) {
        if (!elements.themeToggleIcon) return;
        if (theme === 'dark') {
            elements.themeToggleIcon.className = 'fa-solid fa-sun';
        } else {
            elements.themeToggleIcon.className = 'fa-solid fa-moon';
        }
    }

    // Modal Helpers
    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // Toast Notification
    function showToast(message) {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i><span>${message}</span>`;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // RENDER FUNCTIONS
    function renderAll() {
        renderStats();
        renderDashboardHabits();
        renderRecentProgress();
        renderMyHabits();
        renderAnalyticsCharts();
        renderConsistencyList();
        renderAchievements();
    }

    // Render Top Stat Cards on Dashboard and Analytics
    function renderStats() {
        const activeCount = habits.filter(h => h.status === 'active').length;
        const maxStreak = habits.length ? Math.max(...habits.map(h => h.streakDays)) : 0;
        const completedChallenges = habits.filter(h => h.currentDay >= h.targetDays).length;
        const totalCompletedDays = habits.reduce((acc, h) => acc + h.currentDay, 0);
        
        let totalPercent = 0;
        habits.forEach(h => {
            totalPercent += Math.round((h.currentDay / h.targetDays) * 100);
        });
        const avgProgress = habits.length ? Math.round(totalPercent / habits.length) : 0;

        // Update Greeting Date
        const todayDateEl = document.getElementById('dashboard-today-date');
        if (todayDateEl) {
            const now = new Date();
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            todayDateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
        }

        // Dashboard stat card values
        const dActive = document.getElementById('stat-active-habits');
        const dStreak = document.getElementById('stat-current-streak');
        const dCompleted = document.getElementById('stat-completed-challenges');
        const dProgress = document.getElementById('stat-overall-progress');

        if (dActive) dActive.textContent = activeCount;
        if (dStreak) dStreak.textContent = maxStreak;
        if (dCompleted) dCompleted.textContent = completedChallenges;
        if (dProgress) dProgress.textContent = `${avgProgress}%`;

        // Analytics stat card values
        const aTotal = document.getElementById('analytics-total-habits');
        const aDays = document.getElementById('analytics-days-completed');
        const aStreak = document.getElementById('analytics-longest-streak');
        const aAvg = document.getElementById('analytics-average-progress');

        if (aTotal) aTotal.textContent = habits.length;
        if (aDays) aDays.textContent = totalCompletedDays;
        if (aStreak) aStreak.innerHTML = `<i class="fa-solid fa-fire stat-icon fire-icon"></i> ${maxStreak}`;
        if (aAvg) aAvg.textContent = `${avgProgress}%`;

        // Profile stats
        if (elements.profileActiveHabits) elements.profileActiveHabits.textContent = activeCount;
        if (elements.profileTotalCheckins) elements.profileTotalCheckins.textContent = totalCompletedDays;
        if (elements.profileStreakBadge) elements.profileStreakBadge.textContent = `${maxStreak} Day Active Streak`;
    }

    // Render Dashboard Habit Cards (Image 1 & Image 3)
    function renderDashboardHabits() {
        if (!elements.dashHabitsList) return;
        elements.dashHabitsList.innerHTML = '';

        if (habits.length === 0) {
            elements.dashHabitsList.innerHTML = `
                <div class="empty-state-card habit-empty-state">
                    <i class="fa-solid fa-seedling empty-state-icon"></i>
                    <p class="empty-state-title">No habits yet</p>
                    <p class="empty-state-sub">Create your first habit to start tracking your progress.</p>
                </div>
            `;
            return;
        }

        habits.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'dashboard-habit-card';

            const isDone = habit.completedToday;
            const bannerClass = isDone ? 'habit-recorded-banner is-completed' : 'habit-recorded-banner is-pending';
            const statusHtml = isDone
                ? `<div class="recorded-status"><i class="fa-solid fa-check"></i><span>Today's progress recorded</span></div>`
                : `<div class="recorded-status"><i class="fa-regular fa-clock"></i><span>Pending today's check-in</span></div>`;
            const btnText = isDone ? 'View / Edit' : 'Check In';

            card.innerHTML = `
                <div class="habit-main-row">
                    <div class="habit-info-left">
                        <div class="habit-icon-box ${habit.categoryClass}">
                            <i class="${habit.icon}"></i>
                        </div>
                        <div class="habit-title-group">
                            <h3>${escapeHtml(habit.title)}</h3>
                            <p class="habit-meta-text">${escapeHtml(habit.category)} · Day ${habit.currentDay} / ${habit.targetDays}</p>
                        </div>
                    </div>
                    <div class="habit-info-right">
                        <span class="streak-badge">
                            <i class="fa-solid fa-fire"></i>
                            ${habit.streakDays} days
                        </span>
                    </div>
                </div>
                <div class="${bannerClass}">
                    ${statusHtml}
                    <button class="btn-view-edit" data-id="${habit.id}">
                        ${btnText}
                    </button>
                </div>
            `;

            // Attach event listener for View / Edit / Check In button
            const editBtn = card.querySelector('.btn-view-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => openViewEditModal(habit.id));
            }

            elements.dashHabitsList.appendChild(card);
        });
    }

    // Render Recent Progress list in Dashboard right column
    function renderRecentProgress() {
        if (!elements.recentProgressList) return;
        elements.recentProgressList.innerHTML = '';

        if (recentLogs.length === 0) {
            elements.recentProgressList.innerHTML = `
                <div class="empty-state-card">
                    <i class="fa-solid fa-seedling empty-state-icon"></i>
                    <p class="empty-state-title">No check-ins yet</p>
                    <p class="empty-state-sub">Complete your first habit today to start building your streak!</p>
                </div>
            `;
            return;
        }

        recentLogs.slice(0, 5).forEach((entry) => {
            const item = document.createElement('div');
            item.className = 'recent-entry-item';
            item.innerHTML = `
                <h4 class="recent-entry-header">${escapeHtml(entry.habitTitle)} · Day ${entry.day}</h4>
                <p class="recent-entry-notes">${escapeHtml(entry.date)} · ${escapeHtml(entry.note || 'Recorded daily session.')}</p>
            `;
            elements.recentProgressList.appendChild(item);
        });
    }

    // Render My Habits Grid (Image 2)
    function renderMyHabits() {
        if (!elements.myHabitsGrid) return;
        elements.myHabitsGrid.innerHTML = '';

        if (habits.length === 0) {
            elements.myHabitsGrid.innerHTML = `
                <div class="empty-state-card habit-empty-state">
                    <i class="fa-solid fa-seedling empty-state-icon"></i>
                    <p class="empty-state-title">No habits yet</p>
                    <p class="empty-state-sub">Create your first habit to start tracking your progress.</p>
                </div>
            `;
            return;
        }

        // Filter habits
        let filtered = habits.filter(h => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'active') return h.status === 'active';
            if (currentFilter === 'completed') return h.currentDay >= h.targetDays;
            if (currentFilter === 'paused') return h.status === 'paused';
            return true;
        });

        // Sort habits
        filtered.sort((a, b) => {
            if (currentSort === 'streak') return b.streakDays - a.streakDays;
            if (currentSort === 'progress') {
                return (b.currentDay / b.targetDays) - (a.currentDay / a.targetDays);
            }
            if (currentSort === 'alpha') return a.title.localeCompare(b.title);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        filtered.forEach(habit => {
            const percent = Math.min(100, Math.round((habit.currentDay / habit.targetDays) * 100));
            const card = document.createElement('div');
            card.className = 'habit-grid-card';

            const recordedHtml = habit.completedToday
                ? `<span class="status-recorded-text"><i class="fa-solid fa-check" style="color: var(--green-primary);"></i> Today recorded</span>`
                : `<span class="status-recorded-text" style="color: var(--text-muted);"><i class="fa-regular fa-clock"></i> Pending today</span>`;

            card.innerHTML = `
                <div>
                    <div class="card-top-header">
                        <div class="card-top-left">
                            <div class="habit-icon-box ${habit.categoryClass}">
                                <i class="${habit.icon}"></i>
                            </div>
                            <div class="habit-title-group">
                                <h3>${escapeHtml(habit.title)}</h3>
                                <p class="habit-meta-text">${escapeHtml(habit.category)}</p>
                            </div>
                        </div>
                        <button class="card-menu-btn" title="More options" data-id="${habit.id}">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>

                    <p class="habit-card-desc">${escapeHtml(habit.description)}</p>

                    <div class="habit-card-status-row">
                        <span class="streak-badge">
                            <i class="fa-solid fa-fire"></i>
                            ${habit.streakDays} day streak
                        </span>
                        ${recordedHtml}
                    </div>

                    <div class="habit-progress-details">
                        <span>${habit.currentDay} / ${habit.targetDays} days</span>
                        <span>${percent}%</span>
                    </div>

                    <div class="habit-progress-bar-track">
                        <div class="habit-progress-bar-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>

                <div class="card-action-footer">
                    <button class="btn-view-habit-link" data-id="${habit.id}">
                        <span>View Habit</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            `;

            // Button handlers
            card.querySelector('.btn-view-habit-link').addEventListener('click', () => {
                openViewEditModal(habit.id);
            });

            card.querySelector('.card-menu-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showHabitActionMenu(habit.id);
            });

            elements.myHabitsGrid.appendChild(card);
        });
    }

    // Habit card `...` menu
    function showHabitActionMenu(habitId) {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const choice = prompt(`Options for "${habit.title}":\n1: Log today's progress\n2: Toggle active/pause\n3: Delete habit\n\nEnter 1, 2, or 3:`);
        if (choice === '1') {
            openViewEditModal(habitId);
        } else if (choice === '2') {
            habit.status = habit.status === 'active' ? 'paused' : 'active';
            saveState();
            renderAll();
            showToast(`Habit status set to ${habit.status}`);
        } else if (choice === '3') {
            if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                habits = habits.filter(h => h.id !== habitId);
                saveState();
                renderAll();
                showToast(`Deleted habit "${habit.title}"`);
            }
        }
    }

    // Modal: Open View / Edit Progress Modal
    function openViewEditModal(habitId) {
        currentEditingHabitId = habitId;
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        if (elements.editHabitTitle) elements.editHabitTitle.textContent = habit.title;
        if (elements.editHabitSubtitle) {
            elements.editHabitSubtitle.textContent = `${habit.category} · Day ${habit.currentDay} / ${habit.targetDays} · ${habit.streakDays} day streak`;
        }
        if (elements.editCompletedCheck) elements.editCompletedCheck.checked = habit.completedToday;
        if (elements.editNotesInput) elements.editNotesInput.value = habit.lastNote || '';

        openModal(elements.viewEditModal);
    }

    // Handle Save Progress Form Submit
    function handleSaveProgress(e) {
        e.preventDefault();
        const habit = habits.find(h => h.id === currentEditingHabitId);
        if (!habit) return;

        const wasCompleted = habit.completedToday;
        const isCompleted = elements.editCompletedCheck.checked;
        const notes = elements.editNotesInput.value.trim();

        habit.completedToday = isCompleted;
        if (isCompleted && !wasCompleted) {
            habit.currentDay = Math.min(habit.targetDays, habit.currentDay + 1);
            habit.streakDays += 1;
        } else if (!isCompleted && wasCompleted && habit.currentDay > 0) {
            habit.currentDay -= 1;
            habit.streakDays = Math.max(0, habit.streakDays - 1);
        }

        if (notes) {
            habit.lastNote = notes;
        }

        if (isCompleted && !wasCompleted) {
            recentLogs.unshift({
                habitTitle: habit.title,
                day: habit.currentDay,
                date: 'Today',
                note: notes || 'Completed today session successfully.'
            });
        }

        saveState();
        closeModal(elements.viewEditModal);
        renderAll();
        showToast(`Progress recorded for "${habit.title}"! Keep the streak going!`);
    }

    // Handle Create Habit Form Submit
    function handleCreateHabit(e) {
        e.preventDefault();
        const title = document.getElementById('new-habit-title').value.trim();
        const category = document.getElementById('new-habit-category').value.trim() || 'General';
        const description = document.getElementById('new-habit-description').value.trim();
        const targetDays = parseInt(document.getElementById('new-habit-days').value, 10) || 21;
        const icon = document.getElementById('new-habit-icon').value || 'fa-solid fa-star';

        if (!title) return;

        // Determine category class for styling
        let catClass = 'learning';
        const lowerCat = category.toLowerCase();
        if (lowerCat.includes('cod') || lowerCat.includes('dev') || lowerCat.includes('tech')) catClass = 'coding';
        else if (lowerCat.includes('fit') || lowerCat.includes('health') || lowerCat.includes('sport') || lowerCat.includes('run')) catClass = 'fitness';
        else if (lowerCat.includes('read') || lowerCat.includes('book')) catClass = 'reading';

        const newHabit = {
            id: 'habit-' + Date.now(),
            title: title,
            category: category,
            categoryClass: catClass,
            icon: icon,
            currentDay: 0,
            targetDays: targetDays,
            streakDays: 0,
            completedToday: false,
            status: 'active',
            description: description || 'Daily habit consistency goal.',
            lastNote: '',
            lastDate: '',
            createdAt: new Date().toISOString()
        };

        habits.push(newHabit);
        saveState();
        closeModal(elements.createHabitModal);
        elements.createHabitForm.reset();
        renderAll();
        showToast(`Habit "${newHabit.title}" created! Ready for Day 1.`);
    }

    // Render Analytics Consistency List (Image 5)
    function renderConsistencyList() {
        const listContainer = document.getElementById('analytics-consistency-list');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        habits.forEach(habit => {
            const percent = Math.min(100, Math.round((habit.currentDay / habit.targetDays) * 100));
            const item = document.createElement('div');
            item.className = 'consistency-item';
            item.innerHTML = `
                <span class="consistency-name">${escapeHtml(habit.title)}</span>
                <div class="consistency-bar-track">
                    <div class="consistency-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <span class="consistency-percent">${percent}%</span>
            `;
            listContainer.appendChild(item);
        });
    }

    // Render Interactive Analytics SVG Charts
    function renderAnalyticsCharts() {
        renderLineChart();
        renderBarChart();
    }

    // 1. Line Chart: "Progress Over Time" (Dynamic cumulative progress)
    function renderLineChart() {
        const svg = document.getElementById('progress-line-chart');
        const tooltip = document.getElementById('line-chart-tooltip');
        if (!svg) return;

        svg.innerHTML = '';

        const width = 560;
        const height = 280;
        const padding = { top: 25, right: 25, bottom: 35, left: 40 };

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Build data points starting from Day 1
        const totalCompleted = habits.reduce((acc, h) => acc + h.currentDay, 0);
        const data = [
            { label: 'Day 1', value: totalCompleted },
            { label: 'Day 2', value: totalCompleted },
            { label: 'Day 3', value: totalCompleted },
            { label: 'Day 4', value: totalCompleted },
            { label: 'Day 5', value: totalCompleted },
            { label: 'Day 6', value: totalCompleted },
            { label: 'Day 7', value: totalCompleted }
        ];

        const maxVal = Math.max(5, totalCompleted + 2);
        const yTicks = [0, 1, 2, 3, 4, 5];

        // Defs for gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'greenGradient');
        gradient.setAttribute('x1', '0');
        gradient.setAttribute('y1', '0');
        gradient.setAttribute('x2', '0');
        gradient.setAttribute('y2', '1');

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gradColor = isDark ? '#22c55e' : '#167a49';

        gradient.innerHTML = `
            <stop offset="0%" stop-color="${gradColor}" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="${gradColor}" stop-opacity="0.0"/>
        `;
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // Horizontal grid lines & Y labels
        yTicks.forEach(tick => {
            const y = padding.top + chartH - (tick / 5) * chartH;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'grid-line');
            svg.appendChild(line);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3.5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'axis-text');
            text.textContent = tick;
            svg.appendChild(text);
        });

        // Compute points
        const points = data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartW;
            const y = padding.top + chartH - (d.value / maxVal) * chartH;
            return { x, y, label: d.label, value: d.value };
        });

        // Line path
        let dPath = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            dPath += ` L ${points[i].x} ${points[i].y}`;
        }

        const dArea = `${dPath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

        const areaEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaEl.setAttribute('d', dArea);
        areaEl.setAttribute('class', 'chart-area');
        svg.appendChild(areaEl);

        const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lineEl.setAttribute('d', dPath);
        lineEl.setAttribute('class', 'chart-line');
        svg.appendChild(lineEl);

        // Draw points and X-axis labels
        points.forEach((p) => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', p.x);
            text.setAttribute('y', padding.top + chartH + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'axis-text');
            text.textContent = p.label;
            svg.appendChild(text);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', p.y);
            circle.setAttribute('r', '3.5');
            circle.setAttribute('class', 'chart-dot');

            circle.addEventListener('mouseenter', () => {
                if (!tooltip) return;
                const containerRect = svg.getBoundingClientRect();
                const circleRect = circle.getBoundingClientRect();
                const left = circleRect.left - containerRect.left + 3;
                const top = circleRect.top - containerRect.top;

                tooltip.innerHTML = `<strong>${p.label}</strong>: ${p.value} check-ins`;
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                tooltip.style.opacity = '1';
            });

            circle.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.opacity = '0';
            });

            svg.appendChild(circle);
        });
    }

    // 2. Bar Chart: "Habit Completion" (Dynamically rendered from habit currentDay)
    function renderBarChart() {
        const svg = document.getElementById('habit-bar-chart');
        const tooltip = document.getElementById('bar-chart-tooltip');
        if (!svg) return;

        svg.innerHTML = '';

        const width = 560;
        const height = 280;
        const padding = { top: 25, right: 25, bottom: 35, left: 40 };

        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        const maxVal = Math.max(5, ...habits.map(h => h.currentDay));
        const yTicks = [0, 1, 2, 3, 4, 5];

        // Horizontal grid lines & Y labels
        yTicks.forEach(tick => {
            const y = padding.top + chartH - (tick / 5) * chartH;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding.right);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'grid-line');
            svg.appendChild(line);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 3.5);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'axis-text');
            text.textContent = tick;
            svg.appendChild(text);
        });

        const numBars = habits.length || 1;
        const slotWidth = chartW / numBars;
        const barWidth = Math.min(64, slotWidth - 16);

        habits.forEach((item, idx) => {
            const barHeight = (item.currentDay / maxVal) * chartH;
            const x = padding.left + (idx * slotWidth) + (slotWidth - barWidth) / 2;
            const y = padding.top + chartH - barHeight;

            // Bar Rect
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', Math.min(y, padding.top + chartH - 2)); // keep baseline visible
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', Math.max(2, barHeight));
            rect.setAttribute('class', 'bar-rect');

            // Hover tooltip
            rect.addEventListener('mouseenter', () => {
                if (!tooltip) return;
                const containerRect = svg.getBoundingClientRect();
                const rectBox = rect.getBoundingClientRect();
                const left = rectBox.left - containerRect.left + (barWidth / 2);
                const top = rectBox.top - containerRect.top;

                tooltip.innerHTML = `<strong>${escapeHtml(item.title)}</strong>: ${item.currentDay} days`;
                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
                tooltip.style.opacity = '1';
            });

            rect.addEventListener('mouseleave', () => {
                if (tooltip) tooltip.style.opacity = '0';
            });

            svg.appendChild(rect);

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + (barWidth / 2));
            text.setAttribute('y', padding.top + chartH + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'axis-text');
            text.textContent = item.title;
            svg.appendChild(text);
        });
    }

    // Render Achievements dynamically based on real start level criteria
    function renderAchievements() {
        if (!elements.achievementsGrid) return;
        elements.achievementsGrid.innerHTML = '';

        const maxStreak = habits.length ? Math.max(...habits.map(h => h.streakDays)) : 0;
        const totalCheckins = habits.reduce((acc, h) => acc + h.currentDay, 0);
        const dsaHabit = habits.find(h => h.title.toLowerCase().includes('dsa') || h.categoryClass === 'coding');
        const readHabit = habits.find(h => h.title.toLowerCase().includes('read') || h.categoryClass === 'reading');

        const achievementsList = [
            {
                id: 'ach-1',
                title: '7-Day Streak Master',
                desc: 'Maintain consecutive habit check-ins for 7 days in a row.',
                icon: 'fa-solid fa-fire',
                current: maxStreak,
                target: 7,
                isUnlocked: maxStreak >= 7
            },
            {
                id: 'ach-2',
                title: '14-Day Consistency Pro',
                desc: 'Complete 14 uninterrupted days on your top habit.',
                icon: 'fa-solid fa-trophy',
                current: maxStreak,
                target: 14,
                isUnlocked: maxStreak >= 14
            },
            {
                id: 'ach-3',
                title: '21-Day Habit Champion',
                desc: 'Finish an entire 21-day routine transformation.',
                icon: 'fa-solid fa-award',
                current: maxStreak,
                target: 21,
                isUnlocked: habits.some(h => h.currentDay >= 21)
            },
            {
                id: 'ach-4',
                title: 'Bookworm Level 1',
                desc: 'Read consistently for 5 recorded sessions.',
                icon: 'fa-solid fa-book-bookmark',
                current: readHabit ? readHabit.currentDay : 0,
                target: 5,
                isUnlocked: readHabit ? readHabit.currentDay >= 5 : false
            },
            {
                id: 'ach-5',
                title: 'DSA Problem Solver',
                desc: 'Solve and review algorithm patterns for 5 recorded days.',
                icon: 'fa-solid fa-laptop-code',
                current: dsaHabit ? dsaHabit.currentDay : 0,
                target: 5,
                isUnlocked: dsaHabit ? dsaHabit.currentDay >= 5 : false
            },
            {
                id: 'ach-6',
                title: 'Century Club',
                desc: 'Accumulate 100 total completed habit days.',
                icon: 'fa-solid fa-medal',
                current: totalCheckins,
                target: 100,
                isUnlocked: totalCheckins >= 100
            }
        ];

        let unlockedCount = 0;

        achievementsList.forEach(ach => {
            if (ach.isUnlocked) unlockedCount++;

            const badgeClass = ach.isUnlocked ? 'badge-gold' : 'badge-locked';
            const statusHtml = ach.isUnlocked
                ? `<span style="display: inline-block; margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--green-primary);"><i class="fa-solid fa-check"></i> UNLOCKED</span>`
                : `<span style="display: inline-block; margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--text-secondary);">${ach.current} / ${ach.target} Days</span>`;

            const card = document.createElement('div');
            card.className = 'achievement-card';
            card.innerHTML = `
                <div class="achievement-badge ${badgeClass}">
                    <i class="${ach.icon}"></i>
                </div>
                <div>
                    <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">${escapeHtml(ach.title)}</h4>
                    <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(ach.desc)}</p>
                    ${statusHtml}
                </div>
            `;
            elements.achievementsGrid.appendChild(card);
        });

        if (elements.profileUnlockedBadges) {
            elements.profileUnlockedBadges.textContent = unlockedCount;
        }
    }

    // Helper: Escape HTML string
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
