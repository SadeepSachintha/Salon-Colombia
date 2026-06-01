/* ==========================================================================
   Salon Colombia Pvt Ltd - Main Application JS
   Manages: Header scroll, mobile menu, open/close status, service filters,
            booking modal, local storage appointments, and Leaflet Map
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Navbar Scroll State
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });
    }

    // 3. Real-time Open/Closed Status Indicator (Sri Lanka Time GMT+5:30)
    function updateOpenStatus() {
        const statusBadge = document.getElementById('status-badge');
        if (!statusBadge) return;

        // Salon Colombia Hours: Mon - Sun 09:00 - 19:00 (9:00 AM - 7:00 PM)
        const now = new Date();

        // Convert to Sri Lankan Time (UTC+5:30)
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const slTime = new Date(utc + (3600000 * 5.5));

        const hours = slTime.getHours();
        const minutes = slTime.getMinutes();
        const timeVal = hours + (minutes / 60);

        if (timeVal >= 9 && timeVal < 19) {
            statusBadge.textContent = 'Open Now';
            statusBadge.classList.remove('closed');
        } else {
            statusBadge.textContent = 'Closed';
            statusBadge.classList.add('closed');
        }
    }
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000); // Recalculate every minute

    // 4. Interactive Service Filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    const serviceCards = document.querySelectorAll('.service-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            serviceCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 5. Testimonial Slider Loop
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startSlideShow() {
        slideInterval = setInterval(nextSlide, 6000);
    }

    function resetSlideShow() {
        clearInterval(slideInterval);
        startSlideShow();
    }

    if (slides.length > 0) {
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-slide'));
                showSlide(index);
                resetSlideShow();
            });
        });
        startSlideShow();
    }

    // 6. LocalStorage Appointment Manager
    const appointmentForm = document.getElementById('appointment-form');
    const bookingSuccess = document.getElementById('booking-success');
    const successDetailsContent = document.getElementById('success-details-content');
    const myAppointmentsSection = document.getElementById('my-appointments-section');
    const userAppointmentsList = document.getElementById('user-appointments-list');

    // Set Minimum Date to Today in Datepicker
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        dateInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // Get appointments from LocalStorage
    function getStoredAppointments() {
        const stored = localStorage.getItem('salon_bookings');
        return stored ? JSON.parse(stored) : [];
    }

    // Render stored appointments in dashboard
    function renderAppointments() {
        const bookings = getStoredAppointments();

        if (bookings.length === 0) {
            myAppointmentsSection.style.display = 'none';
            return;
        }

        myAppointmentsSection.style.display = 'block';
        userAppointmentsList.innerHTML = '';

        bookings.forEach((booking, index) => {
            const card = document.createElement('div');
            card.className = 'apt-card';
            card.innerHTML = `
                <span class="apt-badge">Active</span>
                <h4>${booking.service}</h4>
                <p><strong>Client:</strong> ${booking.name}</p>
                <p><strong>Date:</strong> ${booking.date}</p>
                <p><strong>Time Slot:</strong> ${booking.time}</p>
                <span class="apt-cancel" onclick="cancelAppointment(${index})">Cancel Booking</span>
            `;
            userAppointmentsList.appendChild(card);
        });
    }

    // Submit Booking Form handler
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('client-name').value;
            const phone = document.getElementById('client-phone').value;
            const email = document.getElementById('client-email').value;
            const service = document.getElementById('booking-service').value;
            const date = document.getElementById('booking-date').value;
            const time = document.getElementById('booking-time').value;

            const newBooking = { name, phone, email, service, date, time };

            // Store in LocalStorage
            const currentBookings = getStoredAppointments();
            currentBookings.push(newBooking);
            localStorage.setItem('salon_bookings', JSON.stringify(currentBookings));

            // Populate Success screen
            if (successDetailsContent) {
                successDetailsContent.innerHTML = `
                    <p><strong>Service:</strong> <span>${service}</span></p>
                    <p><strong>Date:</strong> <span>${date}</span></p>
                    <p><strong>Time Slot:</strong> <span>${time}</span></p>
                    <p><strong>Contact Name:</strong> <span>${name}</span></p>
                    <p><strong>Hotline:</strong> <span>074 009 9725</span></p>
                `;
            }

            // Generate WhatsApp URL
            const whatsappButton = document.getElementById('btn-whatsapp-confirm');
            if (whatsappButton) {
                const phoneNumber = '94763928333'; // Test WhatsApp Number (International Format)
                const textMessage = `Hello Salon Colombia! I would like to confirm my booking:\n\n` +
                    `*Service:* ${service}\n` +
                    `*Date:* ${date}\n` +
                    `*Time:* ${time}\n` +
                    `*Client Name:* ${name}\n` +
                    `*Contact:* ${phone}` +
                    (email ? `\n*Email:* ${email}` : '') +
                    `\n\nPlease confirm my appointment. Thank you!`;

                whatsappButton.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textMessage)}`;
            }

            // Toggle views inside modal
            appointmentForm.style.display = 'none';
            bookingSuccess.classList.add('show');

            // Re-render user appointments section
            renderAppointments();
        });
    }

    // Cancel appointment function (exposed globally)
    window.cancelAppointment = function (index) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            const bookings = getStoredAppointments();
            bookings.splice(index, 1);
            localStorage.setItem('salon_bookings', JSON.stringify(bookings));
            renderAppointments();
        }
    };

    // Render appointments on page load
    renderAppointments();

    // 7. Interactive Leaflet.js Map Rendering
    // Salon Colombia Location: Mudalige's Avenue, Nugegoda (~6.8710, 79.8988)
    try {
        const map = L.map('salon-map', {
            center: [6.8710, 79.8988],
            zoom: 15,
            scrollWheelZoom: false
        });

        // Add beautiful dark/minimal tiles using OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom Golden Icon for Salon Colombia marker
        const goldIcon = L.divIcon({
            html: `<div style="
                width: 20px; 
                height: 20px; 
                background: #d4af37; 
                border: 3px solid #0a0a0a; 
                border-radius: 50%;
                box-shadow: 0 0 10px #d4af37;
            "></div>`,
            iconSize: [20, 20],
            className: 'custom-gold-marker'
        });

        const marker = L.marker([6.8710, 79.8988], { icon: goldIcon }).addTo(map);

        marker.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
                <h4 style="color:#d4af37; margin-bottom:4px; font-weight:700;">Salon Colombia</h4>
                <p style="font-size:12px; margin:0 0 6px;">17A 2nd Floor, Mudalige's Avenue, Nugegoda</p>
                <a href="tel:0740099725" style="color:#fff; font-weight:700; font-size:12px;">\u{1F4DE} 074 009 9725</a>
            </div>
        `).openPopup();

    } catch (err) {
        console.warn("Leaflet map initialization failed. Check internet connection.", err);
    }
});

// 8. Modal Management Functions (Exposed Globally)
function openBookingModal(preselectedService = '') {
    const modal = document.getElementById('booking-modal');
    const form = document.getElementById('appointment-form');
    const successMsg = document.getElementById('booking-success');
    const serviceSelect = document.getElementById('booking-service');

    if (!modal) return;

    // Reset modal states
    if (form) form.style.display = 'block';
    if (successMsg) successMsg.classList.remove('show');
    if (form) form.reset();

    // Pre-select service if clicked from a card
    if (serviceSelect && preselectedService) {
        // Find match in option values
        for (let option of serviceSelect.options) {
            if (option.value.includes(preselectedService) || preselectedService.includes(option.value)) {
                serviceSelect.value = option.value;
                break;
            }
        }
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Stop body scrolling
}

function closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (!modal) return;

    modal.classList.remove('open');
    document.body.style.overflow = 'auto'; // Enable body scrolling
}
