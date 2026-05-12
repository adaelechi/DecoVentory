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

// Load Activity Logs
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
        
        const logs = await response.json();
        
        if (logs.length === 0) {
            activityLogsContainer.innerHTML = '<p>No recent activity logs.</p>';
            return;
        }

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
                    ${logs.map(log => `
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
    } catch (err) {
        console.error('Failed to load activity logs', err);
        activityLogsContainer.innerHTML = '<p style="color:red;">Error loading activity logs. Please refresh.</p>';
    }
}

window.approveQuote = async function(id) {
    if (!confirm('Are you sure you want to approve this quote? This will deduct the requested materials from available inventory.')) return;
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
    if (!confirm('Are you sure you want to reject this quote?')) return;
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

    if (!confirm(`Are you sure you want to update the ${role} passcode?`)) return;

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
    } catch (err) {
        console.error('Error in Admin init:', err);
    } finally {
        revealPage();
    }
});

const materialsContainer = document.getElementById('materials-management-container');

async function loadMaterials() {
    if (!materialsContainer) return;
    try {
        // Fetch fresh materials to ensure we see everything
        const response = await fetch(`${API_BASE_URL}/materials?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch materials');
        const materials = await response.json();
        
        if (materials.length === 0) {
            materialsContainer.innerHTML = '<p>No materials found in inventory.</p>';
            return;
        }

        materialsContainer.innerHTML = materials.map(m => {
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
    } catch (err) {
        console.error('Failed to load materials', err);
        materialsContainer.innerHTML = '<p style="color:red;">Error loading materials.</p>';
    }
}

window.deleteMaterial = async function(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}" from inventory? This will also remove its photo. This action cannot be undone.`)) return;
    
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

async function loadDecorations() {
    if (!decorationsContainer) return;
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error('Failed to fetch decorations');
        const projects = await response.json();
        
        if (projects.length === 0) {
            decorationsContainer.innerHTML = '<p>No decorations found.</p>';
            return;
        }

        decorationsContainer.innerHTML = projects.map(project => {
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
    } catch (err) {
        console.error('Failed to load decorations', err);
        decorationsContainer.innerHTML = '<p style="color:red;">Error loading decorations.</p>';
    }
}

window.deleteDecoration = async function(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove its photos from Cloudinary. This action cannot be undone.`)) return;
    
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
