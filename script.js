document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splashScreen');
    const headSvg = document.getElementById('headSvg');
    const headOutline = document.getElementById('headOutline');
    const circuitLines = Array.from(document.querySelectorAll('#circuitLines .svg-draw'));
    const animatedElements = Array.from(document.querySelectorAll('.animated-element'));
    const subtitleSpans = Array.from(document.querySelectorAll('.subtitle span'));
    const parallaxLayers = Array.from(document.querySelectorAll('.parallax-layer'));
    const particleCanvas = document.getElementById('particleCanvas');
    const ctx = particleCanvas.getContext('2d');

    let particlesArray = [];
    const numberOfParticles = 60; // Increased for richer visual effect
    let lastFrameTime = 0; // For frame rate independent animation
    let mouseX = 0, mouseY = 0; // Store mouse position for particles to react

    // --- Utility Functions ---
    // Debounce function to limit frequent resizing calculations
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Particle System ---
    class Particle {
        constructor() {
            this.x = Math.random() * particleCanvas.width / (window.devicePixelRatio || 1);
            this.y = Math.random() * particleCanvas.height / (window.devicePixelRatio || 1);
            this.size = Math.random() * 2 + 0.7; // Slightly larger particles
            this.baseSize = this.size; // Store original size for pulsing
            this.speedX = Math.random() * 0.6 - 0.3; // Base speed
            this.speedY = Math.random() * 0.6 - 0.3;
            this.alpha = Math.random() * 0.3 + 0.2; // Higher base alpha
            this.color = `rgba(52, 152, 219, ${this.alpha})`;
            this.pulseSpeed = Math.random() * 0.01 + 0.005; // For size pulsing
            this.pulseDirection = Math.random() < 0.5 ? 1 : -1; // Random direction
        }
        
        update(deltaTime, mouseDistance = null) {
            // Apply frame rate independent motion
            const timeScale = deltaTime / 16.67; // Normalized to 60fps
            
            // Update position with frame-rate independent movement
            this.x += this.speedX * timeScale;
            this.y += this.speedY * timeScale;
            
            // Subtle size pulsing
            this.size += this.pulseDirection * this.pulseSpeed * timeScale;
            if (this.size < this.baseSize * 0.7 || this.size > this.baseSize * 1.3) {
                this.pulseDirection *= -1; // Reverse pulse direction
            }
            
            // Mouse interaction - particles accelerate slightly away from mouse
            if (mouseDistance && mouseDistance < 80) {
                const force = (1 - mouseDistance / 80) * 0.2; // Stronger force when closer
                this.speedX += (this.x - mouseX) * force * timeScale * 0.01;
                this.speedY += (this.y - mouseY) * force * timeScale * 0.01;
                
                // Apply some damping to prevent excessive acceleration
                this.speedX *= 0.98;
                this.speedY *= 0.98;
            }

            // Boundary check (wrap around edges)
            const width = particleCanvas.width / (window.devicePixelRatio || 1);
            const height = particleCanvas.height / (window.devicePixelRatio || 1);
            
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
            
            // Update color based on current alpha
            this.color = `rgba(52, 152, 219, ${this.alpha})`;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Optional: Add subtle glow effect for larger particles
            if (this.size > 1.5) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'rgba(52, 152, 219, 0.3)';
                ctx.fill();
                ctx.restore();
            }
        }
    }

    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    function setupCanvas() {
        // Use devicePixelRatio for sharper rendering on high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        particleCanvas.width = window.innerWidth * dpr;
        particleCanvas.height = window.innerHeight * dpr;
        particleCanvas.style.width = `${window.innerWidth}px`;
        particleCanvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);
        
        // Reinitialize particles when canvas size changes
        initParticles();
    }

    function animateParticles(timestamp) {
        // Calculate delta time for frame-rate independent animation
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaTime = timestamp - lastFrameTime;
        lastFrameTime = timestamp;
        
        ctx.clearRect(0, 0, particleCanvas.width / (window.devicePixelRatio || 1), 
                     particleCanvas.height / (window.devicePixelRatio || 1));
                     
        for (let i = 0; i < particlesArray.length; i++) {
            const particle = particlesArray[i];
            
            // Calculate distance to mouse for interaction
            let mouseDistance = null;
            if (mouseX && mouseY) {
                const dx = particle.x - mouseX;
                const dy = particle.y - mouseY;
                mouseDistance = Math.sqrt(dx * dx + dy * dy);
            }
            
            particle.update(deltaTime, mouseDistance);
            particle.draw();
        }
        
        requestAnimationFrame(animateParticles);
    }
    
    // --- SVG Drawing Functions ---
    function initSVGPath(pathElement) {
        if (!pathElement) return;
        const length = pathElement.getTotalLength();
        pathElement.style.strokeDasharray = length;
        pathElement.style.strokeDashoffset = length;
    }
    
    // --- Typewriter Effect ---
    function typeWriter(element, text, delayPerChar, onComplete) {
        let i = 0;
        element.textContent = ''; // Clear existing text
        
        // Variable timing for more natural typing
        function getRandomDelay() {
            // Occasional pause (like a real typist thinking)
            if (Math.random() < 0.1) return delayPerChar * 3;
            // Normal variations in typing speed
            return delayPerChar * (Math.random() * 0.5 + 0.75);
        }
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, getRandomDelay());
            } else if (onComplete) {
                onComplete();
            }
        }
        
        type();
    }
    
    // --- Animation Timing Function ---
    function getEasedDelay(baseDelay, index, total) {
        // Create a curved timing sequence that starts slower,
        // accelerates in the middle, and slows down at the end
        const progress = index / total;
        const easedProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
        return baseDelay + (easedProgress * 1000); // Add up to 1000ms curve
    }

    // --- Initialize Particles ---
    setupCanvas();
    window.addEventListener('resize', debounce(setupCanvas, 250));
    
    // Track mouse movement for particle interaction
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Start particle animation with slight delay
    setTimeout(() => requestAnimationFrame(animateParticles), 500);
    
    // --- Initialize SVG Paths ---
    if (headOutline) initSVGPath(headOutline);
    circuitLines.forEach(line => initSVGPath(line));

    // --- Animation Sequence Setup ---
    const animationSequence = [];
    
    // Head SVG animations
    if (headSvg) animationSequence.push({
        element: headSvg, 
        delay: parseInt(headSvg.dataset.delay) || 0,
        action: () => headSvg.classList.add('visible', `animation-${headSvg.dataset.animationType || 'scaleUp'}`)
    });
    
    if (headOutline) animationSequence.push({
        element: headOutline, 
        delay: (parseInt(headSvg.dataset.delay) || 0) + 200,
        action: () => headOutline.style.animation = 'drawLine 2s cubic-bezier(0.215, 0.61, 0.355, 1) forwards, pulseBreathe 4s infinite alternate cubic-bezier(0.455, 0.03, 0.515, 0.955) 2.2s'
    });
    
    // Circuit lines with staggered, more natural timing
    const totalCircuitLines = circuitLines.length;
    circuitLines.forEach((line, index) => {
        animationSequence.push({
            element: line, 
            delay: (parseInt(headSvg.dataset.delay) || 0) + 700 + getEasedDelay(0, index, totalCircuitLines),
            action: () => {
                const duration = line.tagName === 'circle' ? '0.5s' : '1.2s';
                const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bouncy finish
                line.style.animation = `drawLine ${duration} ${easing} forwards`;
            }
        });
    });

    // General animated elements with improved timing
    animatedElements.forEach(el => {
        if (el === headSvg) return; // Already handled

        const delay = parseInt(el.dataset.delay) || 0;
        const animationType = el.dataset.animationType || 'fadeIn';

        animationSequence.push({
            element: el,
            delay: delay,
            action: () => {
                el.classList.add('visible');
                if (animationType !== 'none' && !el.classList.contains('main-title')) { // main-title has its own complex anim
                    el.classList.add(`animation-${animationType}`);
                }

                // Handle subtitle spans with natural staggered timing
                if (el.classList.contains('subtitle')) {
                    subtitleSpans.forEach((span, i) => {
                        // Use cubic easing for staggered delays
                        const staggeredDelay = i < subtitleSpans.length / 2 
                            ? i * i * 20 // Accelerating 
                            : (subtitleSpans.length - i) * 80; // Decelerating
                        setTimeout(() => span.classList.add('visible'), staggeredDelay);
                    });
                }

                // Handle typewriter text with improved natural typing
                const typewriterElements = el.querySelectorAll('.typewriter-text');
                typewriterElements.forEach(twEl => {
                    const textToType = twEl.dataset.text;
                    const typeDelay = parseInt(twEl.dataset.typeDelay) || 75;
                    twEl.classList.add('visible'); // Make element visible for typing
                    typeWriter(twEl, textToType, typeDelay);
                });

                // Handle micro-animated spans with natural staggered timing
                const microSpans = el.querySelectorAll('.micro-animated');
                microSpans.forEach((span, i) => {
                    const microDelay = parseInt(span.dataset.microDelay) || i * 60; // More natural staggering
                    setTimeout(() => span.classList.add('visible'), microDelay);
                });
            }
        });
    });

    // Sort and start the animation sequence
    animationSequence.sort((a, b) => a.delay - b.delay);
    animationSequence.forEach(item => {
        setTimeout(() => {
            item.action();
        }, item.delay);
    });

    // --- Enhanced Parallax Effect ---
    splashScreen.addEventListener('mousemove', (e) => {
        // Get viewport dimensions
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate mouse position relative to center
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        // Use requestAnimationFrame for smoother parallax
        requestAnimationFrame(() => {
            parallaxLayers.forEach(layer => {
                const factor = parseFloat(layer.dataset.parallaxFactor) || 0.01;
                
                // Apply easing for smoother movement
                const targetX = -mouseX * factor;
                const targetY = -mouseY * factor;
                
                // Get current transform values (if any)
                const currentTransform = window.getComputedStyle(layer).transform;
                const matrix = new DOMMatrix(currentTransform);
                const currentX = matrix.m41;
                const currentY = matrix.m42;
                
                // Calculate position with smooth interpolation (lerping)
                const interpFactor = 0.05; // Lower = smoother but slower
                const newX = currentX + (targetX - currentX) * interpFactor;
                const newY = currentY + (targetY - currentY) * interpFactor;
                
                // Apply transform with slight rotation for more dynamic feeling
                const rotationX = -mouseY * factor * 0.05; // Subtle rotation
                const rotationY = mouseX * factor * 0.05;
                
                layer.style.transform = `translate3d(${newX}px, ${newY}px, 0) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
            });
        });
    });

    // --- Auto Hide Splash Screen ---
    const maxDelay = animationSequence.reduce((max, item) => Math.max(max, item.delay), 0);
    const totalAnimationTime = maxDelay + 3500; // Add buffer for longest animation duration

    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.transition = 'opacity 1s cubic-bezier(0.215, 0.61, 0.355, 1)'; // Smoother transition
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.remove();
                document.body.style.overflow = 'auto'; // Restore scroll
                console.log("Splash screen finished. Main app would load now.");
            }, 1000); // Match transition time
        }
    }, totalAnimationTime);
});