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
    if (userRole === 'viewer' && sidebarFooter) {
        sidebarFooter.style.display = 'none';
    }

    // 2. State & Variables
    let inventory = [];
    let cart = {}; // itemId -> quantity
    
    // Fixed services matching the quotation
    const services = {
        'workmanship': { name: 'Workmanship (persons)', price: 3000, quantity: 0 },
        'tools': { name: 'Tools (scissors, nails, hammer, pins)', price: 2500, quantity: 0 }
    };

    // Prices matching the quotation provided
    const fixedPrices = {
        'Ribbons': 2000,
        'Short fabric material': 2500,
        'Medium fabric material': 3500,
        'Large fabric material': 4500,
        'Extra-large fabric material': 5500,
        'Balloon': 9000,
        'Flowers': 300
    };

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

    // 3. Fetch Inventory
    // We will import API from api.js but since this is a new page, we fetch directly or include api.js in HTML.
    // For now, let's implement the fetch here to avoid modifying HTML imports if not needed, 
    // or we can use the global API if it was included.
    async function loadInventory() {
        try {
            const response = await fetch('http://localhost:3000/api/materials');
            const data = await response.json();
            
            // Filter only items that are relevant for rent/quotes or just display all
            // For the specific quotation, we map names to fixed prices if they match
            inventory = data.map(item => {
                // Determine price based on known mappings or default to 0 if not specified
                let price = 0;
                // Try to find a matching price from the fixedPrices list based on name
                const matchingKey = Object.keys(fixedPrices).find(k => 
                    item.name.toLowerCase().includes(k.toLowerCase()) || 
                    item.category.toLowerCase() === k.toLowerCase()
                );
                
                if (matchingKey) {
                    price = fixedPrices[matchingKey];
                } else if (item.category === 'Fabrics') {
                    price = 3500; // Default generic fabric price
                } else if (item.category === 'Tools') {
                    price = 2500;
                }
                
                return {
                    ...item,
                    price: price
                };
            });
            
            renderInventory();
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            inventoryListEl.innerHTML = '<p style="color:red">Failed to load inventory. Please ensure the backend is running.</p>';
        }
    }

    // 4. Render Inventory Cards
    function renderInventory() {
        if (inventory.length === 0) {
            inventoryListEl.innerHTML = '<p>No items found in inventory.</p>';
            return;
        }

        inventoryListEl.innerHTML = inventory.map(item => {
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

        // Attach listeners to newly created buttons
        attachQuantityListeners();
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
            const response = await fetch('http://localhost:3000/api/quotes', {
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

    // Admin & Logout Handlers
    const adminLink = document.querySelector('.admin-link');
    if (adminLink) {
        adminLink.addEventListener('click', () => {
            if (localStorage.getItem('decoventory_role') === 'admin') {
                window.location.href = '../Admin/index.html';
            } else {
                window.location.href = '../Dashboard/index.html';
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('decoventory_role');
            localStorage.removeItem('decoventory_token');
            window.location.reload();
        });
    }

    // Initial Load
    loadInventory();
});
