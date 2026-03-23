(function initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(59, 130, 246, ${0.12 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw dots
        dots.forEach(d => {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 155, 255, 0.5)';
            ctx.fill();
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        });

        requestAnimationFrame(draw);
    }
    draw();
})();

// ── Live Clock ──
function updateClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ── Animated KPI Counter ──
function animateCounter(id, target, prefix = '', suffix = '', decimals = 0) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 1800;
    const start = performance.now();

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        const current = eased * target;
        el.textContent = prefix + (decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toLocaleString()) + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// ── Chart.js Global Defaults ──
Chart.defaults.color = '#64748b';
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.scale.grid.color = 'rgba(255,255,255,0.04)';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(6, 11, 20, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(56, 100, 180, 0.3)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.titleColor = '#e2e8f0';
Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 10;
Chart.defaults.plugins.tooltip.boxPadding = 6;
Chart.defaults.animation.duration = 1200;
Chart.defaults.animation.easing = 'easeOutQuart';

const C_FRAUD = '#ef4444';
const C_LEGIT = '#3b82f6';
const C_PURPLE = '#8b5cf6';
const C_CYAN = '#06b6d4';

// ── Charts Init ──
document.addEventListener('DOMContentLoaded', () => {
    // Animate KPIs
    animateCounter('kpi-total', 152430, '', '');
    animateCounter('kpi-fraud', 3214, '', '');
    animateCounter('kpi-pct', 2.11, '', '%', 2);
    animateCounter('kpi-blocked', 98, '₹', 'L');

    // Chart 1 — Fraud vs Legit (Doughnut)
    new Chart(document.getElementById('fraudVsLegitChart'), {
        type: 'doughnut',
        data: {
            labels: ['Fraud', 'Legitimate'],
            datasets: [{
                data: [3214, 149216],
                backgroundColor: [C_FRAUD, C_LEGIT],
                hoverBackgroundColor: ['#f87171', '#60a5fa'],
                borderColor: '#060b14',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } }
            }
        }
    });

    // Chart 2 — Device Change vs Fraud
    new Chart(document.getElementById('deviceChangeChart'), {
        type: 'bar',
        data: {
            labels: ['Same Device', 'New Device'],
            datasets: [
                { label: 'Fraud', data: [500, 2714], backgroundColor: `${C_FRAUD}cc`, borderRadius: 6, borderSkipped: false },
                { label: 'Legit', data: [140000, 9216], backgroundColor: `${C_LEGIT}cc`, borderRadius: 6, borderSkipped: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { type: 'logarithmic', border: { display: false } }
            },
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } } }
        }
    });

    // Chart 3 — Fraud by Hour (Line) — full width
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const fraudHourly = [45, 30, 25, 60, 110, 85, 40, 65, 90, 120, 145, 130, 160, 190, 210, 235, 185, 290, 240, 180, 150, 205, 120, 75];
    const ctxHr = document.getElementById('fraudByHourChart').getContext('2d');
    const gradHr = ctxHr.createLinearGradient(0, 0, 0, 300);
    gradHr.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
    gradHr.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    new Chart(ctxHr, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Fraud Incidents',
                data: fraudHourly,
                borderColor: C_FRAUD,
                backgroundColor: gradHr,
                borderWidth: 2.5,
                fill: true,
                tension: 0.45,
                pointRadius: 3,
                pointBackgroundColor: '#060b14',
                pointBorderColor: C_FRAUD,
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: C_FRAUD,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { border: { display: false }, beginAtZero: true }
            },
            plugins: { legend: { display: false } },
            interaction: { intersect: false, mode: 'index' }
        }
    });

    // Chart 4 — Fraud by Location (Horizontal Bar)
    new Chart(document.getElementById('fraudLocationChart'), {
        type: 'bar',
        data: {
            labels: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Houston'],
            datasets: [{
                label: 'Fraud Attempts',
                data: [850, 620, 410, 380, 290],
                backgroundColor: [
                    `${C_PURPLE}cc`, `${C_PURPLE}aa`, `${C_PURPLE}88`, `${C_PURPLE}66`, `${C_PURPLE}44`
                ],
                hoverBackgroundColor: C_PURPLE,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Chart 5 — Amount Distribution
    const ctxAmt = document.getElementById('amountDistChart').getContext('2d');
    const gradAmt = ctxAmt.createLinearGradient(0, 0, 0, 200);
    gradAmt.addColorStop(0, `${C_CYAN}bb`);
    gradAmt.addColorStop(1, `${C_CYAN}33`);

    new Chart(ctxAmt, {
        type: 'bar',
        data: {
            labels: ['<₹500', '₹500-1K', '₹1K-5K', '₹5K-50K', '>₹50K'],
            datasets: [{
                label: 'Fraud Count',
                data: [200, 450, 1200, 950, 414],
                backgroundColor: gradAmt,
                hoverBackgroundColor: C_CYAN,
                borderRadius: { topLeft: 6, topRight: 6 },
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, border: { display: false } },
                y: { beginAtZero: true, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
});

// ── Risk Gauge (Real-time preview) ──
function updateRiskMeter(score) {
    const fill = document.getElementById('risk-fill');
    const num = document.getElementById('risk-num');
    const verdict = document.getElementById('risk-verdict');

    if (!fill) return;
    fill.style.width = `${score}%`;

    let color, label;
    if (score >= 60) {
        color = '#ef4444';
        label = 'HIGH RISK';
    } else if (score > 30) {
        color = '#eab308';
        label = 'REVIEW NEEDED';
    } else {
        color = '#10b981';
        label = 'LOW RISK';
    }

    fill.style.background = color;
    if (num) { num.textContent = score; num.style.color = color; }
    if (verdict) { verdict.textContent = label; verdict.style.color = color; }
}

// Live preview as user types
document.addEventListener('DOMContentLoaded', () => {
    const fields = ['amount', 'hour', 'device'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', previewRisk);
    });
    document.getElementById('amount')?.addEventListener('input', previewRisk);
    document.getElementById('hour')?.addEventListener('input', previewRisk);

    function previewRisk() {
        const amount = parseFloat(document.getElementById('amount')?.value) || 0;
        const hour = parseInt(document.getElementById('hour')?.value) ?? -1;
        const device = document.getElementById('device')?.value;
        let score = 0;
        if (amount > 83000) score += 30;   // ~$1,000 in INR
        if (amount > 415000) score += 40;   // ~$5,000 in INR
        if (hour >= 0 && hour <= 4) score += 25;
        if (device === '1') score += 50;
        updateRiskMeter(Math.min(score, 100));
    }
});

// ── Modal Inference Logic ──
let bsModal;

const SCAN_STEPS = [
    { id: 's0', text: 'FEATURE EXTRACTION' },
    { id: 's1', text: 'GLOBAL BLACKLIST CHECK' },
    { id: 's2', text: 'BEHAVIORAL ANALYSIS' },
    { id: 's3', text: 'RANDOM FOREST MODEL' },
    { id: 's4', text: 'RISK SCORE CALCULATION' },
];

async function checkFraud() {
    const data = {
        transaction_amount: parseFloat(document.getElementById("amount").value),
        rapid_txn: parseInt(document.getElementById("rapid").value),
        location_change: parseInt(document.getElementById("location").value),
        device_change: parseInt(document.getElementById("device").value),
        odd_hour: parseInt(document.getElementById("hour").value),
        dormant: parseInt(document.getElementById("dormant").value),
        amount_deviation: 100,
        txn_count: 5
    };

    const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    const resultEl = document.getElementById("result");
    if (resultEl) {
        resultEl.innerHTML = `Fraud: ${result.fraud} <br> Reasons: ${result.reasons.join(", ")}`;
    }
}

function updateRingProgress(pct) {
    const fg = document.querySelector('.ring-fg');
    if (!fg) return;
    const circumference = 314;
    fg.style.strokeDashoffset = circumference - (circumference * pct / 100);
    const pctEl = document.getElementById('ring-pct');
    if (pctEl) pctEl.textContent = pct + '%';
}

let ringAnim;
function animateRing(targetPct) {
    const startPct = parseInt(document.getElementById('ring-pct')?.textContent) || 0;
    const duration = 350;
    const startTime = performance.now();

    cancelAnimationFrame(ringAnim);
    function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const current = startPct + (targetPct - startPct) * t;
        updateRingProgress(Math.round(current));
        if (t < 1) ringAnim = requestAnimationFrame(step);
    }
    ringAnim = requestAnimationFrame(step);
}