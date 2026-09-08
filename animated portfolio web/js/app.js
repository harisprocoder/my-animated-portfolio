/**
 * Main Application Logic for M. Haris's Portfolio
 * Handles navigation, stats counters, clipboard actions, contact form & micro-interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Sticky Header on Scroll ---
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // --- Mobile Navigation Drawer ---
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('open')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });

    // Close menu when clicking nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      });
    });
  }

  // --- Active Nav Link Spy on Scroll ---
  const sections = document.querySelectorAll('section[id]');
  function updateActiveNav() {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const targetLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);
      if (targetLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          targetLink.classList.add('active');
        } else {
          targetLink.classList.remove('active');
        }
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // --- Copy Email to Clipboard ---
  const copyBtn = document.getElementById('btn-copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = 'harishuja05@gmail.com';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = email;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Visual feedback
        const originalHtml = copyBtn.innerHTML;
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = originalHtml;
        }, 2500);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    });
  }

  // --- Contact Form Handling ---
  const contactForm = document.getElementById('portfolio-contact-form');
  const formFeedback = document.getElementById('contact-form-feedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const subject = subjectInput ? subjectInput.value.trim() : 'Project Inquiry';
      const message = messageInput ? messageInput.value.trim() : '';

      // Prepare mailto link with encoded content
      const mailtoUrl = `mailto:harishuja05@gmail.com?subject=${encodeURIComponent(
        `[Portfolio Inquiry] ${subject} - from ${name}`
      )}&body=${encodeURIComponent(
        `Hi Haris,\n\n${message}\n\nFrom:\nName: ${name}\nEmail: ${email}`
      )}`;

      // Show success feedback
      if (formFeedback) {
        formFeedback.classList.add('success');
        formFeedback.innerHTML = '<i class="fa-solid fa-circle-check"></i> Thank you! Opening your email client to dispatch to harishuja05@gmail.com...';
      }

      // Launch mailto
      window.location.href = mailtoUrl;

      // Reset form fields
      contactForm.reset();

      setTimeout(() => {
        if (formFeedback) {
          formFeedback.classList.remove('success');
          formFeedback.innerHTML = '';
        }
      }, 6000);
    });
  }

  // --- Animated Numbers Ticker for Stats ---
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function checkStats() {
    if (statsAnimated || statNumbers.length === 0) return;
    const firstStat = statNumbers[0];
    const rect = firstStat.getBoundingClientRect();

    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      statsAnimated = true;
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'), 10);
        const suffix = stat.getAttribute('data-suffix') || '';
        if (isNaN(target)) return;

        let current = 0;
        const duration = 1800; // ms
        const startTime = performance.now();

        function step(currentTime) {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          // Ease out expo
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const val = Math.floor(easeProgress * target);
          stat.textContent = val + suffix;

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            stat.textContent = target + suffix;
          }
        }
        requestAnimationFrame(step);
      });
    }
  }

  window.addEventListener('scroll', checkStats, { passive: true });
  checkStats();

  // --- Back to Top Smooth Scroll ---
  const backToTopBtn = document.getElementById('btn-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});
