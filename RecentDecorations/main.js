document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('galleryGrid');
    const projectModal = document.getElementById('projectModal');
    const addDecorationModal = document.getElementById('addDecorationModal');
    const addDecorationBtn = document.getElementById('addDecorationBtn');
    const addDecorationForm = document.getElementById('addDecorationForm');
    
    // API_BASE_URL and IMAGE_BASE_URL are now provided by api.js


    // Check admin status
    const token = localStorage.getItem('decoventory_token');
    const role = localStorage.getItem('decoventory_role');
    const isAdmin = token && role === 'admin';

    if (isAdmin) {
        addDecorationBtn.style.display = 'grid';
    }

    // Fetch and render projects
    async function fetchProjects() {
        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const projects = await response.json();
            renderGallery(projects);
        } catch (error) {
            console.error(error);
            galleryGrid.innerHTML = `<p class="error-message">Failed to load decorations. Please try again later.</p>`;
        }
    }

    function renderGallery(projects) {
        if (projects.length === 0) {
            galleryGrid.innerHTML = `<p class="no-resources">No recent decorations found.</p>`;
            return;
        }

        galleryGrid.innerHTML = projects.map(project => {
            const mainImage = project.images && project.images.length > 0 
                ? getImageUrl(project.images[0])
                : '../assets/placeholder-decoration.jpg'; // Need a placeholder
            
            const date = new Date(project.event_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="gallery-item" onclick="openProjectDetails(${JSON.stringify(project).replace(/"/g, '&quot;')})">
                    <img src="${mainImage}" alt="${project.event_name}" onerror="this.src='../assets/logo.jpeg'">
                    <div class="gallery-overlay">
                        <div class="gallery-info">
                            <p class="date">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                ${date}
                            </p>
                            <h3>${project.event_name}</h3>
                            <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                ${project.venue}
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    window.openProjectDetails = (project) => {
        document.getElementById('projectTitle').textContent = project.event_name;
        document.getElementById('projectDate').textContent = new Date(project.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('projectVenue').textContent = project.venue;
        document.getElementById('displayCaption').textContent = project.notes || '';
        document.getElementById('displayCaption').style.display = project.notes ? 'block' : 'none';
        
        // Carousel
        const carousel = document.getElementById('projectCarousel');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');

        if (project.images && project.images.length > 0) {
            carousel.innerHTML = project.images.map(img => `<img src="${getImageUrl(img)}" alt="${project.event_name}">`).join('');
            
            // Show/hide nav buttons
            const hasMultiple = project.images.length > 1;
            prevBtn.style.display = hasMultiple ? 'flex' : 'none';
            nextBtn.style.display = hasMultiple ? 'flex' : 'none';

            if (hasMultiple) {
                prevBtn.onclick = () => carousel.scrollBy({ left: -carousel.offsetWidth, behavior: 'smooth' });
                nextBtn.onclick = () => carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
            }
        } else {
            carousel.innerHTML = `<img src="../assets/logo.jpeg" alt="No image available">`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        // Instagram
        const instagramBtn = document.getElementById('instagramLink');
        if (project.instagram_link) {
            instagramBtn.href = project.instagram_link;
            instagramBtn.style.display = 'inline-flex';
        } else {
            instagramBtn.style.display = 'none';
        }

        projectModal.classList.add('open');
    };

    // Close Modals
    document.getElementById('closeProjectBtn').onclick = () => projectModal.classList.remove('open');
    document.getElementById('closeProjectModal').onclick = () => projectModal.classList.remove('open');
    document.getElementById('closeAddBtn').onclick = () => addDecorationModal.classList.remove('open');
    document.getElementById('closeAddModal').onclick = () => addDecorationModal.classList.remove('open');
    document.getElementById('cancelAdd').onclick = () => addDecorationModal.classList.remove('open');

    addDecorationBtn.onclick = () => {
        addDecorationModal.classList.add('open');
    };

    // Handle Add Decoration Form
    addDecorationForm.onsubmit = async (e) => {
        e.preventDefault();

        const submitBtn = addDecorationForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Disable button immediately to prevent double-taps
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        submitBtn.style.opacity = '0.7';

        const formData = new FormData();
        formData.append('event_name', document.getElementById('eventName').value);
        formData.append('venue', document.getElementById('venue').value);
        formData.append('event_date', document.getElementById('eventDate').value);
        formData.append('instagram_link', document.getElementById('instagramUrl').value);
        formData.append('notes', document.getElementById('projectCaption').value);
        formData.append('materials_used', JSON.stringify([]));

        const imageFiles = document.getElementById('decorationImages').files;
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }

        // Show image count in button for large uploads
        if (imageFiles.length > 0) {
            submitBtn.textContent = `Uploading ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Failed to save project');

            showToast.success('Project saved successfully!');
            addDecorationModal.classList.remove('open');
            addDecorationForm.reset();
            fetchProjects();
        } catch (error) {
            console.error(error);
            showToast.error('Error saving project: ' + error.message);
        } finally {
            // Always restore button regardless of outcome
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '';
        }
    };

    // Initial fetch
    fetchProjects();

    // Theme Toggle (Standardized)
    const toggleTheme = document.querySelector('.toggle-theme');
    if (toggleTheme) {
        toggleTheme.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('decoventory_theme', isDark ? 'dark' : 'light');
        });
    }

    if (localStorage.getItem('decoventory_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Role Check for Sidebar Footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (role === 'viewer') {
        if (sidebarFooter) sidebarFooter.style.display = 'none';
        // Also hide tablet nav admin items for viewer
        document.querySelectorAll('.tablet-nav-admin').forEach(el => el.style.display = 'none');
    }

    // Admin & Logout Handlers — wire up both desktop and tablet nav items
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

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('decoventory_token');
            localStorage.removeItem('decoventory_role');
            window.location.reload();
        };
    }

    const tabletLogoutBtn = document.getElementById('tabletLogoutBtn');
    const tabletLogoutAnchor = tabletLogoutBtn ? tabletLogoutBtn.querySelector('a') : null;
    [tabletLogoutBtn, tabletLogoutAnchor].forEach(el => {
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('decoventory_token');
                localStorage.removeItem('decoventory_role');
                window.location.reload();
            });
        }
    });
});
