// Dark mode functionality
const toggleTheme = document.querySelector('.toggle-theme');
const sliderTheme = document.querySelector('.slider');

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

// Type selector functionality
const typeBtns = document.querySelectorAll('.type-btn');
const categorySelect = document.getElementById('category');
let selectedType = 'fabric';

// Category options for each type
const categoryOptions = {
    fabric: [
        { value: 'voile', label: 'Voile' },
        { value: 'satin', label: 'Satin' }
    ],
    tool: [
        { value: 'hand-tools', label: 'Hand Tools' },
        { value: 'equipment', label: 'Equipment' }
    ],
    other: [
        { value: 'decorations', label: 'Decorations' },
        { value: 'lighting', label: 'Lighting' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'miscellaneous', label: 'Miscellaneous' }
    ]
};

// Function to update category options
function updateCategoryOptions(type) {
    const options = categoryOptions[type];
    categorySelect.innerHTML = '';
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        categorySelect.appendChild(optionElement);
    });
}

// Initialize with fabric categories
updateCategoryOptions('fabric');

typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        typeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
        updateCategoryOptions(selectedType);
    });
});

// File upload functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0A3D62';
    uploadArea.style.backgroundColor = '#f5f9ff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#d2d2d7';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#d2d2d7';
    uploadArea.style.backgroundColor = 'transparent';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG, or WEBP)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.value = '';
    previewImg.src = '';
    uploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
});

// Form submission
const addResourceBtn = document.getElementById('addResourceBtn');
const form = document.getElementById('resourceForm');

addResourceBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Check authentication
    const token = localStorage.getItem('decoventory_token');
    if (!token) {
        alert('Please login first');
        window.location.href = '../ExecLogin/index.html';
        return;
    }
    
    // Use FormData to send both file and data
    const formData = new FormData();
    formData.append('name', document.getElementById('resourceName').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('total_quantity', parseInt(document.getElementById('quantity').value));
    formData.append('available_quantity', parseInt(document.getElementById('quantity').value));
    formData.append('condition', 'Good');
    
    // Add image if selected
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    // Show loading state
    const originalText = addResourceBtn.textContent;
    addResourceBtn.textContent = 'Adding...';
    addResourceBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/materials', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type - browser will set it with boundary for multipart/form-data
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('Resource added successfully!');
            window.location.href = '../Dashboard/index.html';
        } else {
            alert(data.error || 'Failed to add resource');
            addResourceBtn.textContent = originalText;
            addResourceBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error adding resource:', error);
        alert('Unable to connect to server. Please ensure the backend is running.');
        addResourceBtn.textContent = originalText;
        addResourceBtn.disabled = false;
    }
});