/**
 * Luphonix EmailJS Service Handler
 * Loads environment configuration dynamically from .env
 */

// Helper to fetch and parse .env file asynchronously for client-side JS
async function loadEnvConfig() {
    try {
        const response = await fetch('.env');
        if (!response.ok) return {};
        const text = await response.text();
        const config = {};
        text.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const parts = trimmed.split('=');
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                config[key] = value;
            }
        });
        return config;
    } catch (err) {
        console.warn('Could not load .env file directly, falling back to window.ENV or defaults:', err);
        return {};
    }
}

// EmailJS configuration object dynamically populated from .env
let EMAILJS_CONFIG = {
    publicKey: "",
    serviceId: "",
    templateId: ""
};

// Initialize EmailJS with environment variables loaded from .env
const envPromise = loadEnvConfig().then(env => {
    EMAILJS_CONFIG.publicKey = env.EMAILJS_PUBLIC_KEY || window.ENV?.EMAILJS_PUBLIC_KEY || "";
    EMAILJS_CONFIG.serviceId = env.EMAILJS_SERVICE_ID || window.ENV?.EMAILJS_SERVICE_ID || "";
    EMAILJS_CONFIG.templateId = env.EMAILJS_TEMPLATE_ID || window.ENV?.EMAILJS_TEMPLATE_ID || "";

    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey) {
        emailjs.init({
            publicKey: EMAILJS_CONFIG.publicKey,
        });
    }
    return EMAILJS_CONFIG;
});

/**
 * Handle Contact Form Submission using EmailJS
 */
async function handleContactSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('form-status-message');

    // Basic client validation
    const name = form.elements['name'] ? form.elements['name'].value.trim() : '';
    const email = form.elements['email'] ? form.elements['email'].value.trim() : '';
    const message = form.elements['message'] ? form.elements['message'].value.trim() : '';

    if (!name || !email || !message) {
        showFormStatus(statusDiv, 'Please fill out all required fields.', 'error');
        return;
    }

    // Ensure .env has finished loading before sending
    await envPromise;

    if (!EMAILJS_CONFIG.publicKey) {
        showFormStatus(statusDiv, 'EmailJS keys not configured in .env file.', 'error');
        return;
    }

    // UI Loading state
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('data-original-text', submitBtn.innerHTML);
        submitBtn.innerHTML = 'Sending...';
    }
    showFormStatus(statusDiv, 'Sending your message...', 'info');

    try {
        if (typeof emailjs === 'undefined') {
            throw new Error('EmailJS SDK failed to load.');
        }

        // Send email via EmailJS
        await emailjs.sendForm(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            form
        );

        showFormStatus(statusDiv, 'Thank you! Your message has been sent successfully.', 'success');
        form.reset();
    } catch (err) {
        console.error('EmailJS Submission Error:', err);
        showFormStatus(
            statusDiv,
            'Failed to send message. Please verify your .env configuration or email us directly at luphonix.prime@gmail.com.',
            'error'
        );
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Send Message';
        }
    }
}

/**
 * Helper to display form status messages
 */
function showFormStatus(targetEl, message, type) {
    if (!targetEl) return;
    targetEl.style.display = 'block';
    targetEl.textContent = message;
    
    targetEl.style.padding = '12px 16px';
    targetEl.style.borderRadius = '6px';
    targetEl.style.marginTop = '15px';
    targetEl.style.fontSize = '14px';
    targetEl.style.fontWeight = '500';

    if (type === 'error') {
        targetEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        targetEl.style.color = '#ef4444';
        targetEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
    } else if (type === 'success') {
        targetEl.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
        targetEl.style.color = '#22c55e';
        targetEl.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    } else {
        targetEl.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
        targetEl.style.color = '#3b82f6';
        targetEl.style.border = '1px solid rgba(59, 130, 246, 0.3)';
    }
}
