const eyeToggle = document.querySelector('.eye-toggle');
const eyeOpen = document.querySelector('#eye-open');
const eyeClosed = document.querySelector('#eye-closed');

const passToken = document.querySelector('#token');

const returnLink = document.querySelector('#return-link');
const backArrow = document.querySelector('#back-arrow');


eyeToggle.addEventListener('click', ()=> {
    eyeOpen.classList.toggle('show');
    eyeOpen.classList.toggle('hide');
    eyeClosed.classList.toggle('hide');
    eyeClosed.classList.toggle('show');

    if (eyeClosed.classList.contains('show')) {
        if (passToken.type === 'password') {
            passToken.type = 'text';
        };
    } else if (eyeOpen.classList.contains('show')) {
        if (passToken.type === 'text') {
            passToken.type = 'password';
        };
    };
});


returnLink.addEventListener('mouseover', ()=> {
    backArrow.style.transform = 'translateX(-10px)';
    console.log('translated!');
});

returnLink.addEventListener('mouseleave', ()=> {
    backArrow.style.transform = 'translateX(0px)';
    console.log('untranslated!');
});

// Login functionality
const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const passcode = passToken.value.trim();
    
    if (!passcode || passcode.length !== 6) {
        alert('Please enter a valid 6-digit access code');
        return;
    }

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Authenticating...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode })
        });

        const data = await response.json();

        if (data.success && data.token) {
            // Save token and role
            localStorage.setItem('decoventory_token', data.token);
            localStorage.setItem('decoventory_role', 'executive');
            
            // Show success and redirect
            alert('Login successful!');
            window.location.href = '../Dashboard/index.html';
        } else {
            alert(data.error || 'Invalid access code');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Unable to connect to server. Please ensure the backend is running.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});