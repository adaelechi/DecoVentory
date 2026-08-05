const userRole = localStorage.getItem('decoventory_role');
const authToken = localStorage.getItem('decoventory_token');
// API_BASE_URL and IMAGE_BASE_URL are now provided by api.js


if (userRole !== 'admin') {
    window.location.href = './login.html';
}

const toggleTheme = document.querySelector('.toggle-theme');
const sliderTheme = document.querySelector('.slider');
const quotesListContainer = document.getElementById('quotes-list-container');
const activityLogsContainer = document.getElementById('activity-logs-container');
let materialMap = {};
let allMaterials = [];
let filteredMaterials = [];
let materialCurrentPage = 1;

let allDecorations = [];
let filteredDecorations = [];
let decorationCurrentPage = 1;

let allActivityLogs = [];
let filteredActivityLogs = [];
let activityLogCurrentPage = 1;

const itemsPerPage = 10;

// Custom Confirmation Modal System (Replaces native browser confirm/alert popups)
function showConfirmModal({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', isDanger = true }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmationModal');
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalBtn');
        const cancelBtn = document.getElementById('cancelConfirmModalBtn');
        const closeBtn = document.getElementById('closeConfirmModalBtn');

        if (!modal || !confirmBtn) {
            resolve(true); // Fallback
            return;
        }

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (confirmBtn) confirmBtn.textContent = confirmText;
        if (cancelBtn) cancelBtn.textContent = cancelText;

        if (isDanger) {
            confirmBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        } else {
            confirmBtn.style.background = 'linear-gradient(135deg, var(--deco-red) 0%, #A53233 100%)';
        }

        const handleConfirm = () => {
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            cleanup();
            resolve(false);
        };

        const handleBackdrop = (e) => {
            if (e.target === modal) handleCancel();
        };

        const cleanup = () => {
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', handleConfirm);
            if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
            if (closeBtn) closeBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        if (closeBtn) closeBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);

        modal.style.display = 'flex';
    });
}

function renderPaginationControls(containerId, currentPage, totalPages, changePageFuncName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${changePageFuncName}(-1)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Prev
        </button>
        <span class="page-info">Page ${currentPage} of ${totalPages}</span>
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${changePageFuncName}(1)">
            Next
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
    `;
}

function revealPage() {
    const mainbar = document.querySelector('.mainbar');
    if (mainbar && mainbar.classList.contains('loading-opacity')) {
        mainbar.classList.remove('loading-opacity');
        mainbar.classList.add('fade-in');
    }
}

// Theme logic
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (sliderTheme) sliderTheme.style.transform = 'translateX(1.8rem)';
    } else {
        document.body.classList.remove('dark-mode');
        if (sliderTheme) sliderTheme.style.transform = 'translateX(0)';
    }
}

const savedTheme = localStorage.getItem('decoventory_theme');
if (savedTheme === 'dark') applyTheme(true);

if (toggleTheme) {
    toggleTheme.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        const newTheme = !isDark;
        applyTheme(newTheme);
        localStorage.setItem('decoventory_theme', newTheme ? 'dark' : 'light');
    });
}

// Fetch material names map
async function loadMaterialMap() {
    try {
        // Ensure Admin view always has fresh material names for activity logs
        const response = await fetch(`${API_BASE_URL}/materials?t=${Date.now()}`);
        const materials = await response.json();
        if (Array.isArray(materials)) {
            materials.forEach(m => {
                materialMap[m.id] = m.name + (m.size ? ` (${m.size})` : '');
            });
        }
    } catch (err) {
        console.error('Failed to load materials for mapping', err);
    }
}

// Load Pending Quotes
async function loadPendingQuotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/quotes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('decoventory_token');
                localStorage.removeItem('decoventory_role');
                showToast.error('Session expired. Please login again.');
                setTimeout(() => window.location.href = './login.html', 2000);
                return;
            }
            if (response.status === 404) {
                // If route not found, it means quotes aren't implemented yet in backend
                quotesListContainer.innerHTML = '<p>No rent material requests found.</p>';
                return;
            }
            throw new Error('Failed to load quotes');
        }
        
        const quotes = await response.json();
        const pendingQuotes = quotes.filter(q => q.status === 'pending');
        
        if (pendingQuotes.length === 0) {
            quotesListContainer.innerHTML = '<p>No pending rent material requests.</p>';
            return;
        }

        quotesListContainer.innerHTML = pendingQuotes.map(quote => `
            <div class="resource-card">
                <h3>Request from: ${quote.recipient_name}</h3>
                <p><strong>Location:</strong> ${quote.location}</p>
                <p><strong>Event Date:</strong> ${new Date(quote.event_date).toLocaleDateString()}</p>
                <div class="quote-items-list">
                    <strong>Materials:</strong>
                    <ul>${quote.items.map(i => `<li>${i.materialName || materialMap[i.materialId] || 'Material ID: ' + i.materialId} - Qty: ${i.quantity}</li>`).join('')}</ul>
                    <strong>Services:</strong>
                    <ul>${quote.services.map(s => `<li>${s.type} - Qty: ${s.quantity}</li>`).join('')}</ul>
                </div>
                <div class="quote-card-actions">
                    <button class="btn-primary" onclick="approveQuote(${quote.id})">Approve</button>
                    <button class="btn-secondary" onclick="rejectQuote(${quote.id})">Reject</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load quotes', err);
        quotesListContainer.innerHTML = '<p style="color:red;">Error loading requests. Please refresh or login again.</p>';
    }
}

window.changeActivityLogPage = function(delta) {
    activityLogCurrentPage += delta;
    renderActivityLogsList();
};

async function loadActivityLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/activity-logs`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Already handled in loadPendingQuotes likely, but for safety:
                localStorage.removeItem('decoventory_token');
                localStorage.removeItem('decoventory_role');
                window.location.href = './login.html';
                return;
            }
            throw new Error('Failed to load activity logs');
        }
        
        allActivityLogs = await response.json();
        
        // Dynamically populate action types in filter dropdown
        const actions = [...new Set(allActivityLogs.map(log => log.action_type.toUpperCase()))];
        const actionFilter = document.getElementById('activity-action-filter');
        if (actionFilter) {
            actionFilter.innerHTML = '<option value="all">All Actions</option>' + 
                actions.map(act => `<option value="${act}">${act}</option>`).join('');
        }

        activityLogCurrentPage = 1;
        filterActivityLogs();
    } catch (err) {
        console.error('Failed to load activity logs', err);
        activityLogsContainer.innerHTML = '<p style="color:red;">Error loading activity logs. Please refresh.</p>';
    }
}

function filterActivityLogs() {
    const searchInput = document.getElementById('activity-search-input');
    const actionFilter = document.getElementById('activity-action-filter');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const action = actionFilter ? actionFilter.value : 'all';

    filteredActivityLogs = allActivityLogs.filter(log => {
        const materialName = materialMap[log.material_id] || 'ID: ' + log.material_id;
        const notes = log.notes || '';
        const matchesSearch = materialName.toLowerCase().includes(query) || notes.toLowerCase().includes(query);
        const matchesAction = action === 'all' || log.action_type.toUpperCase() === action;
        return matchesSearch && matchesAction;
    });

    renderActivityLogsList();
}

function renderActivityLogsList() {
    if (!activityLogsContainer) return;

    if (filteredActivityLogs.length === 0) {
        activityLogsContainer.innerHTML = '<p>No activity logs found matching criteria.</p>';
        const paginationContainer = document.getElementById('activity-logs-pagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = filteredActivityLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (activityLogCurrentPage > totalPages) activityLogCurrentPage = totalPages;
    if (activityLogCurrentPage < 1) activityLogCurrentPage = 1;

    const start = (activityLogCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedLogs = filteredActivityLogs.slice(start, end);

    activityLogsContainer.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Material</th>
                    <th>Quantity</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${pagedLogs.map(log => `
                    <tr>
                        <td>${new Date(log.created_at).toLocaleString()}</td>
                        <td><strong>${log.action_type.toUpperCase()}</strong></td>
                        <td>${materialMap[log.material_id] || 'ID: ' + log.material_id}</td>
                        <td>${log.quantity}</td>
                        <td>${log.notes || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    renderPaginationControls('activity-logs-pagination', activityLogCurrentPage, totalPages, 'changeActivityLogPage');
}

window.approveQuote = async function(id) {
    const confirmed = await showConfirmModal({
        title: 'Approve Rent Request',
        message: 'Are you sure you want to approve this quote? This will deduct requested materials from available inventory.',
        confirmText: 'Approve Request',
        isDanger: false
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to approve');
        showToast.success('Quote approved successfully!');
        loadPendingQuotes();
    } catch (err) {
        showToast.error(err.message);
    }
};

window.rejectQuote = async function(id) {
    const confirmed = await showConfirmModal({
        title: 'Reject Rent Request',
        message: 'Are you sure you want to reject this quote request?',
        confirmText: 'Reject Request',
        isDanger: true
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/quotes/${id}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to reject');
        showToast.info('Quote rejected.');
        loadPendingQuotes();
    } catch (err) {
        showToast.error(err.message);
    }
};

window.updatePin = async function(role, inputId) {
    const input = document.getElementById(inputId);
    const newPasscode = input.value;

    if (!newPasscode || newPasscode.length !== 6) {
        showToast.error('Passcode must be exactly 6 digits');
        return;
    }

    const confirmed = await showConfirmModal({
        title: 'Update Passcode',
        message: `Are you sure you want to update the ${role} passcode?`,
        confirmText: 'Update Passcode',
        isDanger: false
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/update-role-passcode`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role, newPasscode })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update passcode');

        showToast.success(data.message);
        input.value = '';
    } catch (err) {
        showToast.error(err.message);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadMaterialMap();
        await loadPendingQuotes();
        await loadActivityLogs();
        await loadMaterials();
        await loadDecorations();
        await loadColorCombos();
        
        // Wire up input search/filter listeners
        const resourceSearch = document.getElementById('resource-search-input');
        const resourceFilter = document.getElementById('resource-category-filter');
        const decorationSearch = document.getElementById('decoration-search-input');
        const activitySearch = document.getElementById('activity-search-input');
        const activityFilter = document.getElementById('activity-action-filter');

        if (resourceSearch) resourceSearch.addEventListener('input', () => { materialCurrentPage = 1; filterMaterials(); });
        if (resourceFilter) resourceFilter.addEventListener('change', () => { materialCurrentPage = 1; filterMaterials(); });
        if (decorationSearch) decorationSearch.addEventListener('input', () => { decorationCurrentPage = 1; filterDecorations(); });
        if (activitySearch) activitySearch.addEventListener('input', () => { activityLogCurrentPage = 1; filterActivityLogs(); });
        if (activityFilter) activityFilter.addEventListener('change', () => { activityLogCurrentPage = 1; filterActivityLogs(); });
    } catch (err) {
        console.error('Error in Admin init:', err);
    } finally {
        revealPage();
    }
});

const materialsContainer = document.getElementById('materials-management-container');

window.changeMaterialPage = function(delta) {
    materialCurrentPage += delta;
    renderMaterialsList();
};

async function loadMaterials() {
    if (!materialsContainer) return;
    try {
        // Fetch fresh materials to ensure we see everything
        const response = await fetch(`${API_BASE_URL}/materials?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch materials');
        allMaterials = await response.json();
        
        // Dynamically populate categories in filter dropdown
        const categories = [...new Set(allMaterials.map(m => m.category))];
        const categoryFilter = document.getElementById('resource-category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">All Categories</option>' + 
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }

        materialCurrentPage = 1;
        filterMaterials();
    } catch (err) {
        console.error('Failed to load materials', err);
        materialsContainer.innerHTML = '<p style="color:red;">Error loading materials.</p>';
    }
}

function filterMaterials() {
    const searchInput = document.getElementById('resource-search-input');
    const categoryFilter = document.getElementById('resource-category-filter');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const category = categoryFilter ? categoryFilter.value : 'all';

    filteredMaterials = allMaterials.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(query) || (m.category && m.category.toLowerCase().includes(query));
        const matchesCategory = category === 'all' || m.category === category;
        return matchesSearch && matchesCategory;
    });

    renderMaterialsList();
}

function renderMaterialsList() {
    if (!materialsContainer) return;

    if (filteredMaterials.length === 0) {
        materialsContainer.innerHTML = '<p>No materials found matching criteria.</p>';
        const paginationContainer = document.getElementById('materials-pagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = filteredMaterials.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (materialCurrentPage > totalPages) materialCurrentPage = totalPages;
    if (materialCurrentPage < 1) materialCurrentPage = 1;

    const start = (materialCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedMaterials = filteredMaterials.slice(start, end);

    materialsContainer.innerHTML = pagedMaterials.map(m => {
        const sizeInfo = m.size ? `(${m.size})` : '';
        return `
            <div class="resource-card decoration-admin-card">
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem;">${m.name} ${sizeInfo}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: var(--text-secondary);">${m.category} — ${m.total_quantity} total</p>
                </div>
                <button class="delete-btn-minimal" onclick="deleteMaterial(${m.id}, '${m.name}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        `;
    }).join('');

    renderPaginationControls('materials-pagination', materialCurrentPage, totalPages, 'changeMaterialPage');
}

window.deleteMaterial = async function(id, name) {
    const confirmed = await showConfirmModal({
        title: 'Delete Material',
        message: `Are you sure you want to delete "${name}" from inventory? This will also remove its photo. This action cannot be undone.`,
        confirmText: 'Delete Material',
        isDanger: true
    });
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/materials/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete material');
        
        showToast.success(`"${name}" removed from inventory`);
        loadMaterials(); // Refresh list
    } catch (err) {
        showToast.error(err.message);
    }
};

const decorationsContainer = document.getElementById('decorations-management-container');

window.changeDecorationPage = function(delta) {
    decorationCurrentPage += delta;
    renderDecorationsList();
};

async function loadDecorations() {
    if (!decorationsContainer) return;
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error('Failed to fetch decorations');
        allDecorations = await response.json();
        
        decorationCurrentPage = 1;
        filterDecorations();
    } catch (err) {
        console.error('Failed to load decorations', err);
        decorationsContainer.innerHTML = '<p style="color:red;">Error loading decorations.</p>';
    }
}

function filterDecorations() {
    const searchInput = document.getElementById('decoration-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    filteredDecorations = allDecorations.filter(project => {
        return project.event_name.toLowerCase().includes(query) || (project.venue && project.venue.toLowerCase().includes(query));
    });

    renderDecorationsList();
}

function renderDecorationsList() {
    if (!decorationsContainer) return;

    if (filteredDecorations.length === 0) {
        decorationsContainer.innerHTML = '<p>No decorations found.</p>';
        const paginationContainer = document.getElementById('decorations-pagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const totalItems = filteredDecorations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (decorationCurrentPage > totalPages) decorationCurrentPage = totalPages;
    if (decorationCurrentPage < 1) decorationCurrentPage = 1;

    const start = (decorationCurrentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedDecorations = filteredDecorations.slice(start, end);

    decorationsContainer.innerHTML = pagedDecorations.map(project => {
        const date = new Date(project.event_date).toLocaleDateString();
        const imageCount = project.images ? project.images.length : 0;
        
        return `
            <div class="resource-card decoration-admin-card">
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem;">${project.event_name}</h3>
                    <p style="margin: 4px 0; font-size: 0.9rem; color: var(--text-secondary);">${project.venue} — ${date}</p>
                    <p style="margin: 0; font-size: 0.8rem; font-weight: 600;">${imageCount} Photos</p>
                </div>
                <button class="delete-btn-minimal" onclick="deleteDecoration(${project.id}, '${project.event_name}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        `;
    }).join('');

    renderPaginationControls('decorations-pagination', decorationCurrentPage, totalPages, 'changeDecorationPage');
}

window.deleteDecoration = async function(id, name) {
    const confirmed = await showConfirmModal({
        title: 'Delete Decoration',
        message: `Are you sure you want to delete "${name}"? This will also remove its photos from Cloudinary. This action cannot be undone.`,
        confirmText: 'Delete Decoration',
        isDanger: true
    });
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete decoration');
        
        showToast.success(`"${name}" deleted successfully`);
        loadDecorations(); // Refresh list
    } catch (err) {
        showToast.error(err.message);
    }
};

// ── COLOR COMBOS MODULE ──
const PRESET_COLORS = [
    { name: 'Select preset...', hex: '' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Emerald Green', hex: '#50C878' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Blush Pink', hex: '#FFB6C1' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Champagne', hex: '#F7E7CE' },
    { name: 'Silver', hex: '#C0C0C0' },
    { name: 'Black', hex: '#111111' },
    { name: 'Sage Green', hex: '#9CAF88' },
    { name: 'Navy Blue', hex: '#000080' },
    { name: 'Lavender', hex: '#E6E6FA' },
    { name: 'Terracotta', hex: '#E2725B' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Red', hex: '#E53935' },
    { name: 'Yellow', hex: '#FFEB3B' },
    { name: 'Brown', hex: '#795548' },
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Custom...', hex: '#3B82F6' }
];

let allColorCombos = [];

const colorCombosContainer = document.getElementById('color-combos-container');
const colorComboModal = document.getElementById('colorComboModal');
const comboForm = document.getElementById('comboForm');
const comboModalTitle = document.getElementById('comboModalTitle');
const comboIdInput = document.getElementById('comboIdInput');
const comboTitleInput = document.getElementById('comboTitleInput');
const comboColorsList = document.getElementById('comboColorsList');
const openAddComboBtn = document.getElementById('openAddComboBtn');
const closeComboModalBtn = document.getElementById('closeComboModalBtn');
const cancelComboModalBtn = document.getElementById('cancelComboModalBtn');
const addComboColorRowBtn = document.getElementById('addComboColorRowBtn');
const sidebarColorCombosBtn = document.getElementById('sidebarColorCombosBtn');

if (sidebarColorCombosBtn) {
    sidebarColorCombosBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById('color-combos-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

function resolveColorSwatch(name, hex) {
    if (hex && hex.trim() !== '') return hex.trim();
    if (!name) return '#CCCCCC';
    const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (preset && preset.hex) return preset.hex;
    return name.trim();
}

async function loadColorCombos() {
    if (!colorCombosContainer) return;
    try {
        allColorCombos = await API.getColorCombos();
        renderColorCombosList();
    } catch (err) {
        console.error('Failed to load color combos', err);
        colorCombosContainer.innerHTML = '<p style="color:red;">Error loading color combos.</p>';
    }
}

function renderColorCombosList() {
    if (!colorCombosContainer) return;

    if (!Array.isArray(allColorCombos) || allColorCombos.length === 0) {
        colorCombosContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--border-color); text-align: center;">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">No color combos created yet.</p>
                <button type="button" class="btn-primary" onclick="openColorComboModal()">+ Create First Combo</button>
            </div>
        `;
        return;
    }

    colorCombosContainer.innerHTML = allColorCombos.map(combo => {
        const colors = Array.isArray(combo.colors) ? combo.colors : [];
        return `
            <div class="color-combo-card">
                <div>
                    <div class="combo-card-header">
                        <h3 class="combo-card-title">${combo.title}</h3>
                        <div class="combo-card-actions">
                            <button type="button" class="combo-action-btn" title="Edit Combo" onclick="editColorCombo(${combo.id})">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button type="button" class="combo-action-btn delete-btn" title="Delete Combo" onclick="deleteColorCombo(${combo.id}, '${combo.title.replace(/'/g, "\\'")}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="combo-colors-chips">
                        ${colors.map(c => {
                            const name = typeof c === 'string' ? c : (c.name || '');
                            const hex = typeof c === 'string' ? '' : (c.hex || '');
                            const swatchBg = resolveColorSwatch(name, hex);
                            return `
                                <div class="color-chip" title="Click to view ${name} materials in Dashboard" onclick="navigateToDashboardColor('${name.replace(/'/g, "\\'")}')">
                                    <div class="color-swatch-circle" style="background-color: ${swatchBg};"></div>
                                    <span class="color-chip-name">${name}</span>
                                    ${hex ? `<span class="color-chip-hex">${hex}</span>` : ''}
                                    <svg class="color-chip-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.navigateToDashboardColor = function(colorName) {
    window.location.href = `/Dashboard/index.html?search=${encodeURIComponent(colorName)}`;
};

window.openColorComboModal = function(combo = null) {
    if (!colorComboModal) return;

    comboColorsList.innerHTML = '';

    if (combo) {
        comboModalTitle.textContent = 'Edit Color Combo';
        comboIdInput.value = combo.id;
        comboTitleInput.value = combo.title || '';
        const colors = Array.isArray(combo.colors) ? combo.colors : [];
        if (colors.length === 0) {
            addComboColorRow();
        } else {
            colors.forEach(c => {
                const name = typeof c === 'string' ? c : (c.name || '');
                const hex = typeof c === 'string' ? '' : (c.hex || '#4169E1');
                addComboColorRow(name, hex);
            });
        }
    } else {
        comboModalTitle.textContent = 'Add New Color Combo';
        comboIdInput.value = '';
        comboTitleInput.value = '';
        addComboColorRow('Red', '#E53935');
        addComboColorRow('Blue', '#4169E1');
        addComboColorRow('Gold', '#FFD700');
    }

    colorComboModal.style.display = 'flex';
};

window.editColorCombo = function(id) {
    const combo = allColorCombos.find(c => c.id === id);
    if (combo) openColorComboModal(combo);
};

function closeComboModal() {
    if (colorComboModal) colorComboModal.style.display = 'none';
}

function addComboColorRow(initialName = '', initialHex = '#4169E1') {
    if (!comboColorsList) return;

    const row = document.createElement('div');
    row.className = 'combo-color-row';

    const presetSelect = document.createElement('select');
    presetSelect.className = 'combo-color-select';
    presetSelect.innerHTML = PRESET_COLORS.map(p => `<option value="${p.name}" data-hex="${p.hex}">${p.name}</option>`).join('');
    
    // Check if initialName matches a preset
    const matchingPreset = PRESET_COLORS.find(p => p.name.toLowerCase() === initialName.toLowerCase());
    if (matchingPreset) {
        presetSelect.value = matchingPreset.name;
    } else if (initialName) {
        presetSelect.value = 'Custom...';
    }

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'combo-color-input';
    nameInput.placeholder = 'Color name';
    nameInput.value = initialName || (presetSelect.value !== 'Select preset...' && presetSelect.value !== 'Custom...' ? presetSelect.value : '');
    nameInput.required = true;

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'combo-color-picker';
    colorPicker.value = initialHex && initialHex.startsWith('#') ? initialHex : '#4169E1';

    presetSelect.addEventListener('change', () => {
        const selectedOpt = presetSelect.options[presetSelect.selectedIndex];
        const hex = selectedOpt.getAttribute('data-hex');
        if (presetSelect.value !== 'Select preset...' && presetSelect.value !== 'Custom...') {
            nameInput.value = presetSelect.value;
            if (hex) colorPicker.value = hex;
        }
    });

    colorPicker.addEventListener('input', () => {
        // If color picker changed, update custom hex if desired
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-color-row-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove color';
    removeBtn.addEventListener('click', () => {
        if (comboColorsList.children.length > 1) {
            row.remove();
        } else {
            showToast.error('A combo must have at least one color');
        }
    });

    row.appendChild(presetSelect);
    row.appendChild(nameInput);
    row.appendChild(colorPicker);
    row.appendChild(removeBtn);

    comboColorsList.appendChild(row);
}

window.deleteColorCombo = async function(id, title) {
    const confirmed = await showConfirmModal({
        title: 'Delete Color Combo',
        message: `Are you sure you want to delete color combo "${title}"? This action cannot be undone.`,
        confirmText: 'Delete Combo',
        isDanger: true
    });
    if (!confirmed) return;

    try {
        const result = await API.deleteColorCombo(id);
        if (result.error) throw new Error(result.error);
        showToast.success(`Color combo "${title}" deleted`);
        loadColorCombos();
    } catch (err) {
        showToast.error(err.message || 'Failed to delete color combo');
    }
};

if (openAddComboBtn) {
    openAddComboBtn.addEventListener('click', () => openColorComboModal());
}

if (closeComboModalBtn) {
    closeComboModalBtn.addEventListener('click', closeComboModal);
}

if (cancelComboModalBtn) {
    cancelComboModalBtn.addEventListener('click', closeComboModal);
}

if (addComboColorRowBtn) {
    addComboColorRowBtn.addEventListener('click', () => addComboColorRow());
}

if (colorComboModal) {
    colorComboModal.addEventListener('click', (e) => {
        if (e.target === colorComboModal) closeComboModal();
    });
}

if (comboForm) {
    comboForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = comboIdInput.value;
        const title = comboTitleInput.value.trim();
        const colorRows = comboColorsList.querySelectorAll('.combo-color-row');
        
        const colors = [];
        colorRows.forEach(row => {
            const nameInput = row.querySelector('.combo-color-input');
            const pickerInput = row.querySelector('.combo-color-picker');
            const name = nameInput ? nameInput.value.trim() : '';
            const hex = pickerInput ? pickerInput.value : '';
            if (name) {
                colors.push({ name, hex });
            }
        });

        if (!title) {
            showToast.error('Please enter a title for the combo');
            return;
        }

        if (colors.length === 0) {
            showToast.error('Please add at least one valid color');
            return;
        }

        const comboData = { title, colors };

        try {
            let res;
            if (id) {
                res = await API.updateColorCombo(id, comboData);
            } else {
                res = await API.createColorCombo(comboData);
            }

            if (res.error) throw new Error(res.error);

            showToast.success(id ? 'Color combo updated!' : 'Color combo created!');
            closeComboModal();
            loadColorCombos();
        } catch (err) {
            showToast.error(err.message || 'Failed to save color combo');
        }
    });
}

