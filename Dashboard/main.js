const sidebarItemSvg = document.querySelectorAll('.item-svg');
const toggleTheme = document.querySelector('.toggle-theme');
const sliderTheme = document.querySelector('.slider');
const applyBtn = document.querySelector('.apply-btn');
const resetBtn = document.querySelector('.reset-btn');
const categorySelect = document.getElementById('category-select');
const statusSelect = document.getElementById('status-select');
const searchInput = document.getElementById('search-input');
const resourceSection = document.querySelector('.resource-section');
const addResourceLink = document.getElementById('addResourceLink');
const detailsModal = document.getElementById('detailsModal');
const detailsForm = document.getElementById('detailsForm');
const detailsName = document.getElementById('detailsName');
const detailsCategory = document.getElementById('detailsCategory');
const detailsTotalQuantity = document.getElementById('detailsTotalQuantity');
const detailsAvailableQuantity = document.getElementById('detailsAvailableQuantity');
const detailsCondition = document.getElementById('detailsCondition');
const detailsLocation = document.getElementById('detailsLocation');
const detailsCustomLocationGroup = document.getElementById('detailsCustomLocationGroup');
const detailsCustomLocation = document.getElementById('detailsCustomLocation');
const detailsSize = document.getElementById('detailsSize');
const detailsColour = document.getElementById('detailsColour');
const detailsImage = document.getElementById('detailsImage');
const detailsMessage = document.getElementById('detailsMessage');
const detailsMaterialName = document.getElementById('selectedMaterialName');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const cancelDetailsUpdate = document.getElementById('cancelDetailsUpdate');

// API_BASE_URL and IMAGE_BASE_URL are now provided by api.js

//tt
let allMaterials = [];
let selectedMaterial = null;

const welcomeModal = document.getElementById('welcomeModal');
const authModal = document.getElementById('authModal');
const showLoginBtn = document.getElementById('showLoginBtn');
const continueAsViewerBtn = document.getElementById('continueAsViewerBtn');
const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
const execLoginForm = document.getElementById('execLoginForm');
const passcodeField = document.getElementById('passcode');
const togglePassBtn = document.getElementById('togglePassBtn');

const userRole = localStorage.getItem('decoventory_role');
const authToken = localStorage.getItem('decoventory_token');

// Initial Role Check
if (!userRole && welcomeModal) {
    welcomeModal.style.display = 'flex';
} else {
    if (welcomeModal) welcomeModal.style.display = 'none';
    if (authModal) authModal.style.display = 'none';
}

if (userRole === 'viewer') {
    if (addResourceLink) addResourceLink.style.display = 'none';
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) sidebarFooter.style.display = 'none';
}

function normalizeValue(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/&/g, 'and');
}

function toTitleCase(value) {
    return String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const categoryGroups = {
    fabrics: ['voile', 'satin', 'fabrics', 'fabric'],
    tools: ['hand-tools', 'equipment', 'tools', 'tool'],
    others: ['decorations', 'lighting', 'furniture', 'miscellaneous', 'others', 'other']
};

function getCanonicalCategory(value) {
    const normalized = normalizeValue(value);

    if (normalized === 'fabrics' || normalized === 'fabric') return 'fabrics';
    if (normalized === 'tools' || normalized === 'tool') return 'tools';
    if (normalized === 'others' || normalized === 'other') return 'others';

    if (categoryGroups.fabrics.includes(normalized)) return normalized;
    if (categoryGroups.tools.includes(normalized)) return normalized;
    if (categoryGroups.others.includes(normalized)) return normalized;

    return normalized;
}

function getMaterialCategoryInfo(value) {
    const normalized = normalizeValue(value);

    if (normalized === 'fabrics' || normalized === 'fabric') {
        return { group: 'fabrics', subtype: 'fabrics' };
    }

    if (normalized === 'tools' || normalized === 'tool') {
        return { group: 'tools', subtype: 'tools' };
    }

    if (normalized === 'others' || normalized === 'other') {
        return { group: 'others', subtype: 'others' };
    }

    if (categoryGroups.fabrics.includes(normalized)) {
        return { group: 'fabrics', subtype: normalized };
    }

    if (categoryGroups.tools.includes(normalized)) {
        return { group: 'tools', subtype: normalized };
    }

    if (categoryGroups.others.includes(normalized)) {
        return { group: 'others', subtype: normalized };
    }

    return { group: normalized, subtype: normalized };
}

function normalizeLocation(location) {
    const normalized = normalizeValue(location);

    if (normalized === 'office-store' || normalized === 'office' || normalized === 'store') {
        return 'office store';
    }

    if (normalized === 'chapel') {
        return 'chapel';
    }

    if (normalized === 'other-location' || normalized === 'other-locations' || normalized === 'other') {
        return 'custom';
    }

    if (normalized === 'rented-out' || normalized === 'rented') {
        return 'rented out';
    }

    return String(location || 'office store').trim() || 'office store';
}

function formatLocationLabel(location) {
    const normalized = normalizeLocation(location);

    if (normalized === 'office store') {
        return 'Office Store';
    }

    if (normalized === 'chapel') {
        return 'Chapel';
    }



    if (normalized === 'rented out') {
        return 'Rented Out';
    }

    return toTitleCase(normalized);
}

function getLocationKey(location) {
    const normalized = normalizeLocation(location);

    if (normalized === 'office store') return 'store';
    if (normalized === 'chapel') return 'chapel';
    if (normalized === 'rented out') return 'rented';
    return 'other';
}

function sumQuantity(materials, predicate) {
    return materials.reduce((sum, material) => {
        if (!predicate(material)) {
            return sum;
        }

        return sum + Number(material.total_quantity || 0);
    }, 0);
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (sliderTheme) {
            sliderTheme.style.transform = 'translateX(1.8rem)';
        }
        return;
    }

    document.body.classList.remove('dark-mode');
    if (sliderTheme) {
        sliderTheme.style.transform = 'translateX(0)';
    }
}

const savedTheme = localStorage.getItem('decoventory_theme');
if (savedTheme === 'dark') {
    applyTheme(true);
}

if (toggleTheme) {
    toggleTheme.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-mode');
        const newTheme = !isDark;

        applyTheme(newTheme);
        localStorage.setItem('decoventory_theme', newTheme ? 'dark' : 'light');
    });
}

function matchesCategoryFilter(material, selectedCategory, selectedType) {
    const materialCategory = getMaterialCategoryInfo(material.category);
    const categoryGroup = getCanonicalCategory(selectedCategory);
    const typeValue = getCanonicalCategory(selectedType);

    if (categoryGroup === 'all-categories' || categoryGroup === '') {
        return selectedType === 'All Types' || typeValue === 'all-types' || materialCategory.subtype === typeValue || materialCategory.group === typeValue;
    }

    const allowedCategories = categoryGroups[categoryGroup] || [];

    if (!allowedCategories.includes(materialCategory.subtype) && materialCategory.group !== categoryGroup) {
        return false;
    }

    if (selectedType === 'All Types' || typeValue === 'all-types') {
        return true;
    }

    return materialCategory.subtype === typeValue || materialCategory.group === typeValue;
}

function getDashboardStats(materials) {
    const totalResources = sumQuantity(materials, () => true);
    
    let totalInStore = 0;
    let inChapel = 0;
    let inCustomLocations = 0;
    let rentedOut = 0;
    materials.forEach(material => {
        if (material.locations && material.locations.length > 0) {
            material.locations.forEach(loc => {
                const key = getLocationKey(loc.name);
                if (key === 'store') totalInStore += loc.quantity;
                else if (key === 'chapel') inChapel += loc.quantity;
                else if (key === 'rented') rentedOut += loc.quantity;
                else inCustomLocations += loc.quantity;
            });
        } else {
            const key = getLocationKey(material.location);
            if (key === 'store') totalInStore += Number(material.total_quantity || 0);
            else if (key === 'chapel') inChapel += Number(material.total_quantity || 0);
            else if (key === 'rented') rentedOut += Number(material.total_quantity || 0);
            else inCustomLocations += Number(material.total_quantity || 0);
        }
    });

    return {
        totalResources,
        totalInStore,
        inChapel,
        inCustomLocations,
        rentedOut
    };
}

function updateDashboardNumbers(materials) {
    const stats = getDashboardStats(materials);
    const numberElements = document.querySelectorAll('.numbers');

    if (numberElements[0]) numberElements[0].textContent = stats.totalResources;
    if (numberElements[1]) numberElements[1].textContent = stats.totalInStore;
    if (numberElements[2]) numberElements[2].textContent = stats.inChapel;
    if (numberElements[3]) numberElements[3].textContent = stats.inCustomLocations;
    if (numberElements[4]) numberElements[4].textContent = stats.rentedOut;
}

function applyCurrentFilters(materials = allMaterials) {
    const selectedCategory = categorySelect ? categorySelect.value : 'All Categories';
    const selectedType = statusSelect ? statusSelect.value : 'All Types';
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    return materials.filter(material => {
        const matchesFilters = matchesCategoryFilter(material, selectedCategory, selectedType);
        
        if (!searchTerm) return matchesFilters;

        const matchesSearch = 
            material.name.toLowerCase().includes(searchTerm) ||
            material.category.toLowerCase().includes(searchTerm) ||
            material.condition.toLowerCase().includes(searchTerm) ||
            (material.locations && material.locations.some(loc => loc.name.toLowerCase().includes(searchTerm))) ||
            (material.location && material.location.toLowerCase().includes(searchTerm));

        return matchesFilters && matchesSearch;
    });
}

function renderResources(materials) {
    if (!resourceSection) {
        return;
    }

    if (!materials.length) {
        resourceSection.innerHTML = '<p class="no-resources">No resources found. Add your first resource!</p>';
        return;
    }

    const canEditDetails = Boolean(authToken) && userRole !== 'viewer';

    resourceSection.innerHTML = materials.map(material => `
        <div class="resource-card">
            ${material.image_url ? `<img src="${getImageUrl(material.image_url)}" alt="${material.name}" class="resource-image">` : '<div class="no-image">📦</div>'}
            <h3>${material.name}</h3>
            <p><strong>Category:</strong> ${material.category}</p>
            ${material.size ? `<p><strong>Size:</strong> ${material.size}</p>` : ''}
            ${material.colour ? `<p><strong>Colour:</strong> ${material.colour}</p>` : ''}
            <p><strong>Available:</strong> ${material.available_quantity} / ${material.total_quantity}</p>
            <p><strong>Condition:</strong> ${material.condition}</p>
            ${material.locations && material.locations.length > 0 
                ? `<span class="resource-location" style="display: block; margin-top: 5px;"><strong>Locations:</strong> ${material.locations.map(loc => `${formatLocationLabel(loc.name)} (${loc.quantity})`).join(', ')}</span>`
                : `<span class="resource-location" style="display: block; margin-top: 5px;"><strong>Location:</strong> ${formatLocationLabel(material.location)}</span>`
            }
            <p class="date"><small>Added: ${new Date(material.created_at).toLocaleDateString()}</small></p>
            ${canEditDetails ? `
            <div class="resource-card-actions">
                <button type="button" class="details-btn" data-material-id="${material.id}">Update Details</button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function setCustomLocationVisibility() {
    if (!detailsLocation || !detailsCustomLocationGroup || !detailsCustomLocation) {
        return;
    }

    const isCustom = detailsLocation.value === 'custom';
    detailsCustomLocationGroup.style.display = isCustom ? 'block' : 'none';
    detailsCustomLocation.required = isCustom;

    if (!isCustom) {
        detailsCustomLocation.value = '';
    }
}

function populateDetailsForm(material) {
    if (!material) {
        return;
    }

    if (detailsName) detailsName.value = material.name || '';
    if (detailsCategory) detailsCategory.value = material.category || '';
    if (detailsTotalQuantity) detailsTotalQuantity.value = material.total_quantity ?? 0;
    if (detailsAvailableQuantity) {
        detailsAvailableQuantity.value = material.available_quantity;
        detailsAvailableQuantity.readOnly = true;
        detailsAvailableQuantity.style.backgroundColor = '#f5f5f5';
        detailsAvailableQuantity.style.cursor = 'not-allowed';
    }
    if (detailsCondition) detailsCondition.value = material.condition || 'Good';
    if (detailsSize) detailsSize.value = material.size || '';
    if (detailsColour) detailsColour.value = material.colour || '';

    // Populate locations
    const locationsContainer = document.getElementById('detailsLocationsContainer');
    if (locationsContainer) {
        // Clear existing rows
        const existingRows = locationsContainer.querySelectorAll('.location-entry');
        existingRows.forEach(row => row.remove());

        const locations = material.locations && material.locations.length > 0 
            ? material.locations 
            : [{ name: normalizeLocation(material.location), quantity: material.total_quantity }];

        locations.forEach(loc => {
            const entry = createDetailsLocationEntry(loc.name, loc.quantity, locations.length === 1);
            locationsContainer.appendChild(entry);
        });
        
        updateDetailsTotalQuantity();
    }

    if (detailsImage) {
        detailsImage.value = '';
    }

    if (detailsMaterialName) {
        detailsMaterialName.textContent = `Review and update ${material.name}`;
    }

    if (detailsMessage) {
        detailsMessage.textContent = '';
    }
}

function locationOptionsFromMaterialLocation(location) {
    const normalized = normalizeLocation(location);
    const standardValues = ['office store', 'chapel', 'rented out'];

    if (standardValues.includes(normalized)) {
        return '';
    }

    return String(location || '').trim();
}

function openDetailsModal(materialId) {
    selectedMaterial = allMaterials.find(material => String(material.id) === String(materialId));

    if (!selectedMaterial || !detailsModal) {
        return;
    }

    populateDetailsForm(selectedMaterial);
    detailsModal.classList.add('open');
    detailsModal.setAttribute('aria-hidden', 'false');
}

function closeDetailsModalFn() {
    if (!detailsModal) {
        return;
    }

    detailsModal.classList.remove('open');
    detailsModal.setAttribute('aria-hidden', 'true');
    selectedMaterial = null;

    if (detailsForm) {
        detailsForm.reset();
    }

    if (detailsMessage) {
        detailsMessage.textContent = '';
    }

    if (detailsCustomLocationGroup) {
        detailsCustomLocationGroup.style.display = 'none';
    }
}

function updateDetailsTotalQuantity() {
    let total = 0;
    let unavailable = 0;
    const locationsContainer = document.getElementById('detailsLocationsContainer');
    if (locationsContainer) {
        locationsContainer.querySelectorAll('.location-entry').forEach(entry => {
            const select = entry.querySelector('.location-select');
            const input = entry.querySelector('.location-quantity');
            const qty = parseInt(input.value) || 0;
            total += qty;
            
            const locName = select.value === 'custom' ? entry.querySelector('.custom-location-input').value : select.value;
            const key = getLocationKey(locName);
            if (key === 'chapel' || key === 'rented') {
                unavailable += qty;
            }
        });
    }
    if (detailsTotalQuantity) {
        detailsTotalQuantity.value = total;
    }
    if (detailsAvailableQuantity) {
        detailsAvailableQuantity.value = Math.max(0, total - unavailable);
    }
}

function handleDetailsLocationChange(entry) {
    const select = entry.querySelector('.location-select');
    const customInput = entry.querySelector('.custom-location-input');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.required = true;
    } else {
        customInput.style.display = 'none';
        customInput.required = false;
    }
}

function createDetailsLocationEntry(locationName = 'office store', quantity = 1, isOnly = false) {
    const div = document.createElement('div');
    div.className = 'location-entry';
    
    const locationOptions = ['office store', 'chapel', 'rented out'];
    const isCustom = !locationOptions.includes(locationName);
    const selectValue = isCustom ? 'custom' : locationName;
    const customValue = isCustom ? locationName : '';

    div.innerHTML = `
        <select class="location-select" required style="flex: 2;">
            <option value="office store" ${selectValue === 'office store' ? 'selected' : ''}>Office Store</option>
            <option value="chapel" ${selectValue === 'chapel' ? 'selected' : ''}>Chapel</option>
            <option value="rented out" ${selectValue === 'rented out' ? 'selected' : ''}>Rented Out</option>
            <option value="custom" ${selectValue === 'custom' ? 'selected' : ''}>Custom</option>
        </select>
        <input type="text" class="custom-location-input" placeholder="Custom location" style="display: ${isCustom ? 'block' : 'none'}; flex: 2;" value="${customValue}">
        <input type="number" class="location-quantity" placeholder="Qty" value="${quantity}" min="1" required style="flex: 1;">
        <button type="button" class="remove-location-btn btn-secondary" style="display: ${isOnly ? 'none' : 'block'}; padding: 0 10px;">✕</button>
    `;

    const select = div.querySelector('.location-select');
    const qtyInput = div.querySelector('.location-quantity');
    const removeBtn = div.querySelector('.remove-location-btn');

    select.addEventListener('change', () => handleDetailsLocationChange(div));
    qtyInput.addEventListener('input', updateDetailsTotalQuantity);
    
    removeBtn.addEventListener('click', () => {
        const locationsContainer = document.getElementById('detailsLocationsContainer');
        if (locationsContainer.querySelectorAll('.location-entry').length > 1) {
            div.remove();
            updateDetailsTotalQuantity();
            
            const entries = locationsContainer.querySelectorAll('.location-entry');
            if (entries.length === 1) {
                entries[0].querySelector('.remove-location-btn').style.display = 'none';
            }
        }
    });

    return div;
}

const addDetailsLocationBtn = document.getElementById('addDetailsLocationBtn');
if (addDetailsLocationBtn) {
    addDetailsLocationBtn.addEventListener('click', () => {
        const locationsContainer = document.getElementById('detailsLocationsContainer');
        if (locationsContainer) {
            locationsContainer.appendChild(createDetailsLocationEntry());
            locationsContainer.querySelectorAll('.remove-location-btn').forEach(btn => {
                btn.style.display = 'block';
            });
            updateDetailsTotalQuantity();
        }
    });
}

async function updateMaterialDetails(event) {
    event.preventDefault();

    if (!selectedMaterial) {
        return;
    }

    if (!authToken) {
        if (detailsMessage) {
            detailsMessage.textContent = 'Please log in before updating details.';
        }
        return;
    }

    const totalQuantity = Number(detailsTotalQuantity ? detailsTotalQuantity.value : selectedMaterial.total_quantity);
    const availableQuantity = Number(detailsAvailableQuantity ? detailsAvailableQuantity.value : selectedMaterial.available_quantity);
    
    const locations = [];
    let hasInvalidLocation = false;
    const locationsContainer = document.getElementById('detailsLocationsContainer');
    
    if (locationsContainer) {
        locationsContainer.querySelectorAll('.location-entry').forEach(entry => {
            const selectValue = entry.querySelector('.location-select').value;
            const customValue = entry.querySelector('.custom-location-input').value.trim();
            const quantity = parseInt(entry.querySelector('.location-quantity').value) || 0;
            
            let locName = selectValue;
            if (selectValue === 'custom') {
                if (!customValue) hasInvalidLocation = true;
                locName = customValue;
            }
            
            if (locName && quantity > 0) {
                locations.push({ name: locName, quantity: quantity });
            }
        });
    }

    if (hasInvalidLocation || locations.length === 0) {
        if (detailsMessage) {
            detailsMessage.textContent = 'Please enter valid locations and quantities.';
        }
        return;
    }

    if (availableQuantity > totalQuantity) {
        if (detailsMessage) {
            detailsMessage.textContent = 'Available quantity cannot exceed total quantity.';
        }
        return;
    }

    if (detailsMessage) {
        detailsMessage.textContent = 'Saving details...';
    }

    const formData = new FormData();
    formData.append('name', detailsName ? detailsName.value.trim() : selectedMaterial.name);
    formData.append('category', detailsCategory ? detailsCategory.value.trim() : selectedMaterial.category);
    formData.append('total_quantity', String(totalQuantity));
    formData.append('available_quantity', String(availableQuantity));
    formData.append('condition', detailsCondition ? detailsCondition.value.trim() : selectedMaterial.condition);
    formData.append('size', detailsSize ? detailsSize.value.trim() : (selectedMaterial.size || ''));
    formData.append('colour', detailsColour ? detailsColour.value.trim() : (selectedMaterial.colour || ''));
    formData.append('locations', JSON.stringify(locations));

    if (detailsImage && detailsImage.files.length > 0) {
        formData.append('image', detailsImage.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/materials/${selectedMaterial.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || 'Failed to update details');
        }

        closeDetailsModalFn();
        showToast.success('Material updated successfully!');
        await loadDashboardData();
    } catch (error) {
        if (detailsMessage) {
            detailsMessage.textContent = error.message || 'Unable to update details.';
        }
        showToast.error(error.message || 'Unable to update details.');
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/materials`);
        const materials = await response.json();

        if (!Array.isArray(materials)) {
            throw new Error('Invalid response format');
        }

        allMaterials = materials;
        updateDashboardNumbers(materials);
        renderResources(applyCurrentFilters(materials));
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (resourceSection) {
            resourceSection.innerHTML = `<p class="error-message">Unable to connect to server. Please ensure the backend is running at ${API_BASE_URL}</p>`;
        }
    }
}

function applyFilters() {
    renderResources(applyCurrentFilters());
}

function resetFilters() {
    if (categorySelect) {
        categorySelect.selectedIndex = 0;
    }

    if (statusSelect) {
        statusSelect.selectedIndex = 0;
    }

    if (searchInput) {
        searchInput.value = '';
    }

    renderResources(allMaterials);
}

const adminLink = document.querySelector('.admin-link');
if (adminLink) {
    adminLink.addEventListener('click', () => {
        if (localStorage.getItem('decoventory_role') === 'admin') {
            window.location.href = '../Admin/index.html';
        } else {
            // Show auth modal instead of redirecting
            if (authModal) {
                authModal.style.display = 'flex';
                if (welcomeModal) welcomeModal.style.display = 'none';
            }
        }
    });
}

// Auth Modal Listeners
if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        welcomeModal.style.display = 'none';
        authModal.style.display = 'flex';
    });
}

if (continueAsViewerBtn) {
    continueAsViewerBtn.addEventListener('click', () => {
        localStorage.setItem('decoventory_role', 'viewer');
        welcomeModal.style.display = 'none';
        // Refresh page to apply viewer restrictions
        window.location.reload();
    });
}

if (backToWelcomeBtn) {
    backToWelcomeBtn.addEventListener('click', () => {
        authModal.style.display = 'none';
        welcomeModal.style.display = 'flex';
    });
}

if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
        const type = passcodeField.type === 'password' ? 'text' : 'password';
        passcodeField.type = type;
        document.getElementById('eyeOpen').style.display = type === 'password' ? 'block' : 'none';
        document.getElementById('eyeClosed').style.display = type === 'password' ? 'none' : 'block';
    });
}

if (execLoginForm) {
    execLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passcode = passcodeField.value.trim();
        
        if (passcode.length !== 6) {
            showToast.error('Please enter a 6-digit access code');
            return;
        }

        const submitBtn = execLoginForm.querySelector('.auth-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            });

            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('decoventory_token', data.token);
                localStorage.setItem('decoventory_role', data.role);
                showToast.success('Login successful!');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showToast.error(data.error || 'Invalid access code');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast.error('Connection failed. Please check backend.');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

if (applyBtn) {
    applyBtn.addEventListener('click', applyFilters);
}

if (categorySelect) {
    categorySelect.addEventListener('change', applyFilters);
}

if (statusSelect) {
    statusSelect.addEventListener('change', applyFilters);
}

if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
}

if (resourceSection) {
    resourceSection.addEventListener('click', event => {
        const button = event.target.closest('.details-btn');

        if (!button || button.disabled) {
            return;
        }

        openDetailsModal(button.dataset.materialId);
    });
}

if (detailsLocation) {
    detailsLocation.addEventListener('change', setCustomLocationVisibility);
}

if (detailsForm) {
    detailsForm.addEventListener('submit', updateMaterialDetails);
}

if (closeDetailsModal) {
    closeDetailsModal.addEventListener('click', closeDetailsModalFn);
}

if (cancelDetailsUpdate) {
    cancelDetailsUpdate.addEventListener('click', closeDetailsModalFn);
}

if (detailsModal) {
    detailsModal.addEventListener('click', event => {
        if (event.target.matches('[data-close-details-modal]')) {
            closeDetailsModalFn();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardData);
} else {
    loadDashboardData();
}

setInterval(loadDashboardData, 30000);
// Logout Logic
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('decoventory_role');
        localStorage.removeItem('decoventory_token');
        window.location.reload();
    });
}
