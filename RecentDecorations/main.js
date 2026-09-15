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

    function revealPage() {
        const mainbar = document.querySelector('.mainbar');
        if (mainbar && mainbar.classList.contains('loading-opacity')) {
            mainbar.classList.remove('loading-opacity');
            mainbar.classList.add('fade-in');
        }
    }

    function getGalleryImageUrl(imageUrl, width) {
        const imageUrlWithHost = getImageUrl(imageUrl);
        if (!imageUrlWithHost || !imageUrlWithHost.includes('res.cloudinary.com')) {
            return imageUrlWithHost;
        }

        const transformations = `f_auto,q_auto,w_${width}`;

        return imageUrlWithHost.replace('/image/upload/', `/image/upload/${transformations}/`);
    }

    function renderGallerySkeletons() {
        galleryGrid.setAttribute('aria-busy', 'true');
        galleryGrid.innerHTML = Array.from({ length: 6 }, () => `
            <div class="gallery-skeleton" aria-hidden="true">
                <div class="skeleton skeleton-image"></div>
                <div class="gallery-skeleton__details">
                    <span class="skeleton skeleton-text short"></span>
                    <span class="skeleton skeleton-text medium"></span>
                </div>
            </div>
        `).join('');
    }

    function renderGalleryState(type) {
        const states = {
            empty: {
                title: 'No decorations have been added yet',
                message: 'Check back soon to see the Decoration Unit’s latest work.'
            },
            error: {
                title: 'We could not load the decorations',
                message: 'Check your connection and try again.'
            }
        };
        const state = states[type];
        galleryGrid.setAttribute('aria-busy', 'false');
        galleryGrid.innerHTML = `
            <div class="gallery-state ${type === 'error' ? 'gallery-state--error' : ''}">
                <h3>${state.title}</h3>
                <p>${state.message}</p>
                ${type === 'error' ? '<button type="button" class="reset-btn" data-retry-gallery>Try again</button>' : ''}
            </div>
        `;
    }

    // Fetch and render projects
    async function fetchProjects() {
        renderGallerySkeletons();
        try {
            const response = await fetch(`${API_BASE_URL}/events`);
            if (!response.ok) throw new Error('Failed to fetch projects');
            const projects = await response.json();
            renderGallery(projects);
            revealPage();
        } catch (error) {
            console.error(error);
            renderGalleryState('error');
            revealPage();
        }
    }

    function renderGallery(projects) {
        if (projects.length === 0) {
            renderGalleryState('empty');
            return;
        }

        galleryGrid.setAttribute('aria-busy', 'false');
        galleryGrid.innerHTML = projects.map((project, index) => {
            const mainImage = project.images && project.images.length > 0 
                ? getGalleryImageUrl(project.images[0], 1200)
                : '/assets/logo.jpeg'; // Fallback to logo directly
            
            const date = new Date(project.event_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });

            return `
                <div class="gallery-item" onclick="openProjectDetails(${JSON.stringify(project).replace(/"/g, '&quot;')})">
                    <img src="${mainImage}" alt="${project.event_name}" ${index < 3 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onerror="this.src='/assets/logo.jpeg'">
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
        const carouselWrapper = carousel.closest('.project-carousel-wrapper');
        const projectPanel = document.querySelector('#projectModal .project-panel');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        const carouselPagination = document.getElementById('carouselPagination');

        carousel.onscroll = null;
        carouselPagination.onclick = null;

        function setCarouselShape(image) {
            const isPortrait = image.naturalHeight > image.naturalWidth;
            carouselWrapper.classList.toggle('is-portrait', isPortrait);
            carouselWrapper.classList.toggle('is-landscape', !isPortrait);
            projectPanel.classList.toggle('is-portrait', isPortrait);
        }

        function setActiveCarouselDot(index) {
            carouselPagination.querySelectorAll('.carousel-dot').forEach((dot, dotIndex) => {
                const isActive = dotIndex === index;
                dot.classList.toggle('is-active', isActive);
                dot.setAttribute('aria-current', isActive ? 'true' : 'false');
            });
        }

        function goToCarouselImage(index) {
            carousel.scrollTo({ left: carousel.clientWidth * index, behavior: 'smooth' });
        }

        if (project.images && project.images.length > 0) {
            carousel.innerHTML = project.images.map((img, index) => `<img src="${getGalleryImageUrl(img, 1400)}" alt="${project.event_name}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`).join('');
            carouselPagination.innerHTML = project.images.length > 1
                ? project.images.map((_, index) => `<button type="button" class="carousel-dot ${index === 0 ? 'is-active' : ''}" data-image-index="${index}" aria-label="Show image ${index + 1} of ${project.images.length}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`).join('')
                : '';

            const firstImage = carousel.querySelector('img');
            carouselWrapper.classList.remove('is-portrait', 'is-landscape');
            projectPanel.classList.remove('is-portrait');
            const updateCarouselShape = () => setCarouselShape(firstImage);
            if (firstImage.complete && firstImage.naturalWidth) {
                updateCarouselShape();
            } else {
                firstImage.addEventListener('load', updateCarouselShape, { once: true });
            }
            
            // Show/hide nav buttons
            const hasMultiple = project.images.length > 1;
            prevBtn.style.display = hasMultiple ? 'flex' : 'none';
            nextBtn.style.display = hasMultiple ? 'flex' : 'none';

            if (hasMultiple) {
                prevBtn.onclick = () => goToCarouselImage(Math.max(0, Math.round(carousel.scrollLeft / carousel.clientWidth) - 1));
                nextBtn.onclick = () => goToCarouselImage(Math.min(project.images.length - 1, Math.round(carousel.scrollLeft / carousel.clientWidth) + 1));
                carouselPagination.onclick = event => {
                    const dot = event.target.closest('[data-image-index]');
                    if (dot) goToCarouselImage(Number(dot.dataset.imageIndex));
                };
                carousel.onscroll = () => {
                    const activeIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
                    setActiveCarouselDot(activeIndex);
                };
            }
        } else {
            carousel.innerHTML = `<img src="/assets/logo.jpeg" alt="No image available">`;
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            carouselPagination.innerHTML = '';
            carouselWrapper.classList.remove('is-portrait', 'is-landscape');
            projectPanel.classList.remove('is-portrait');
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
    revealPage();
    fetchProjects();

    galleryGrid.addEventListener('click', event => {
        if (event.target.closest('[data-retry-gallery]')) {
            fetchProjects();
        }
    });

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
