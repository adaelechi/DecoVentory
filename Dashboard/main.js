const sidebarItemSvg = document.querySelectorAll('.item-svg');
const toggleTheme = document.querySelector('.toggle-theme');
const sliderTheme = document.querySelector('.slider');

console.log(sidebarItemSvg);

// Check user role and hide Add Resource button for viewers
const userRole = localStorage.getItem('decoventory_role');
const addResourceLink = document.getElementById('addResourceLink');
if (userRole === 'viewer') {
    if (addResourceLink) {
        addResourceLink.style.display = 'none';
    }
}

// Dark mode functionality with localStorage persistence
function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        sliderTheme.style.transform = 'translateX(1.8rem)';
    } else {
        document.body.classList.remove('dark-mode');
        sliderTheme.style.transform = 'translateX(0)';
    }
}

// Load saved theme preference
const savedTheme = localStorage.getItem('decoventory_theme');
if (savedTheme === 'dark') {
    applyTheme(true);
}

// Toggle theme on click
toggleTheme.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = !isDark;
    
    applyTheme(newTheme);
    localStorage.setItem('decoventory_theme', newTheme ? 'dark' : 'light');
});

// Fetch and display materials
async function loadDashboardData() {
    try {
        console.log('Fetching materials from backend...');
        const response = await fetch('http://localhost:3000/api/materials');
        const materials = await response.json();
        
        console.log('Response received:', materials);
        
        if (!Array.isArray(materials)) {
            console.error('Invalid response format:', materials);
            return;
        }

        console.log('Loaded materials:', materials.length, 'items');

        // Calculate statistics
        const totalResources = materials.length;
        const totalInStore = materials.reduce((sum, m) => sum + (m.available_quantity || 0), 0);
        
        // For now, set others to 0 (you can add logic for chapel, other locations, rented out)
        const inChapel = 0;
        const inOtherLocations = 0;
        const rentedOut = 0;
        
        console.log('Statistics:', {
            totalResources,
            totalInStore,
            inChapel,
            inOtherLocations,
            rentedOut
        });
        
        // Update dashboard numbers
        const numberElements = document.querySelectorAll('.numbers');
        console.log('Found number elements:', numberElements.length);
        
        if (numberElements[0]) {
            numberElements[0].textContent = totalResources;
            console.log('Set Total Resources to:', totalResources);
        }
        if (numberElements[1]) {
            numberElements[1].textContent = totalInStore;
            console.log('Set Items Available to:', totalInStore);
        }
        if (numberElements[2]) {
            numberElements[2].textContent = inChapel;
            console.log('Set Chapel to:', inChapel);
        }
        if (numberElements[3]) {
            numberElements[3].textContent = inOtherLocations;
            console.log('Set Other Locations to:', inOtherLocations);
        }
        if (numberElements[4]) {
            numberElements[4].textContent = rentedOut;
            console.log('Set Rented Out to:', rentedOut);
        }
        
        // Display resources in the resource section
        const resourceSection = document.querySelector('.resource-section');
        console.log('Resource section found:', !!resourceSection);
        
        if (resourceSection) {
            if (materials.length > 0) {
                resourceSection.innerHTML = materials.map(material => `
                    <div class="resource-card">
                        ${material.image_url ? `<img src="http://localhost:3000${material.image_url}" alt="${material.name}" class="resource-image">` : '<div class="no-image">📦</div>'}
                        <h3>${material.name}</h3>
                        <p><strong>Category:</strong> ${material.category}</p>
                        <p><strong>Available:</strong> ${material.available_quantity} / ${material.total_quantity}</p>
                        <p><strong>Condition:</strong> ${material.condition}</p>
                        <p class="date"><small>Added: ${new Date(material.created_at).toLocaleDateString()}</small></p>
                    </div>
                `).join('');
                console.log('Resource cards created successfully');
            } else {
                resourceSection.innerHTML = '<p class="no-resources">No resources found. Add your first resource!</p>';
            }
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        const resourceSection = document.querySelector('.resource-section');
        if (resourceSection) {
            resourceSection.innerHTML = '<p class="error-message">Unable to connect to server. Please ensure the backend is running on http://localhost:3000</p>';
        }
    }
}

// Load data when page loads - wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardData);
} else {
    loadDashboardData();
}

// Refresh data every 30 seconds
setInterval(loadDashboardData, 30000);