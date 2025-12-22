/* js/fx.js */

// 1. SETUP FX LAYER
const fxLayer = document.createElement("div");
fxLayer.id = "fxLayer";
Object.assign(fxLayer.style, {
    position: "fixed", top: "0", left: "0",
    width: "100%", height: "100%",
    pointerEvents: "none", zIndex: "9999", overflow: "hidden"
});
document.body.appendChild(fxLayer);

// 2. SETUP FLASH OVERLAY
const flashOverlay = document.createElement("div");
flashOverlay.id = "flash-overlay";
Object.assign(flashOverlay.style, {
    position: "fixed", top: "0", left: "0",
    width: "100vw", height: "100vh",
    pointerEvents: "none", zIndex: "9000",
    backgroundColor: "white", opacity: "0",
    transition: "opacity 0.1s ease-out",
    mixBlendMode: "overlay"
});
document.body.appendChild(flashOverlay);

// PARTICLE POOL
const MAX_PARTICLES = 80;
const particlePool = [];

function getParticle() {
    if (particlePool.length > 0) return particlePool.pop();
    const p = document.createElement("div");
    Object.assign(p.style, {
        position: "absolute",
        width: "8px", height: "8px",
        borderRadius: "50%",
        pointerEvents: "none",
        willChange: "transform, opacity" 
    });
    return p;
}

function releaseParticle(p) {
    p.remove();
    if (particlePool.length < MAX_PARTICLES) {
        particlePool.push(p);
    }
}

export function spawnParticles(x, y, color) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const count = isMobile ? 8 : 16; 
    const size = isMobile ? "10px" : "6px"; 

    for (let i = 0; i < count; i++) {
        const p = getParticle();
        fxLayer.appendChild(p);
        
        p.style.width = size;
        p.style.height = size;
        p.style.backgroundColor = color;
        p.style.boxShadow = `0 0 12px ${color}`;
        p.style.left = x + "px";
        p.style.top = y + "px";
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 40 + Math.random() * 60; 
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        const anim = p.animate([
            { transform: 'translate3d(0, 0, 0) scale(1.2)', opacity: 1 },
            { transform: `translate3d(${tx}px, ${ty}px, 0) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        });

        anim.onfinish = () => releaseParticle(p);
    }
}

export function triggerShake() {
    const board = document.querySelector('.board');
    if (!board) return;

    if (navigator.vibrate) {
        navigator.vibrate(20); 
    }

    board.classList.remove('shake-active');
    void board.offsetWidth; 
    board.classList.add('shake-active');
    
    setTimeout(() => board.classList.remove('shake-active'), 200);
}

// Cyberpunk Glitch Effect
export function triggerGlitch() {
    const board = document.querySelector('.board');
    if (!board || !document.body.classList.contains('theme-cyberpunk')) return;

    board.style.filter = `hue-rotate(${Math.random() * 90}deg) brightness(1.5)`;
    board.style.transform = `translate3d(${Math.random() * 4 - 2}px, 0, 0) skew(${Math.random() * 2 - 1}deg)`;
    
    setTimeout(() => {
        board.style.filter = '';
        board.style.transform = '';
    }, 150);
}

// NEW: Magma Heat Surge Effect
export function triggerHeat() {
    const board = document.querySelector('.board');
    if (!board || !document.body.classList.contains('theme-magma')) return;

    // Simulate an intense heat distortion
    board.style.filter = `contrast(1.2) brightness(1.3) saturate(1.5)`;
    board.style.transform = `scale(1.01)`;
    triggerFlash('#ff4500'); // Orange-red flash

    setTimeout(() => {
        board.style.filter = '';
        board.style.transform = '';
    }, 200);
}

export function triggerFlash(color = "white") {
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = "0.4";
    setTimeout(() => flashOverlay.style.opacity = "0", 100);
}

export function setBackgroundPulse(color) {
    document.documentElement.style.setProperty('--glow', color);
}

// RESTORED & UPDATED: Victory screen handles Matrix, Cyber, and Magma
export function startCelebration() {
    console.log("System Overload Initiated...");
    const isCyber = document.body.classList.contains('theme-cyberpunk');
    const isMagma = document.body.classList.contains('theme-magma');
    
    let color = '#00ff41'; // Default Matrix Green
    if (isCyber) color = '#fcee0a'; // Cyber Yellow
    if (isMagma) color = '#ff3300'; // Magma Lava Red

    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            spawnParticles(x, y, color); 
            
            // Theme-specific victory flashes
            if (isCyber && i % 10 === 0) triggerFlash('#00f0ff'); // Cyan for Cyber
            if (isMagma && i % 8 === 0) triggerFlash('#ffaa00');  // Gold for Magma
        }, i * 50);
    }
}