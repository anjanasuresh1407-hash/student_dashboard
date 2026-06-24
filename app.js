/**
 * AURA AI STUDENT DASHBOARD — CORE APPLICATION LOGIC
 * Includes: State Management, NLP Parser, AI Prioritization, 
 * Web Audio Ambient Synthesizer, Timer, and Chart.js rendering.
 */

class AuraApp {
    constructor() {
        this.state = this.loadState();
        this.charts = {};
        this.timerInterval = null;
        this.timerTimeLeft = 25 * 60; // 25 minutes
        this.timerTotalTime = 25 * 60;
        this.timerRunning = false;
        this.timerMode = 'Focus';
        
        // Ambient Audio Context & Nodes
        this.audioCtx = null;
        this.soundSources = {
            lofi: { node: null, gain: null, playing: false },
            rain: { node: null, gain: null, playing: false },
            cafe: { node: null, gain: null, playing: false }
        };

        this.init();
    }

    // --- STATE MANAGEMENT ---
    loadState() {
        const STATE_VERSION = 'v2'; // Bump to force refresh with new planner data
        const saved = localStorage.getItem('aura_student_state');
        const savedVersion = localStorage.getItem('aura_state_version');
        if (saved && savedVersion === STATE_VERSION) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse saved state, resetting...", e);
            }
        }

        // Default Rich Seed Data
        const defaultState = {
            tasks: [
                {
                    id: "task-1",
                    title: "Implement Red-Black Tree Rotations",
                    course: "CS-301",
                    deadline: this.getRelativeDateStr(1, "17:00"),
                    importance: 5,
                    difficulty: 4,
                    duration: 3,
                    quadrant: "q1",
                    completed: false
                },
                {
                    id: "task-2",
                    title: "Linear Algebra Problem Set 4",
                    course: "MATH-240",
                    deadline: this.getRelativeDateStr(2, "23:59"),
                    importance: 4,
                    difficulty: 3,
                    duration: 2,
                    quadrant: "q1",
                    completed: false
                },
                {
                    id: "task-3",
                    title: "Draft Creative Writing Poem",
                    course: "WRIT-150",
                    deadline: this.getRelativeDateStr(4, "12:00"),
                    importance: 3,
                    difficulty: 2,
                    duration: 1.5,
                    quadrant: "q2",
                    completed: false
                },
                {
                    id: "task-4",
                    title: "Submit resume to Career Portal",
                    course: "INTERN",
                    deadline: this.getRelativeDateStr(0, "18:00"),
                    importance: 5,
                    difficulty: 2,
                    duration: 1,
                    quadrant: "q1",
                    completed: true
                },
                {
                    id: "task-5",
                    title: "Meal prep for upcoming week",
                    course: "PERSONAL",
                    deadline: this.getRelativeDateStr(3, "10:00"),
                    importance: 2,
                    difficulty: 1,
                    duration: 2,
                    quadrant: "q4",
                    completed: false
                },
                {
                    id: "task-6",
                    title: "Reply to Recruiter Follow-up",
                    course: "INTERN",
                    deadline: this.getRelativeDateStr(1, "09:00"),
                    importance: 4,
                    difficulty: 2,
                    duration: 0.5,
                    quadrant: "q3",
                    completed: false
                }
            ],
            calendarEvents: [
                // Monday
                { id: "e1", title: "CS 301 — Intro to Trees & Graphs", type: "class", day: 0, startHour: 10, endHour: 11.5, course: "CS-301" },
                { id: "e2", title: "MATH 240 — Eigenvalue Decomposition", type: "class", day: 0, startHour: 13, endHour: 14.5, course: "MATH-240" },
                
                // Tuesday
                { id: "e3", title: "WRIT 150 — Poetry Craft Workshop", type: "class", day: 1, startHour: 11, endHour: 12.5, course: "WRIT-150" },
                { id: "e4", title: "Career Fair — Tech Pavilion", type: "extracurricular", day: 1, startHour: 15, endHour: 16.5, course: "INTERN" },
                
                // Wednesday (Today)
                { id: "e5", title: "CS 301 — Red-Black Tree Deep Dive", type: "class", day: 2, startHour: 10, endHour: 11.5, course: "CS-301" },
                { id: "e6", title: "MATH 240 — Singular Value Decomposition", type: "class", day: 2, startHour: 13, endHour: 14.5, course: "MATH-240" },
                { id: "e7", title: "AI Study Block: RB-Tree Practice", type: "study", day: 2, startHour: 15.5, endHour: 17.5, course: "CS-301" },
                
                // Thursday
                { id: "e8", title: "WRIT 150 — Peer Review Session", type: "class", day: 3, startHour: 11, endHour: 12.5, course: "WRIT-150" },
                { id: "e9", title: "AI Study Block: Linear Algebra HW 4", type: "study", day: 3, startHour: 14, endHour: 16, course: "MATH-240" },
                { id: "e10", title: "Mock Interview Prep", type: "extracurricular", day: 3, startHour: 17, endHour: 18, course: "INTERN" },
                
                // Friday
                { id: "e11", title: "CS 301 — Lab: AVL & Heap Impl.", type: "class", day: 4, startHour: 10, endHour: 12, course: "CS-301" },
                { id: "e12", title: "AI Study Block: Essay Outline", type: "study", day: 4, startHour: 14, endHour: 15.5, course: "WRIT-150" },
                
                // Saturday
                { id: "e13", title: "Hackathon Team Standup", type: "extracurricular", day: 5, startHour: 11, endHour: 12, course: "PERSONAL" },
            ],
            focusTimeToday: 1.8, // hours
            chatHistory: [
                { sender: "bot", text: "Hello, Alex! I am Aura, your personal academic co-pilot. I have synchronized your syllabus deliverables, class schedule, and focus metrics. How can I help you optimize your study flow today?" }
            ]
        };

        localStorage.setItem('aura_student_state', JSON.stringify(defaultState));
        localStorage.setItem('aura_state_version', STATE_VERSION);
        return defaultState;
    }

    saveState() {
        localStorage.setItem('aura_student_state', JSON.stringify(this.state));
    }

    getRelativeDateStr(daysOffset, timeStr) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${timeStr}`;
    }

    // --- INITIALIZATION ---
    init() {
        this.setupDateTime();
        this.setupNavEventListeners();
        this.setupTaskFormEventListeners();
        this.setupNlpEventListeners();
        this.setupCopilotEventListeners();
        this.setupPomodoroEventListeners();
        this.setupAmbienceEventListeners();
        this.setupPlannerEventListeners();

        // Initial Data Renders
        this.renderAll();
        
        // Initial Chart Draw
        setTimeout(() => {
            this.initCharts();
        }, 100);

        // Initial Icon Create
        lucide.createIcons();
    }

    setupDateTime() {
        // Set dynamic date in header
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const now = new Date();
        const liveDateEl = document.getElementById('live-date');
        if (liveDateEl) {
            liveDateEl.innerText = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        }
    }

    // --- NAVIGATION TABS ---
    setupNavEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.getAttribute('data-tab');
                this.setActiveTab(targetTab);
            });
        });

        const copilotToggle = document.getElementById('copilot-toggle');
        const closeCopilot = document.getElementById('close-copilot-btn');
        const copilotSidebar = document.getElementById('copilot-sidebar');

        if (copilotToggle && copilotSidebar) {
            copilotToggle.addEventListener('click', () => {
                copilotSidebar.classList.toggle('open');
            });
        }

        if (closeCopilot && copilotSidebar) {
            closeCopilot.addEventListener('click', () => {
                copilotSidebar.classList.remove('open');
            });
        }
    }

    setActiveTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            if (pane.id === tabName) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Trigger chart updates or setup when changing tabs
        if (tabName === 'analytics') {
            this.updateCharts();
        } else if (tabName === 'calendar') {
            this.renderPlanner();
        }
    }

    // --- NLP ENGINE (AI NATURAL LANGUAGE ADDER) ---
    setupNlpEventListeners() {
        const nlpSubmit1 = document.getElementById('nlp-submit-btn');
        const nlpInput1 = document.getElementById('nlp-task-input');
        const nlpSubmit2 = document.getElementById('nlp-submit-btn-2');
        const nlpInput2 = document.getElementById('nlp-task-input-2');

        const handleNlpAdd = (inputEl) => {
            const rawText = inputEl.value.trim();
            if (!rawText) return;

            const parsedTask = this.parseTaskNLP(rawText);
            this.state.tasks.push(parsedTask);
            this.saveState();
            this.renderAll();
            this.updateCharts();

            // Clear input and show floating feedback
            inputEl.value = '';
            this.triggerNlpFeedback(parsedTask);
        };

        if (nlpSubmit1 && nlpInput1) {
            nlpSubmit1.addEventListener('click', () => handleNlpAdd(nlpInput1));
            nlpInput1.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleNlpAdd(nlpInput1);
            });
        }

        if (nlpSubmit2 && nlpInput2) {
            nlpSubmit2.addEventListener('click', () => handleNlpAdd(nlpInput2));
            nlpInput2.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleNlpAdd(nlpInput2);
            });
        }
    }

    parseTaskNLP(text) {
        const now = new Date();
        let title = text;
        let deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default tomorrow
        let importance = 3;
        let difficulty = 3;
        let duration = 2;
        let course = 'PERSONAL';
        let quadrant = 'q2';

        // Extract Course / Category
        if (/data structure|cs301|cs 301|programming/i.test(text)) {
            course = 'CS-301';
        } else if (/math|algebra|linear|calculus|240/i.test(text)) {
            course = 'MATH-240';
        } else if (/write|poetry|poem|essay|draft|150/i.test(text)) {
            course = 'WRIT-150';
        } else if (/resume|career|intern|apply|recruit/i.test(text)) {
            course = 'INTERN';
        }

        // Clean text of course details for cleaner titles
        title = title.replace(/(cs\s?301|math\s?240|writ\s?150|internship|personal)/gi, '').trim();

        // Extract Priority / Urgency
        if (/urgent|critical|asap|high priority|important/i.test(text)) {
            importance = 5;
            quadrant = 'q1';
        } else if (/medium|normal/i.test(text)) {
            importance = 3;
            quadrant = 'q2';
        } else if (/low|minor|delegate|whenever/i.test(text)) {
            importance = 2;
            quadrant = 'q3';
        }

        // Extract Deadlines
        const tomorrowMatch = /tomorrow(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i.exec(text);
        const inDaysMatch = /in\s+(\d+)\s+days?/i.exec(text);
        const weekdayMatch = /on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.exec(text);

        if (tomorrowMatch) {
            const tDate = new Date();
            tDate.setDate(tDate.getDate() + 1);
            let hours = 17; // Default 5 PM
            let mins = 0;
            if (tomorrowMatch[1]) {
                hours = parseInt(tomorrowMatch[1]);
                if (tomorrowMatch[3] && tomorrowMatch[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
                if (tomorrowMatch[3] && tomorrowMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
                mins = tomorrowMatch[2] ? parseInt(tomorrowMatch[2]) : 0;
            }
            tDate.setHours(hours, mins, 0, 0);
            deadline = tDate;
            quadrant = (importance >= 4) ? 'q1' : 'q3'; // Urgent
        } else if (inDaysMatch) {
            const offset = parseInt(inDaysMatch[1]);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + offset);
            futureDate.setHours(23, 59, 0, 0);
            deadline = futureDate;
            quadrant = (offset <= 2) ? (importance >= 4 ? 'q1' : 'q3') : (importance >= 4 ? 'q2' : 'q4');
        } else if (weekdayMatch) {
            const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekdayMatch[1].toLowerCase());
            const currentDay = now.getDay();
            let distance = targetDay - currentDay;
            if (distance <= 0) distance += 7; // Next week
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + distance);
            futureDate.setHours(17, 0, 0, 0);
            deadline = futureDate;
            quadrant = (distance <= 2) ? (importance >= 4 ? 'q1' : 'q3') : (importance >= 4 ? 'q2' : 'q4');
        }

        // Strip off deadline keywords from title
        title = title.replace(/(tomorrow|in \d+ days|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))/gi, '');
        title = title.replace(/(at \d{1,2}(:\d{2})? ?(am|pm)?|due by|due)/gi, '').trim();

        // Fallback for empty title
        if (!title) title = `Study deliverable for ${course}`;

        // Format ISO Datetime Local string
        const pad = (n) => String(n).padStart(2, '0');
        const formattedDeadline = `${deadline.getFullYear()}-${pad(deadline.getMonth() + 1)}-${pad(deadline.getDate())}T${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;

        return {
            id: `task-${Date.now()}`,
            title: title.charAt(0).toUpperCase() + title.slice(1),
            course,
            deadline: formattedDeadline,
            importance,
            difficulty,
            duration,
            quadrant,
            completed: false
        };
    }

    triggerNlpFeedback(task) {
        const statusEl = document.getElementById('nlp-status');
        if (statusEl) {
            statusEl.innerHTML = `<span class="nlp-status-indicator positive animate-pulse"><i data-lucide="check-circle-2"></i> Aura parsed task: "${task.title}" under ${task.course} (Due ${task.deadline.replace('T', ' ')}).</span>`;
            lucide.createIcons();
            
            // Revert back to help after 4 seconds
            setTimeout(() => {
                statusEl.innerHTML = `<span class="nlp-status-indicator"><i data-lucide="sparkles"></i> AI NLP engine active. Write naturally.</span>`;
                lucide.createIcons();
            }, 5000);
        }
    }

    // --- MANUAL TASK DIALOG ---
    setupTaskFormEventListeners() {
        const modal = document.getElementById('add-task-modal');
        const openBtn = document.getElementById('open-add-task-modal');
        const closeBtn = document.getElementById('close-task-modal');
        const cancelBtn = document.getElementById('btn-cancel-modal');
        const form = document.getElementById('add-task-form');

        const openModal = () => modal.classList.remove('hidden');
        const closeModal = () => {
            modal.classList.add('hidden');
            form.reset();
        };

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const task = {
                    id: `task-${Date.now()}`,
                    title: document.getElementById('task-title').value,
                    course: document.getElementById('task-course').value,
                    deadline: document.getElementById('task-deadline').value,
                    importance: parseInt(document.getElementById('task-importance').value),
                    difficulty: parseInt(document.getElementById('task-difficulty').value),
                    duration: parseFloat(document.getElementById('task-duration').value),
                    quadrant: document.getElementById('task-quadrant').value,
                    completed: false
                };

                this.state.tasks.push(task);
                this.saveState();
                this.renderAll();
                this.updateCharts();
                closeModal();
            });
        }
    }

    // --- DYNAMIC RENDERING COMPOSITIONS ---
    renderAll() {
        this.renderDashboardPriorities();
        this.renderDashboardSchedule();
        this.renderMatrixQuadrants();
        this.renderFlatTasksList();
        this.renderPlanner();
        this.updateCognitiveLoadGauge();
        this.updateStatsCounters();
        this.populateFocusTaskSelector();
        this.populateRoadmapSelector();
    }

    // AI Priority Score Formula
    calculatePriorityScore(task) {
        if (task.completed) return 0;

        const now = new Date();
        const deadlineDate = new Date(task.deadline);
        const diffMs = deadlineDate - now;
        const hoursUntil = diffMs / (1000 * 60 * 60);

        // Importance weight: 15pts per star
        const importanceWeight = task.importance * 15;
        
        // Difficulty weight: 8pts per scale
        const difficultyWeight = task.difficulty * 8;

        // Deadline urgency: decaying logarithmic curve (max 100 points for critical close deadlines)
        let urgencyWeight = 0;
        if (hoursUntil > 0) {
            urgencyWeight = Math.max(0, 100 - (hoursUntil / 2)); 
        } else {
            urgencyWeight = 110; // Overdue items get max alert score
        }

        // Duration adjustment: 3pts per estimated hour
        const durationWeight = task.duration * 3;

        return Math.round(importanceWeight + difficultyWeight + urgencyWeight + durationWeight);
    }

    updateStatsCounters() {
        const completedTasksCount = document.getElementById('completed-tasks-count');
        const completionRateText = document.getElementById('completion-rate-text');
        const focusHoursCount = document.getElementById('focus-hours-count');

        const totalTasks = this.state.tasks.length;
        const completedTasks = this.state.tasks.filter(t => t.completed).length;

        if (completedTasksCount) {
            completedTasksCount.innerText = `${completedTasks}/${totalTasks}`;
        }
        if (completionRateText) {
            const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            completionRateText.innerHTML = `<i data-lucide="check-circle-2"></i> ${rate}% completion rate`;
            lucide.createIcons();
        }
        if (focusHoursCount) {
            focusHoursCount.innerText = `${this.state.focusTimeToday.toFixed(1)}h`;
        }
    }

    updateCognitiveLoadGauge() {
        const activeTasks = this.state.tasks.filter(t => !t.completed);
        let totalLoad = 0;

        activeTasks.forEach(task => {
            const now = new Date();
            const deadlineDate = new Date(task.deadline);
            const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
            
            // Base task stress weight
            const taskWeight = task.importance * task.difficulty;
            // Proximity multiplier
            const proximityFactor = diffHours > 0 ? (1 + (24 / Math.max(1, diffHours))) : 2.5;

            totalLoad += taskWeight * proximityFactor;
        });

        // Normalize total load between 0% - 100%
        // Max typical critical load threshold is ~200 points
        let loadPercent = Math.min(100, Math.round((totalLoad / 200) * 100));
        if (activeTasks.length === 0) loadPercent = 10; // Baseline metabolic load

        const fillEl = document.getElementById('cognitive-load-fill');
        const valEl = document.getElementById('cognitive-load-val');
        const badgeEl = document.getElementById('cognitive-load-badge');

        if (fillEl) fillEl.style.width = `${loadPercent}%`;
        if (valEl) valEl.innerText = `${loadPercent}%`;

        if (badgeEl) {
            badgeEl.className = 'load-badge';
            if (loadPercent < 45) {
                badgeEl.classList.add('optimal');
                badgeEl.innerText = 'Optimal';
            } else if (loadPercent < 75) {
                badgeEl.classList.add('moderate');
                badgeEl.innerText = 'Moderate';
            } else {
                badgeEl.classList.add('stressed');
                badgeEl.innerText = 'Overloaded';
            }
        }
    }

    renderDashboardPriorities() {
        const container = document.getElementById('dashboard-priority-list');
        if (!container) return;

        container.innerHTML = '';

        // Compute scores and sort descending
        const scoredTasks = this.state.tasks
            .filter(t => !t.completed)
            .map(t => ({ ...t, score: this.calculatePriorityScore(t) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 4); // Display top 4

        if (scoredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="sparkles" class="empty-icon text-indigo"></i>
                    <p>All clean! Aura suggests scheduling a breaks review or focus session.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        scoredTasks.forEach(task => {
            const hoursLeft = Math.round((new Date(task.deadline) - new Date()) / (1000 * 60 * 60));
            const timeString = hoursLeft > 0 
                ? (hoursLeft > 24 ? `due in ${Math.round(hoursLeft/24)} days` : `due in ${hoursLeft} hours`)
                : 'overdue';

            const scoreClass = task.score > 120 ? 'score-high' : (task.score > 80 ? 'score-medium' : 'score-low');

            const item = document.createElement('div');
            item.className = 'task-card-mini';
            item.innerHTML = `
                <div class="task-mini-left">
                    <label class="check-container">
                        <input type="checkbox" onchange="app.toggleTaskCompletion('${task.id}')">
                        <span class="checkbox-custom"></span>
                    </label>
                    <div class="task-mini-info">
                        <div class="task-mini-title">${task.title}</div>
                        <div class="task-mini-meta">
                            <span class="course-tag ${task.course}">${task.course}</span>
                            <span>•</span>
                            <span>${timeString}</span>
                        </div>
                    </div>
                </div>
                <div class="task-mini-right">
                    <div class="ai-priority-score-badge ${scoreClass}">
                        <span>Aura Score</span>
                        <span class="score-val">${task.score}</span>
                    </div>
                </div>
            `;
            container.appendChild(item);
        });

        lucide.createIcons();
    }

    renderDashboardSchedule() {
        const container = document.getElementById('dashboard-schedule-list');
        if (!container) return;

        container.innerHTML = '';

        // Display today's (Wednesday/Day 2) schedule timeline
        const todaysEvents = this.state.calendarEvents
            .filter(e => e.day === 2)
            .sort((a, b) => a.startHour - b.startHour);

        if (todaysEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No calendar events listed for today.</p>
                </div>
            `;
            return;
        }

        todaysEvents.forEach(evt => {
            const startStr = this.formatHour(evt.startHour);
            const endStr = this.formatHour(evt.endHour);
            
            const timelineItem = document.createElement('div');
            timelineItem.className = `timeline-item ${evt.type}-item`;
            timelineItem.innerHTML = `
                <div class="timeline-time">${startStr} - ${endStr}</div>
                <div class="timeline-card">
                    <div class="timeline-title">${evt.title}</div>
                    <div class="timeline-desc">${evt.course || 'Personal'}</div>
                </div>
            `;
            container.appendChild(timelineItem);
        });
    }

    renderMatrixQuadrants() {
        const q1List = document.getElementById('quadrant-q1-list');
        const q2List = document.getElementById('quadrant-q2-list');
        const q3List = document.getElementById('quadrant-q3-list');
        const q4List = document.getElementById('quadrant-q4-list');

        if (!q1List || !q2List || !q3List || !q4List) return;

        // Reset lists
        q1List.innerHTML = '';
        q2List.innerHTML = '';
        q3List.innerHTML = '';
        q4List.innerHTML = '';

        let counts = { q1: 0, q2: 0, q3: 0, q4: 0 };

        this.state.tasks.forEach(task => {
            if (task.completed) return;
            
            const item = document.createElement('div');
            item.className = 'matrix-task-item';
            
            // Format deadline display
            const d = new Date(task.deadline);
            const dateStr = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});

            item.innerHTML = `
                <div class="matrix-task-row1">
                    <span class="matrix-task-title">${task.title}</span>
                    <button class="delete-btn" onclick="app.deleteTask('${task.id}')" title="Delete Task"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="matrix-task-details">
                    <span class="course-tag ${task.course}">${task.course}</span>
                    <span>${dateStr}</span>
                </div>
            `;

            counts[task.quadrant]++;

            switch(task.quadrant) {
                case 'q1': q1List.appendChild(item); break;
                case 'q2': q2List.appendChild(item); break;
                case 'q3': q3List.appendChild(item); break;
                case 'q4': q4List.appendChild(item); break;
            }
        });

        // Set counts in headers
        document.getElementById('q1-count').innerText = counts.q1;
        document.getElementById('q2-count').innerText = counts.q2;
        document.getElementById('q3-count').innerText = counts.q3;
        document.getElementById('q4-count').innerText = counts.q4;

        lucide.createIcons();
    }

    renderFlatTasksList() {
        const container = document.getElementById('flat-tasks-list');
        if (!container) return;

        container.innerHTML = '';

        const courseFilter = document.getElementById('filter-course').value;
        const statusFilter = document.getElementById('filter-status').value;
        const sortBy = document.getElementById('sort-by').value;

        // Clone and map with dynamic priority scores
        let processedTasks = this.state.tasks.map(t => ({
            ...t,
            score: this.calculatePriorityScore(t)
        }));

        // Filter
        if (courseFilter !== 'all') {
            processedTasks = processedTasks.filter(t => t.course === courseFilter);
        }
        if (statusFilter !== 'all') {
            const isCompleted = (statusFilter === 'completed');
            processedTasks = processedTasks.filter(t => t.completed === isCompleted);
        }

        // Sort
        if (sortBy === 'priority-score') {
            processedTasks.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'deadline') {
            processedTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        } else if (sortBy === 'weight') {
            processedTasks.sort((a, b) => b.importance - a.importance);
        }

        if (processedTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: 40px; text-align: center;">
                    <p>No logged items matching the selected filters.</p>
                </div>
            `;
            return;
        }

        processedTasks.forEach(task => {
            const d = new Date(task.deadline);
            const dateStr = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
            const completedClass = task.completed ? 'completed' : '';
            const checkedAttr = task.completed ? 'checked' : '';
            const scoreClass = task.score > 120 ? 'score-high' : (task.score > 80 ? 'score-medium' : 'score-low');

            const row = document.createElement('div');
            row.className = `flat-task-row ${completedClass}`;
            row.innerHTML = `
                <div class="task-col-title">
                    <label class="check-container">
                        <input type="checkbox" ${checkedAttr} onchange="app.toggleTaskCompletion('${task.id}')">
                        <span class="checkbox-custom"></span>
                    </label>
                    <span class="flat-task-title-text" title="${task.title}">${task.title}</span>
                </div>
                <div class="task-col-course">
                    <span class="course-tag ${task.course}">${task.course}</span>
                </div>
                <div class="task-col-deadline">
                    <i data-lucide="calendar"></i>
                    <span>${dateStr}</span>
                </div>
                <div class="task-col-score">
                    ${task.completed ? '-' : `<div class="ai-priority-score-badge ${scoreClass}"><span>Score</span><span class="score-val">${task.score}</span></div>`}
                </div>
                <div class="task-col-actions">
                    <button class="delete-btn" onclick="app.deleteTask('${task.id}')" title="Delete Task"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            container.appendChild(row);
        });

        lucide.createIcons();
    }

    setupPlannerEventListeners() {
        const c1 = document.getElementById('toggle-layer-classes');
        const c2 = document.getElementById('toggle-layer-tasks');
        const c3 = document.getElementById('toggle-layer-study');
        const c4 = document.getElementById('toggle-layer-extracurricular');

        const reRender = () => this.renderPlanner();

        if (c1) c1.addEventListener('change', reRender);
        if (c2) c2.addEventListener('change', reRender);
        if (c3) c3.addEventListener('change', reRender);
        if (c4) c4.addEventListener('change', reRender);

        const btnAutoBlocks = document.getElementById('btn-suggest-study-blocks');
        if (btnAutoBlocks) {
            btnAutoBlocks.addEventListener('click', () => this.suggestDailyFocus());
        }

        const btnRoadmap = document.getElementById('btn-create-roadmap');
        if (btnRoadmap) {
            btnRoadmap.addEventListener('click', () => this.createAuraRoadmap());
        }
    }

    renderPlanner() {
        const grid = document.getElementById('weekly-planner-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // Add Hour Indicator Labels
        // Hour ranges from 8 (8 AM) to 22 (10 PM)
        for (let h = 8; h <= 22; h++) {
            const cell = document.createElement('div');
            cell.className = 'grid-time-cell';
            cell.innerText = this.formatHour(h);
            cell.style.gridRow = `${h - 7}`;
            cell.style.gridColumn = `1`;
            grid.appendChild(cell);
        }

        // Add Day Columns placeholder boxes (for border styling grids)
        for (let col = 2; col <= 8; col++) {
            for (let r = 1; r <= 15; r++) {
                const cell = document.createElement('div');
                cell.className = 'grid-day-column';
                cell.style.gridRow = `${r}`;
                cell.style.gridColumn = `${col}`;
                grid.appendChild(cell);
            }
        }

        // Filter flags
        const showClasses = document.getElementById('toggle-layer-classes')?.checked ?? true;
        const showTasks = document.getElementById('toggle-layer-tasks')?.checked ?? true;
        const showStudy = document.getElementById('toggle-layer-study')?.checked ?? true;
        const showExtra = document.getElementById('toggle-layer-extracurricular')?.checked ?? true;

        // Render Events
        this.state.calendarEvents.forEach(evt => {
            // Apply filtering rules
            if (evt.type === 'class' && !showClasses) return;
            if (evt.type === 'task' && !showTasks) return;
            if (evt.type === 'study' && !showStudy) return;
            if (evt.type === 'extracurricular' && !showExtra) return;

            // Day: 0 (Mon) to 6 (Sun). Grid column starts from 2 (since column 1 is hours)
            const col = evt.day + 2;
            const startRowIndex = evt.startHour - 7; // e.g. 10am = row index 3
            const durationHours = evt.endHour - evt.startHour;
            const heightPx = durationHours * 60; // 60px per hour row
            const topOffset = (evt.startHour % 1) * 60; // e.g. 10.5 hour start => offset top 30px

            const block = document.createElement('div');
            block.className = `planner-event event-type-${evt.type}`;
            block.style.gridColumn = `${col}`;
            block.style.gridRow = `${Math.floor(startRowIndex)}`;
            block.style.height = `${heightPx}px`;
            block.style.top = `${topOffset}px`;

            block.innerHTML = `
                <div class="planner-event-title">${evt.title}</div>
                <div class="planner-event-time">${this.formatHour(evt.startHour)} - ${this.formatHour(evt.endHour)}</div>
            `;

            grid.appendChild(block);
        });
    }

    // --- POMODORO TIMER SYSTEM ---
    setupPomodoroEventListeners() {
        const playBtn = document.getElementById('timer-btn-play');
        const playIcon = document.getElementById('play-icon');
        const resetBtn = document.getElementById('timer-btn-reset');
        const presetContainer = document.getElementById('timer-presets');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (this.timerRunning) {
                    this.pauseTimer();
                    playIcon.setAttribute('data-lucide', 'play');
                } else {
                    this.startTimer();
                    playIcon.setAttribute('data-lucide', 'pause');
                }
                lucide.createIcons();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTimer());
        }

        if (presetContainer) {
            presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const mins = parseInt(btn.getAttribute('data-time'));
                    const mode = btn.getAttribute('data-mode');
                    
                    this.setTimerPreset(mins, mode);
                });
            });
        }

        // Set circle SVG stroke dasharray properties
        const circle = document.getElementById('pomodoro-progress');
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = 0;
        }

        // Setup Task Selector
        const selector = document.getElementById('active-focus-task-select');
        if (selector) {
            selector.addEventListener('change', (e) => {
                const taskId = e.target.value;
                const preview = document.getElementById('focus-task-detail-preview');
                const task = this.state.tasks.find(t => t.id === taskId);

                if (taskId !== 'none' && task) {
                    preview.classList.remove('hidden');
                    document.getElementById('focus-task-title').innerText = task.title;
                    document.getElementById('focus-task-urgency').innerText = task.quadrant === 'q1' ? 'Urgent' : 'Routine';
                    document.getElementById('focus-task-urgency').className = `active-badge ${task.quadrant === 'q1' ? 'urgent' : 'secondary-btn'}`;
                    document.getElementById('focus-task-deadline').innerText = `Due ${new Date(task.deadline).toLocaleDateString()}`;
                } else {
                    preview.classList.add('hidden');
                }
            });
        }
    }

    setTimerPreset(minutes, mode) {
        this.pauseTimer();
        this.timerTimeLeft = minutes * 60;
        this.timerTotalTime = minutes * 60;
        this.timerMode = mode;
        this.updateTimerDisplay();

        const playIcon = document.getElementById('play-icon');
        if (playIcon) playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();

        document.getElementById('pomodoro-mode').innerText = mode === 'Focus' ? 'Focus Session' : mode;
    }

    startTimer() {
        this.timerRunning = true;
        this.timerInterval = setInterval(() => {
            this.timerTimeLeft--;
            this.updateTimerDisplay();

            if (this.timerTimeLeft <= 0) {
                this.timerFinished();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
    }

    resetTimer() {
        this.pauseTimer();
        this.timerTimeLeft = this.timerTotalTime;
        this.updateTimerDisplay();

        const playIcon = document.getElementById('play-icon');
        if (playIcon) playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
    }

    updateTimerDisplay() {
        const timeEl = document.getElementById('pomodoro-time');
        if (!timeEl) return;

        const mins = Math.floor(this.timerTimeLeft / 60);
        const secs = this.timerTimeLeft % 60;
        timeEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        // Circular progression
        const circle = document.getElementById('pomodoro-progress');
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const fraction = this.timerTimeLeft / this.timerTotalTime;
            const offset = circumference - (fraction * circumference);
            circle.style.strokeDashoffset = offset;
        }
    }

    timerFinished() {
        this.pauseTimer();
        
        // Play synth alert beep
        this.playBeepNotification();

        if (this.timerMode === 'Focus') {
            this.state.focusTimeToday += (this.timerTotalTime / 3600);
            this.saveState();
            this.updateStatsCounters();
            this.updateCharts();
            
            // Auto complete or alert active task progress
            const activeTaskId = document.getElementById('active-focus-task-select').value;
            if (activeTaskId !== 'none') {
                this.addCopilotMessage(`System`, `Great job! You finished a focus session for "${this.state.tasks.find(t=>t.id === activeTaskId).title}". Aura suggests taking a 5-minute break.`);
            } else {
                this.addCopilotMessage(`System`, `Timer complete! You logged ${Math.round(this.timerTotalTime/60)} minutes of focus.`);
            }
        }
        
        this.resetTimer();
    }

    playBeepNotification() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
            
            osc.start();
            osc.stop(ctx.currentTime + 1.0);
        } catch (e) {
            console.error("Alert chime synth failed", e);
        }
    }

    // --- COGNITIVE AMBIENT AUDIO MIXER (WEB AUDIO API) ---
    setupAmbienceEventListeners() {
        const toggleLofiBtn = document.getElementById('toggle-track-lofi');
        const sliderLofi = document.getElementById('volume-track-lofi');
        const toggleRainBtn = document.getElementById('toggle-track-rain');
        const sliderRain = document.getElementById('volume-track-rain');
        const toggleCafeBtn = document.getElementById('toggle-track-cafe');
        const sliderCafe = document.getElementById('volume-track-cafe');

        const initCtx = () => {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        };

        if (toggleLofiBtn) {
            toggleLofiBtn.addEventListener('click', () => {
                initCtx();
                this.toggleSound('lofi', toggleLofiBtn, sliderLofi);
            });
        }
        if (sliderLofi) {
            sliderLofi.addEventListener('input', (e) => {
                this.setSoundVolume('lofi', e.target.value);
            });
        }

        if (toggleRainBtn) {
            toggleRainBtn.addEventListener('click', () => {
                initCtx();
                this.toggleSound('rain', toggleRainBtn, sliderRain);
            });
        }
        if (sliderRain) {
            sliderRain.addEventListener('input', (e) => {
                this.setSoundVolume('rain', e.target.value);
            });
        }

        if (toggleCafeBtn) {
            toggleCafeBtn.addEventListener('click', () => {
                initCtx();
                this.toggleSound('cafe', toggleCafeBtn, sliderCafe);
            });
        }
        if (sliderCafe) {
            sliderCafe.addEventListener('input', (e) => {
                this.setSoundVolume('cafe', e.target.value);
            });
        }
    }

    toggleSound(type, btnEl, sliderEl) {
        const track = this.soundSources[type];
        if (track.playing) {
            this.stopAudioSynthesis(type);
            btnEl.classList.remove('playing');
            btnEl.innerHTML = '<i data-lucide="play"></i>';
        } else {
            this.startAudioSynthesis(type, sliderEl.value / 100);
            btnEl.classList.add('playing');
            btnEl.innerHTML = '<i data-lucide="square"></i>';
        }
        lucide.createIcons();
    }

    setSoundVolume(type, val) {
        const track = this.soundSources[type];
        if (track.gain) {
            track.gain.gain.setValueAtTime(val / 100, this.audioCtx.currentTime);
        }
    }

    startAudioSynthesis(type, volume) {
        const track = this.soundSources[type];
        track.playing = true;

        track.gain = this.audioCtx.createGain();
        track.gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        track.gain.connect(this.audioCtx.destination);

        if (type === 'rain') {
            // Synthesize Rain: Bandpass-filtered Pink/White Noise with dynamic amplitude modulation (wind gusts)
            const bufferSize = 2 * this.audioCtx.sampleRate;
            const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.audioCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);
            filter.Q.setValueAtTime(0.6, this.audioCtx.currentTime);

            // Wind Gust modulator
            const lfo = this.audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.12, this.audioCtx.currentTime); // Very slow sweeps

            const lfoGain = this.audioCtx.createGain();
            lfoGain.gain.setValueAtTime(150, this.audioCtx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            whiteNoise.connect(filter);
            filter.connect(track.gain);

            lfo.start();
            whiteNoise.start();
            
            track.node = { source: whiteNoise, filter: filter, lfo: lfo };

        } else if (type === 'lofi') {
            // Synthesize Chill Lofi Drone: Soft chord progression using detuned triangle waves & dynamic filter sweeps
            const chords = [
                [110, 165, 220, 293.66], // D min 7 base
                [130.81, 196, 261.63, 349.23], // C maj 7 base
                [98, 146.83, 196, 261.63] // G sus 4 base
            ];
            
            let chordIdx = 0;
            const voices = [];
            const oscGain = this.audioCtx.createGain();
            oscGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320, this.audioCtx.currentTime);
            
            oscGain.connect(filter);
            filter.connect(track.gain);

            const playChord = (frequencies) => {
                frequencies.forEach(freq => {
                    const osc = this.audioCtx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
                    osc.connect(oscGain);
                    osc.start();
                    voices.push(osc);
                });
            };

            playChord(chords[chordIdx]);

            // Periodic Lofi filter sweep and chord rotation
            const progressionInterval = setInterval(() => {
                if (!track.playing) return;
                
                // Ramp frequencies/fade down
                oscGain.gain.exponentialRampToValueAtTime(0.005, this.audioCtx.currentTime + 1);
                
                setTimeout(() => {
                    voices.forEach(v => v.stop());
                    voices.length = 0;

                    chordIdx = (chordIdx + 1) % chords.length;
                    oscGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
                    playChord(chords[chordIdx]);
                    
                    // Slightly adjust filter cutoff
                    filter.frequency.setValueAtTime(300 + (Math.random() * 80), this.audioCtx.currentTime);
                }, 1100);

            }, 8000);

            track.node = { voices, filter, interval: progressionInterval };

        } else if (type === 'cafe') {
            // Synthesize Coffee Shop: Low brown noise hum + short decay metallic clinks (using resonators)
            const humSize = 2 * this.audioCtx.sampleRate;
            const humBuffer = this.audioCtx.createBuffer(1, humSize, this.audioCtx.sampleRate);
            const data = humBuffer.getChannelData(0);
            
            // Brown noise synthesis
            let lastOut = 0.0;
            for (let i = 0; i < humSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Compensate volume
            }

            const humSource = this.audioCtx.createBufferSource();
            humSource.buffer = humBuffer;
            humSource.loop = true;

            const humFilter = this.audioCtx.createBiquadFilter();
            humFilter.type = 'lowpass';
            humFilter.frequency.setValueAtTime(150, this.audioCtx.currentTime);
            
            humSource.connect(humFilter);
            humFilter.connect(track.gain);
            humSource.start();

            // Clinking cup sounds generator
            const clinkGenerator = setInterval(() => {
                if (!track.playing) return;
                
                const osc = this.audioCtx.createOscillator();
                const clinkGain = this.audioCtx.createGain();
                
                osc.type = 'sine';
                // Random high metallic frequencies
                osc.frequency.setValueAtTime(1500 + Math.random() * 2500, this.audioCtx.currentTime);
                
                clinkGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
                clinkGain.gain.linearRampToValueAtTime(0.005, this.audioCtx.currentTime + 0.01);
                clinkGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.15);
                
                osc.connect(clinkGain);
                clinkGain.connect(track.gain);
                
                osc.start();
                osc.stop(this.audioCtx.currentTime + 0.2);
            }, 3000);

            track.node = { hum: humSource, interval: clinkGenerator };
        }
    }

    stopAudioSynthesis(type) {
        const track = this.soundSources[type];
        if (!track.playing) return;

        track.playing = false;

        if (type === 'rain') {
            track.node.source.stop();
            track.node.lfo.stop();
        } else if (type === 'lofi') {
            clearInterval(track.node.interval);
            track.node.voices.forEach(v => v.stop());
        } else if (type === 'cafe') {
            clearInterval(track.node.interval);
            track.node.hum.stop();
        }

        if (track.gain) {
            track.gain.disconnect();
            track.gain = null;
        }
    }

    // --- SMART AUTO-SCHEDULER / ROADMAP CREATOR ---
    suggestDailyFocus() {
        // AI Suggests study blocks based on high scoring tasks
        const activeTasks = this.state.tasks
            .filter(t => !t.completed)
            .map(t => ({ ...t, score: this.calculatePriorityScore(t) }))
            .sort((a, b) => b.score - a.score);

        if (activeTasks.length === 0) {
            this.addCopilotMessage("Aura", "No active tasks! You have optimized your workflow and are free to plan relaxing extracurriculars.");
            return;
        }

        // Recommend top task scheduling
        const topTask = activeTasks[0];
        
        // Find study block room in planner for Thursday (day 3) at 4:00 PM (16:00)
        const blockId = `suggested-block-${Date.now()}`;
        const newBlock = {
            id: blockId,
            title: `AI Block: Study ${topTask.course}`,
            type: "study",
            day: 3, // Thursday
            startHour: 16,
            endHour: 18,
            course: topTask.course
        };

        this.state.calendarEvents.push(newBlock);
        this.saveState();
        this.renderPlanner();
        this.renderDashboardSchedule();

        this.addCopilotMessage("Aura", `Workload analysis complete. I noticed "${topTask.title}" has a high urgency score. I have auto-scheduled a **2-hour AI study block on Thursday at 4:00 PM** targeting this course.`);
        this.setActiveTab('calendar');
    }

    createAuraRoadmap() {
        const taskId = document.getElementById('roadmap-task-select').value;
        const task = this.state.tasks.find(t => t.id === taskId);
        
        if (!task) {
            this.addCopilotMessage("Aura", "Please select a task from the dropdown first to create an structured milestone roadmap.");
            return;
        }

        // Generate 3 structured study roadmap milestones leading to deadline
        const taskDay = new Date(task.deadline).getDay();
        const studyDay1 = (taskDay - 2 < 0) ? 5 : taskDay - 2;
        const studyDay2 = (taskDay - 1 < 0) ? 6 : taskDay - 1;

        const roadmapBlocks = [
            {
                id: `road-1-${Date.now()}`,
                title: `Review Syllabus Guidelines`,
                type: "study",
                day: studyDay1,
                startHour: 14,
                endHour: 15,
                course: task.course
            },
            {
                id: `road-2-${Date.now()}`,
                title: `Milestone: Outline Draft`,
                type: "study",
                day: studyDay2,
                startHour: 15,
                endHour: 17,
                course: task.course
            }
        ];

        this.state.calendarEvents.push(...roadmapBlocks);
        this.saveState();
        this.renderPlanner();

        this.addCopilotMessage("Aura", `Roadmap created! I have added milestone blocks to your planner on days leading to the deadline of "${task.title}".`);
        this.setActiveTab('calendar');
    }

    // --- COPLIOT SIMULATED CHATBOT ENGINE ---
    setupCopilotEventListeners() {
        const sendBtn = document.getElementById('copilot-send-btn');
        const input = document.getElementById('copilot-chat-input');

        const triggerSend = () => {
            const query = input.value.trim();
            if (!query) return;

            this.sendCopilotQuery(query);
            input.value = '';
        };

        if (sendBtn) sendBtn.addEventListener('click', triggerSend);
        if (input) input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') triggerSend();
        });
    }

    sendCopilotQuery(query) {
        // Print user message
        this.addCopilotMessage("User", query);

        // Analyze and reply
        setTimeout(() => {
            const reply = this.generateAIResponse(query);
            this.addCopilotMessage("Aura", reply);
        }, 800);
    }

    addCopilotMessage(sender, text) {
        const container = document.getElementById('copilot-chat-body');
        if (!container) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender.toLowerCase()}`;
        msgDiv.innerHTML = `
            <div class="message-content">
                ${text}
            </div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    generateAIResponse(text) {
        const query = text.toLowerCase();

        if (query.includes('focus') || query.includes('what should i do')) {
            const active = this.state.tasks.filter(t=>!t.completed);
            if (active.length === 0) return "You have no outstanding tasks! Focus room is open for ambient breaks.";
            const sorted = active.map(t=>({ ...t, score: this.calculatePriorityScore(t)})).sort((a,b)=>b.score - a.score);
            return `Based on priority and closeness of deadline, your primary focus should be: **${sorted[0].title}** for **${sorted[0].course}**. Aura priority index is ${sorted[0].score}. You can use the Focus Room to begin!`;
        }

        if (query.includes('stress') || query.includes('workload') || query.includes('cognitive')) {
            const activeCount = this.state.tasks.filter(t=>!t.completed).length;
            const loadPercent = document.getElementById('cognitive-load-val')?.innerText ?? '35%';
            return `Cognitive diagnostic load is at **${loadPercent}**. You have **${activeCount} pending responsibilities**. I suggest allocating study blocks for CS-301 to buffer stress thresholds.`;
        }

        if (query.includes('study plan') || query.includes('roadmap')) {
            return `Ready. Use the **Aura Roadmap Creator** on the Planner tab. Simply select your goal from the selector, and click 'Create Roadmap' to schedule review blocks automatically.`;
        }

        if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
            return `Hello! Ready to streamline your studies today. Try asking "What should I focus on?" or "How is my stress level?"`;
        }

        return `I have analyzed your study metrics database. For optimal outcomes, I recommend structuring a 25-minute deep focus block today for your courses. Let me know if you'd like me to auto-generate a slot.`;
    }

    // --- FORM SELECTORS FILLERS ---
    populateFocusTaskSelector() {
        const select = document.getElementById('active-focus-task-select');
        if (!select) return;

        // Save selection
        const prevVal = select.value;
        select.innerHTML = '<option value="none">General Study / No Task Selected</option>';

        this.state.tasks.forEach(task => {
            if (task.completed) return;
            const option = document.createElement('option');
            option.value = task.id;
            option.innerText = `[${task.course}] ${task.title}`;
            select.appendChild(option);
        });

        select.value = prevVal;
    }

    populateRoadmapSelector() {
        const select = document.getElementById('roadmap-task-select');
        if (!select) return;

        select.innerHTML = '';
        this.state.tasks.forEach(task => {
            if (task.completed) return;
            const option = document.createElement('option');
            option.value = task.id;
            option.innerText = `[${task.course}] ${task.title}`;
            select.appendChild(option);
        });
    }

    // --- HELPER UTILITIES ---
    toggleTaskCompletion(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveState();
            this.renderAll();
            this.updateCharts();
        }
    }

    deleteTask(id) {
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.saveState();
        this.renderAll();
        this.updateCharts();
    }

    formatHour(hourDecimal) {
        const h = Math.floor(hourDecimal);
        const m = (hourDecimal % 1) * 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
    }

    // --- CHART.JS METRIC VISUALIZATIONS ---
    initCharts() {
        // 1. Focus hours line chart
        const focusCtx = document.getElementById('focus-hours-chart')?.getContext('2d');
        if (focusCtx) {
            this.charts.focus = new Chart(focusCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Focus Hours',
                        data: [2.5, 3.2, this.state.focusTimeToday, 0, 0, 0, 0],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#06b6d4'
                    }]
                },
                options: this.getChartOptions()
            });
        }

        // 2. Tasks by subject bar chart
        const taskCtx = document.getElementById('tasks-subject-chart')?.getContext('2d');
        if (taskCtx) {
            const counts = this.getSubjectTasksCount();
            this.charts.tasks = new Chart(taskCtx, {
                type: 'bar',
                data: {
                    labels: ['CS 301', 'MATH 240', 'WRIT 150', 'Internship', 'Personal'],
                    datasets: [
                        {
                            label: 'Pending Tasks',
                            data: counts.pending,
                            backgroundColor: 'rgba(139, 92, 246, 0.65)',
                            borderRadius: 4
                        },
                        {
                            label: 'Completed Tasks',
                            backgroundColor: 'rgba(16, 185, 129, 0.65)',
                            data: counts.completed,
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    ...this.getChartOptions(),
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                    }
                }
            });
        }

        // 3. GPA trend chart
        const gpaCtx = document.getElementById('gpa-trend-chart')?.getContext('2d');
        if (gpaCtx) {
            this.charts.gpa = new Chart(gpaCtx, {
                type: 'line',
                data: {
                    labels: ['Fall 24', 'Spring 25', 'Fall 25', 'Spring 26 (Current)'],
                    datasets: [{
                        label: 'Semester CGPA',
                        data: [7.85, 8.24, 8.48, 8.72],
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        tension: 0.2,
                        pointRadius: 5,
                        pointBackgroundColor: '#8b5cf6'
                    }]
                },
                options: this.getChartOptions()
            });
        }
    }

    getSubjectTasksCount() {
        const subjects = ['CS-301', 'MATH-240', 'WRIT-150', 'INTERN', 'PERSONAL'];
        const pending = [0, 0, 0, 0, 0];
        const completed = [0, 0, 0, 0, 0];

        this.state.tasks.forEach(t => {
            const idx = subjects.indexOf(t.course);
            if (idx !== -1) {
                if (t.completed) {
                    completed[idx]++;
                } else {
                    pending[idx]++;
                }
            }
        });

        return { pending, completed };
    }

    updateCharts() {
        if (this.charts.focus) {
            this.charts.focus.data.datasets[0].data[2] = this.state.focusTimeToday;
            this.charts.focus.update();
        }
        if (this.charts.tasks) {
            const counts = this.getSubjectTasksCount();
            this.charts.tasks.data.datasets[0].data = counts.pending;
            this.charts.tasks.data.datasets[1].data = counts.completed;
            this.charts.tasks.update();
        }
    }

    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Plus Jakarta Sans', size: 11 } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255, 255, 255, 0.5)' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255, 255, 255, 0.5)' } }
            }
        };
    }
}

// Global initialization hook
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new AuraApp();
    window.app = app;
});
