const userRole = localStorage.getItem('decoventory_role');
const authToken = localStorage.getItem('decoventory_token');
const API_BASE_URL = 'http://localhost:3000/api';

if (userRole !== 'admin') {
    window.location.href = './login.html';
}

const toggleTheme = document.querySelector('.toggle-theme');
const sliderTheme = document.querySelector('.slider');
const quotesListContainer = document.getElementById('quotes-list-container');
const activityLogsContainer = document.getElementById('activity-logs-container');
let materialMap = {};

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
        const response = await fetch(`${API_BASE_URL}/materials`);
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
        quotesListContainer.innerHTML = '<p style="color:red;">Error loading requests.</p>';
    }
}

// Load Activity Logs
async function loadActivityLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/activity-logs`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
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
        activityLogsContainer.innerHTML = '<p style="color:red;">Error loading activity logs.</p>';
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
    await loadMaterialMap();
    loadPendingQuotes();
    loadActivityLogs();
});
