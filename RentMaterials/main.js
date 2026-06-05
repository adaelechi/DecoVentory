document.addEventListener('DOMContentLoaded', async () => {
    // 1. Theme Toggle Logic (Standardized)
    const toggleThemeBtn = document.querySelector('.toggle-theme');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('decoventory_theme', isDark ? 'dark' : 'light');
        });
    }

    if (localStorage.getItem('decoventory_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Role Check
    const userRole = localStorage.getItem('decoventory_role');
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (userRole === 'viewer') {
        // Hide Admin link in footer but keep footer visible
        const adminLink = document.querySelector('.sidebar-footer .settings');
        if (adminLink) adminLink.style.display = 'none';
        
        // Change Logout to Login in sidebar footer
        const logoutSpan = document.querySelector('#logoutBtn .item-name');
        if (logoutSpan) {
            logoutSpan.textContent = 'Login';
            logoutSpan.style.color = 'var(--text-primary)';
        }
        const logoutSvg = document.querySelector('#logoutBtn svg');
        if (logoutSvg) {
            logoutSvg.innerHTML = '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';
        }

        // Handle tablet nav: Hide Admin link but show Login button
        const tabletAdminLink = document.querySelector('.tablet-nav-admin.admin-link');
        if (tabletAdminLink) tabletAdminLink.style.display = 'none';
        
        const tabletLogoutLink = document.getElementById('tabletLogoutBtn');
        if (tabletLogoutLink) {
            tabletLogoutLink.style.display = 'flex';
            const tabletLogoutSpan = tabletLogoutLink.querySelector('.item-name');
            if (tabletLogoutSpan) {
                tabletLogoutSpan.textContent = 'Login';
                tabletLogoutSpan.style.color = 'var(--text-primary)';
            }
            const tabletLogoutSvg = tabletLogoutLink.querySelector('svg');
            if (tabletLogoutSvg) {
                tabletLogoutSvg.innerHTML = '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';
            }
        }
    }

    // 2. State & Variables
    let inventory = [];
    let cart = {}; // itemId -> quantity
    let currentPage = 1;
    const itemsPerPage = 15; // Slightly fewer per page since they are in a sidebar-like panel
    
    // Fixed services matching the quotation
    const services = {
        'workmanship': { name: 'Workmanship (persons)', price: 3000, quantity: 0 },
        'tools': { name: 'Tools (scissors, nails, hammer, pins)', price: 2500, quantity: 0 }
    };

    // Fabric categories — price is determined by SIZE (short < medium < large < xl)
    const FABRIC_CATEGORIES = ['satin', 'voile', 'organza', 'chiffon', 'lace', 'silk', 'tulle', 'fabric'];

    // Size → price map for fabric materials (matches the official quotation)
    const FABRIC_SIZE_PRICES = {
        'short':       2500,
        'small':       2500,  // treat small same as short
        'medium':      3500,
        'large':       4500,
        'extra-large': 5500,
        'xl':          5500,
        'extra large': 5500
    };

    // Non-fabric category prices (category name → price)
    const CATEGORY_PRICES = {
        'ribbon':   2000,
        'ribbons':  2000,
        'balloon':  9000,
        'balloons': 9000,
        'flower':   300,
        'flowers':  300,
        // Tools — priced at 2,500 per unit to match the quotation bundle rate
        'tool':      2500,
        'tools':     2500,
        'scissors':  2500,
        'hammer':    2500,
        'nail':      2500,
        'nails':     2500,
        'pin':       2500,
        'pins':      2500
    };

    /**
     * Determine the rental price for a material based on its category and size.
     * Fabric materials are priced by size; others by category.
     */
    function resolvePrice(item) {
        const cat = (item.category || '').toLowerCase().trim();
        const size = (item.size || '').toLowerCase().trim();

        // Is it a fabric material?
        const isFabric = FABRIC_CATEGORIES.some(fc => cat.includes(fc));
        if (isFabric) {
            // Sort keys by length descending so 'extra-large' is tested before 'large'
            const sizeKey = Object.keys(FABRIC_SIZE_PRICES)
                .sort((a, b) => b.length - a.length)
                .find(k => size.includes(k));
            const price = sizeKey ? FABRIC_SIZE_PRICES[sizeKey] : 3500;
            console.log(`[price] "${item.name}" | cat="${cat}" | size="${size}" | sizeKey="${sizeKey}" → ₦${price}`);
            return price;
        }

        // Non-fabric: match by category
        const catKey = Object.keys(CATEGORY_PRICES).find(k => cat.includes(k));
        const price = catKey ? CATEGORY_PRICES[catKey] : 0;
        console.log(`[price] "${item.name}" | cat="${cat}" | catKey="${catKey}" → ₦${price}`);
        return price;
    }

    // DOM Elements
    const inventoryListEl = document.getElementById('inventory-list');
    const quoteTableBody = document.getElementById('quote-table-body');
    const quoteSubtotalEl = document.getElementById('quote-subtotal');
    
    // Form Elements
    const recipientInput = document.getElementById('recipient-name');
    const locationInput = document.getElementById('event-location');
    const dateInput = document.getElementById('event-date');
    
    // Doc Elements
    const docLocation = document.getElementById('doc-location');
    const docDate = document.getElementById('doc-date');
    const docRecipient = document.getElementById('doc-recipient');
    const docRecipientBottom = document.getElementById('doc-recipient-bottom');
    
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const submitRequestBtn = document.getElementById('submit-request-btn');

    // ── localStorage cache ────────────────────────────────────────────────────
    const CACHE_KEY = 'decoventory_materials_cache';
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — same key as Dashboard

    function getCachedMaterials() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const { data, timestamp } = JSON.parse(raw);
            if (Date.now() - timestamp > CACHE_TTL_MS) return null;
            return data;
        } catch { return null; }
    }

    function setCachedMaterials(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch { /* ignore */ }
    }
    // ─────────────────────────────────────────────────────────────────────────

    function revealPage() {
        const mainbar = document.querySelector('.mainbar');
        if (mainbar && mainbar.classList.contains('loading-opacity')) {
            mainbar.classList.remove('loading-opacity');
            mainbar.classList.add('fade-in');
        }
    }

    // 3. Fetch Inventory
    async function loadInventory() {
        // 1. Render from cache immediately (feels instant)
        const cached = getCachedMaterials();
        if (cached) {
            inventory = cached.map(item => ({ ...item, price: resolvePrice(item) }));
            renderInventory();
            revealPage();
        }

        // 2. Fetch fresh in background
        try {
            // Always bust background fetch to ensure RentMaterials is accurate
            const response = await fetch(`${API_BASE_URL}/materials?t=${Date.now()}`);
            const data = await response.json();
            setCachedMaterials(data);
            inventory = data.map(item => ({
                ...item,
                price: resolvePrice(item)
            }));
            renderInventory();
            revealPage();
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            if (!cached) {
                inventoryListEl.innerHTML = '<p style="color:red">Failed to load inventory. Please ensure the backend is running.</p>';
            }
            revealPage();
        }
    }

    // 4. Render Inventory Cards
    function renderInventory() {
        if (inventory.length === 0) {
            inventoryListEl.innerHTML = '<p>No items found in inventory.</p>';
            const paginationContainer = document.getElementById('pagination-controls');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Pagination Logic
        const totalItems = inventory.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (currentPage > totalPages) currentPage = totalPages || 1;
        if (currentPage < 1) currentPage = 1;
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pagedInventory = inventory.slice(start, end);

        inventoryListEl.innerHTML = pagedInventory.map(item => {
            const available = item.available_quantity || 0;
            const isOutOfStock = available <= 0;
            
            // Initialize cart state if not already set
            if (cart[item.id] === undefined) {
                cart[item.id] = 0;
            }
            
            return `
                <div class="inventory-card">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        ${item.size ? `<p class="size">Size: ${item.size}</p>` : ''}
                        <p class="price">₦${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        <p class="stock ${isOutOfStock ? 'out-of-stock' : ''}">${available} Available</p>
                    </div>
                    <div class="item-controls">
                        <button type="button" class="qty-btn minus" data-type="inventory" data-id="${item.id}" ${isOutOfStock ? 'disabled' : ''}>-</button>
                        <input type="number" class="qty-input" data-type="inventory" data-id="${item.id}" value="${cart[item.id]}" min="0" max="${available}" ${isOutOfStock ? 'disabled' : ''}>
                        <button type="button" class="qty-btn plus" data-type="inventory" data-id="${item.id}" ${isOutOfStock ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        }).join('');

        renderPaginationControls(totalItems, totalPages);
        
        // Attach listeners to newly created buttons
        attachQuantityListeners();
    }

    function renderPaginationControls(totalItems, totalPages) {
        const container = document.getElementById('pagination-controls');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <button type="button" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Prev
            </button>
            <span class="page-info">Page ${currentPage} of ${totalPages}</span>
            <button type="button" class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPageBtn">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
        `;

        document.getElementById('prevPageBtn')?.addEventListener('click', () => changePage(-1));
        document.getElementById('nextPageBtn')?.addEventListener('click', () => changePage(1));
    }

    function changePage(delta) {
        currentPage += delta;
        renderInventory();
        
        // Scroll inventory panel to top
        const panel = document.querySelector('.selection-panel');
        if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 5. Handle Quantity Changes
    function attachQuantityListeners() {
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const type = button.dataset.type;
                const id = button.dataset.id;
                const isPlus = button.classList.contains('plus');
                
                const input = document.querySelector(`input[data-type="${type}"][data-id="${id}"]`);
                let val = parseInt(input.value) || 0;
                const max = parseInt(input.getAttribute('max')) || Infinity;
                
                if (isPlus && val < max) {
                    val++;
                } else if (!isPlus && val > 0) {
                    val--;
                }
                
                input.value = val;
                updateState(type, id, val);
            });
        });

        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const target = e.currentTarget;
                const type = target.dataset.type;
                const id = target.dataset.id;
                let val = parseInt(target.value) || 0;
                const max = parseInt(e.target.getAttribute('max')) || Infinity;
                
                if (val > max) val = max;
                if (val < 0) val = 0;
                
                e.target.value = val;
                updateState(type, id, val);
            });
        });
    }

    function updateState(type, id, quantity) {
        if (type === 'inventory') {
            cart[id] = quantity;
        } else if (type === 'service') {
            services[id].quantity = quantity;
        }
        
        updateQuotation();
    }

    // 6. Form Bindings
    locationInput.addEventListener('input', (e) => {
        docLocation.textContent = e.target.value.toUpperCase() || '[LOCATION]';
        validateForm();
    });

    dateInput.addEventListener('input', (e) => {
        // Format date to DD/MM/YYYY
        if (e.target.value) {
            const d = new Date(e.target.value);
            const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            docDate.textContent = formatted;
        } else {
            docDate.textContent = '...';
        }
        validateForm();
    });

    recipientInput.addEventListener('input', (e) => {
        const val = e.target.value || '[recipient]';
        docRecipient.textContent = val;
        docRecipientBottom.textContent = val;
        validateForm();
    });

    // Initialize date with today's date if empty
    docDate.textContent = new Date().toLocaleDateString('en-GB');

    // 7. Update Quotation Table
    function updateQuotation() {
        let rowsHtml = '';
        let sn = 1;
        let subtotal = 0;

        // Process Inventory Cart
        for (const [id, qty] of Object.entries(cart)) {
            if (qty > 0) {
                const item = inventory.find(i => String(i.id) === String(id));
                if (item) {
                    const total = item.price * qty;
                    subtotal += total;
                    const displayName = item.size ? `${item.name} (${item.size})` : item.name;
                    rowsHtml += createTableRow(sn++, displayName, qty, item.price, total);
                }
            }
        }

        // Process Services
        for (const [id, service] of Object.entries(services)) {
            if (service.quantity > 0) {
                const total = service.price * service.quantity;
                subtotal += total;
                rowsHtml += createTableRow(sn++, service.name, service.quantity, service.price, total);
            }
        }

        if (rowsHtml === '') {
            rowsHtml = '<tr><td colspan="5" style="text-align: center;">No items selected yet.</td></tr>';
        }

        quoteTableBody.innerHTML = rowsHtml;
        quoteSubtotalEl.textContent = `₦${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        
        validateForm();
    }

    function createTableRow(sn, name, qty, price, total) {
        return `
            <tr>
                <td>${sn}</td>
                <td>${name}</td>
                <td>${qty}</td>
                <td>${price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    }

    function validateForm() {
        const hasItems = Object.values(cart).some(q => q > 0) || Object.values(services).some(s => s.quantity > 0);
        const hasDetails = recipientInput.value.trim() !== '' && locationInput.value.trim() !== '' && dateInput.value !== '';
        
        const isValid = hasItems && hasDetails;
        
        downloadPdfBtn.disabled = !isValid;
        submitRequestBtn.disabled = !isValid;
    }

    // 8. PDF Generation
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('pdf-content');
        
        // Prepare element for printing (remove dark mode text colors if any, ensure white bg)
        element.classList.add('pdf-generating');
        
        const opt = {
            margin:       10,
            filename:     `Quotation_${recipientInput.value.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.classList.remove('pdf-generating');
        });
    });

    // 9. Submit Request (Mock for now until Backend supports it)
    submitRequestBtn.addEventListener('click', async () => {
        // Collect data
        const requestData = {
            recipient: recipientInput.value,
            location: locationInput.value,
            date: dateInput.value,
            items: Object.entries(cart).filter(([id, qty]) => qty > 0).map(([id, qty]) => {
                const item = inventory.find(i => String(i.id) === String(id));
                return { 
                    materialId: id, 
                    quantity: qty,
                    materialName: item ? item.name : 'Unknown',
                    size: item ? item.size : ''
                };
            }),
            services: Object.entries(services).filter(([id, s]) => s.quantity > 0).map(([id, s]) => ({ type: id, quantity: s.quantity })),
            status: 'pending'
        };

        try {
            submitRequestBtn.textContent = 'Submitting...';
            submitRequestBtn.disabled = true;

            // Send POST request to API
            const response = await fetch(`${API_BASE_URL}/quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Failed to submit quote request');
            }
            
            const result = await response.json();
            
            showToast.success('Quotation request submitted successfully. Waiting for Admin approval.');
            
            // Reset form
            recipientInput.value = '';
            locationInput.value = '';
            dateInput.value = '';
            
            document.querySelectorAll('.qty-input').forEach(input => {
                input.value = 0;
            });
            
            for (let key in cart) cart[key] = 0;
            for (let key in services) services[key].quantity = 0;
            
            docLocation.textContent = '[LOCATION]';
            docRecipient.textContent = '[recipient]';
            docRecipientBottom.textContent = '[recipient]';
            docDate.textContent = '...';
            
            updateQuotation();

        } catch (error) {
            showToast.error('Failed to submit request.');
        } finally {
            submitRequestBtn.textContent = 'Submit Request';
            validateForm();
        }
    });

    // Admin & Logout Handlers — wire up both desktop sidebar-footer and tablet nav items
    // Target li AND anchor inside for iOS Safari touch compatibility
    document.querySelectorAll('.admin-link, .admin-link > a, .admin-link a').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (localStorage.getItem('decoventory_role') === 'admin') {
                window.location.href = '/Admin/index.html';
            } else {
                window.location.href = '/Dashboard/index.html';
            }
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('decoventory_role');
            localStorage.removeItem('decoventory_token');
            window.location.reload();
        });
    }

    const tabletLogoutBtn = document.getElementById('tabletLogoutBtn');
    const tabletLogoutAnchor = tabletLogoutBtn ? tabletLogoutBtn.querySelector('a') : null;
    [tabletLogoutBtn, tabletLogoutAnchor].forEach(el => {
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('decoventory_role');
                localStorage.removeItem('decoventory_token');
                window.location.reload();
            });
        }
    });

    // Initial Load
    loadInventory();
});
