/* ===== STATE ===== */
let type = 'number';
let mode = 'range';
let spinning = false;
let history = JSON.parse(localStorage.getItem('lm_history') || '[]');

/* ===== DOM ===== */
const $ = id => document.getElementById(id);
const canvas = $('wheelCanvas');
const ctx = canvas.getContext('2d');

/* ===== THEME ===== */
const THEMES = {
    green:  { bg1:'#0d2818', bg2:'#1a4d2e', bg3:'#2d7a4f', accent:'#4ade80', accent2:'#86efac', accentGlow:'rgba(74,222,128,.35)', card:'rgba(255,255,255,.06)', cardBorder:'rgba(74,222,128,.18)', cardSolid:'#0f2e1c', text:'#e8fdf0', textMuted:'rgba(232,253,240,.55)', primary:'#4ade80', primaryDark:'#16a34a' },
    purple: { bg1:'#110d2e', bg2:'#1e1260', bg3:'#3d2ca8', accent:'#a78bfa', accent2:'#c4b5fd', accentGlow:'rgba(167,139,250,.35)', card:'rgba(255,255,255,.06)', cardBorder:'rgba(167,139,250,.22)', cardSolid:'#160d3d', text:'#f5f0ff', textMuted:'rgba(245,240,255,.5)', primary:'#a78bfa', primaryDark:'#7c3aed' },
    dark:   { bg1:'#050505', bg2:'#111', bg3:'#1a1a1a', accent:'#facc15', accent2:'#fde68a', accentGlow:'rgba(250,204,21,.28)', card:'rgba(255,255,255,.04)', cardBorder:'rgba(250,204,21,.18)', cardSolid:'#111', text:'#fafaf9', textMuted:'rgba(250,250,249,.5)', primary:'#facc15', primaryDark:'#ca8a04' }
};

function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const v = THEMES[t] || THEMES.green;
    const r = document.documentElement.style;
    Object.entries({
        '--bg1':v.bg1,'--bg2':v.bg2,'--bg3':v.bg3,
        '--accent':v.accent,'--accent2':v.accent2,'--accent-glow':v.accentGlow,
        '--card':v.card,'--card-border':v.cardBorder,'--card-solid':v.cardSolid,
        '--text':v.text,'--text-muted':v.textMuted,
        '--primary':v.primary,'--primary-dark':v.primaryDark
    }).forEach(([k,val]) => r.setProperty(k, val));
    localStorage.setItem('lm_theme', t);
    document.querySelectorAll('.theme').forEach(el => {
        el.classList.toggle('active', el.dataset.theme === t);
    });
    drawWheel(getPool(), 0);
}

/* ===== ÂM THANH TICK TICK ===== */
let audioCtx = null;
function playTick() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) { console.log("Lỗi âm thanh:", e); }
}

/* ===== WHEEL ===== */
const WHEEL_COLORS_GREEN  = ['#14532d','#166534','#15803d','#16a34a','#22c55e','#4ade80','#86efac','#0d4a22','#1a6b35','#2d9152'];
const WHEEL_COLORS_PURPLE = ['#2e1065','#3b0764','#4c1d95','#5b21b6','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#1e1060','#3b1490'];
const WHEEL_COLORS_DARK   = ['#1c1c1c','#292524','#44403c','#78716c','#a8a29e','#92400e','#78350f','#451a03','#1c1917','#57534e'];

function getThemeColors() {
    const t = localStorage.getItem('lm_theme') || 'green';
    if (t === 'purple') return WHEEL_COLORS_PURPLE;
    if (t === 'dark') return WHEEL_COLORS_DARK;
    return WHEEL_COLORS_GREEN;
}

function drawWheel(items, rotation) {
    const w = canvas.width, cx = w / 2, cy = w / 2, r = cx - 4;
    ctx.clearRect(0, 0, w, w);

    const colors = getThemeColors();
    // Giới hạn vẽ tối đa 150 ô để tránh lag và hiển thị phân vùng rõ ràng
    const displayItems = items.length === 0 ? ['?'] : items.slice(0, 150);
    const slice = (2 * Math.PI) / displayItems.length;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4ade80';

    displayItems.forEach((item, i) => {
        const start = rotation + i * slice;
        const end = start + slice;

        // Vẽ ô
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();

        // Vẽ viền
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Chỉ vẽ chữ nếu số lượng ô <= 100 để tránh rối mắt
        if (displayItems.length <= 100) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(start + slice / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            
            // Cỡ chữ tự co giãn theo số lượng ô
            const fontSize = Math.max(7, Math.min(14, Math.floor((r * 2 * Math.PI) / displayItems.length * 0.6)));
            ctx.font = `bold ${fontSize}px Be Vietnam Pro, Arial`;
            ctx.shadowColor = 'rgba(0,0,0,.6)';
            ctx.shadowBlur = 4;
            const label = String(item).length > 8 ? String(item).slice(0, 7) + '…' : String(item);
            ctx.fillText(label, r - 10, fontSize / 2 - 1);
            ctx.restore();
        }
    });

    // Tâm vòng quay
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Viền ngoài
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.stroke();
}

/* ===== POOL ===== */
function getPool() {
    const used = history.map(h => {
        const parts = h.split(': ');
        return parts.length > 1 ? parts[1].trim() : '';
    });
    // Trải phẳng lịch sử nếu có quay nhiều kết quả cùng lúc
    const usedItems = used.flatMap(u => u.split(', '));

    if (type === 'number') {
        if (mode === 'range') {
            const mn = parseInt($('min').value) || 1;
            const mx = parseInt($('max').value) || 50;
            return Array.from({ length: mx - mn + 1 }, (_, i) => mn + i)
                .filter(n => !usedItems.includes(String(n)));
        }
        return $('list').value.split(',')
            .map(x => x.trim()).filter(x => x && !usedItems.includes(x));
    }
    return $('nameList').value.split(',')
        .map(x => x.trim()).filter(x => x && !usedItems.includes(x));
}

/* ===== RENDER HISTORY ===== */
function renderHistory() {
    $('history').innerHTML = history.length
        ? [...history].reverse().slice(0, 30).join('<br>')
        : '<span style="color:var(--text-muted);font-size:12px">Chưa có lịch sử</span>';
}
renderHistory();
drawWheel(getPool(), 0);

/* ===== SPIN ===== */
function spin() {
    if (spinning) return;
    const pool = getPool();
    if (!pool.length) { alert('Hết kết quả! Hãy reset lịch sử để quay lại.'); return; }

    const count = Math.min(parseInt($('count').value) || 1, pool.length);
    const duration = parseInt($('time').value) || 5000;

    // 1. Rig Mode check
    let rigTarget = null;
    if ($('rigMode').checked && $('rigValue').value.trim()) {
        const rv = $('rigValue').value.trim();
        const normPool = pool.map(x => String(x).trim());
        const idx = normPool.indexOf(rv);
        if (idx !== -1) rigTarget = pool[idx];
    }

    // 2. Chọn trước kết quả
    const results = [];
    const shuffled = [...pool].sort(() => Math.random() - .5);
    
    if (rigTarget !== null) {
        const idx = shuffled.findIndex(x => String(x).trim() === String(rigTarget).trim());
        if (idx > -1) shuffled.splice(idx, 1);
        results.push(rigTarget);
    }
    while (results.length < count && shuffled.length > 0) {
        results.push(shuffled.pop());
    }

    // 3. Đảm bảo kết quả nằm trong giới hạn 150 ô hiển thị
    const winnerIdxInPool = pool.findIndex(x => String(x) === String(results[0]));
    if (winnerIdxInPool >= 150) {
        const temp = pool[0];
        pool[0] = pool[winnerIdxInPool];
        pool[winnerIdxInPool] = temp;
    }

    const displayItems = pool.slice(0, 150);
    const slice = (2 * Math.PI) / displayItems.length;
    const targetIdx = displayItems.findIndex(x => String(x) === String(results[0]));
    
    // 4. TÍNH TOÁN GÓC DỪNG CHÍNH XÁC
    // Tính góc chuẩn để tâm của ô trúng thưởng nằm đúng vào vị trí mũi kim (-PI / 2)
    let baseTargetRot = -Math.PI / 2 - (targetIdx + 0.5) * slice;
    
    // Chuẩn hóa góc về khoảng [0, 2PI] để dễ tính toán
    baseTargetRot = (baseTargetRot % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    
    // Thêm dao động nhỏ để kim dừng ngẫu nhiên tự nhiên (không cứng nhắc nằm chính giữa)
    const randomOffset = (Math.random() * 0.8 - 0.4) * slice;
    baseTargetRot += randomOffset;
    
    // Ép số vòng quay phải là SỐ NGUYÊN để không làm sai lệch góc
    const spins = 10 + Math.floor(Math.random() * 5); 
    const totalRotation = baseTargetRot + (Math.PI * 2) * spins; 

    spinning = true;
    $('spinBtn').disabled = true;
    $('spinBtn').textContent = '⏳ Đang quay...';

    const startTime = performance.now();
    let lastTickSlice = -1;

    // Kích hoạt âm thanh
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    function animateWheel(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // Easing mượt
        const rot = totalRotation * ease; 
        
        drawWheel(pool, rot);

        // Theo dõi xem mũi kim đang chạm vào ô nào để nháy kết quả & kêu tick
        const currentAngleAtTop = (-rot - Math.PI / 2);
        const currentSliceRaw = Math.floor(currentAngleAtTop / slice);
        const normalizedSlice = ((currentSliceRaw % displayItems.length) + displayItems.length) % displayItems.length;

        if (lastTickSlice !== -1 && lastTickSlice !== normalizedSlice) {
            playTick();
            $('resultValues').innerHTML = `<span class="result-spinning">${displayItems[normalizedSlice]}</span>`;
        }
        lastTickSlice = normalizedSlice;

        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            // Ép vẽ khung hình cuối cùng để căn khớp tuyệt đối
            drawWheel(pool, totalRotation);
            finalize(pool, results, totalRotation);
        }
    }
    
    requestAnimationFrame(animateWheel);
}

function finalize(pool, results, finalRot) {
    /* Hiển thị kết quả thật */
    $('resultValues').innerHTML = results.map((r, i) =>
        `<span class="result-value" style="animation-delay:${i * 80}ms">${r}</span>`
    ).join('');

    /* Ghi lịch sử */
    const ts = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const prefix = type === 'number' ? '🎉' : '👤';
    const rec = `${ts} ${prefix}: ${results.join(', ')}`;
    history.push(rec);
    localStorage.setItem('lm_history', JSON.stringify(history));
    renderHistory();

    /* Giữ nguyên bánh xe cũ lúc đang có đủ kết quả.
       Đến lần ấn QUAY tiếp theo, hàm getPool() tự động loại bỏ người trúng cũ. */
    drawWheel(pool, finalRot);

    /* Bắn pháo hoa */
    firework(results.length);

    spinning = false;
    $('spinBtn').disabled = false;
    $('spinBtn').textContent = '⚡ QUAY NGAY';
}

/* ===== FIREWORK ===== */
function firework(count = 1) {
    const total = Math.min(20 + count * 8, 60);
    for (let i = 0; i < total; i++) {
        const f = document.createElement('div');
        f.className = 'firework';
        f.style.left = (30 + Math.random() * 40) + 'vw';
        f.style.top = (20 + Math.random() * 40) + 'vh';
        f.style.background = `hsl(${Math.random() * 360},100%,60%)`;
        f.style.setProperty('--x', `${Math.random() * 300 - 150}px`);
        f.style.setProperty('--y', `${Math.random() * 300 - 150}px`);
        document.body.appendChild(f);
        setTimeout(() => f.remove(), 900);
    }
}

/* ===== EXPORT ===== */
function exportHistory() {
    if (!history.length) { alert('Chưa có lịch sử để xuất!'); return; }
    const content = '=== QUAY MAY MẮN — LỊCH SỬ ===\n\n' + history.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lich-su-quay-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

/* ===== RESET ===== */
function resetHistory() {
    if (!confirm('Xóa toàn bộ lịch sử?')) return;
    history = [];
    localStorage.removeItem('lm_history');
    renderHistory();
    $('resultValues').innerHTML = '<span style="color:var(--text-muted);font-size:14px">Nhấn QUAY để bắt đầu</span>';
    drawWheel(getPool(), 0);
}

/* ===== EVENTS ===== */
// Theme
document.querySelectorAll('.theme').forEach(el => {
    el.onclick = () => setTheme(el.dataset.theme);
});

// Type tabs
document.querySelectorAll('.type-tab').forEach((tab, i) => {
    tab.onclick = () => {
        type = tab.dataset.type;
        document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        $('numberMode').classList.toggle('hidden', type !== 'number');
        $('nameMode').classList.toggle('hidden', type !== 'name');
        drawWheel(getPool(), 0);
    };
});

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
        mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('rangeMode').classList.toggle('hidden', mode !== 'range');
        $('listMode').classList.toggle('hidden', mode !== 'list');
        drawWheel(getPool(), 0);
    };
});

// Live wheel redraw on input change
['min', 'max', 'list', 'nameList'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('input', () => drawWheel(getPool(), 0));
});

// Buttons
$('spinBtn').onclick = spin;
$('resetBtn').onclick = resetHistory;
$('exportBtn').onclick = exportHistory;

// RIG: Ctrl+Alt+R
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && e.key === 'r') {
        $('rigPanel').classList.toggle('hidden');
    }
});

/* ===== INIT THEME ===== */
setTheme(localStorage.getItem('lm_theme') || 'green');

/* ===== PETALS (Tết / tháng 1-2) ===== */
(function () {
    const container = $('petals-container');
    if (!container) return;
    const month = new Date().getMonth() + 1;
    if (month < 1 || month > 2) return;
    const isMobile = window.innerWidth <= 600;
    const CFG = { interval: isMobile ? 900 : 350, minD: isMobile ? 10 : 6, maxD: isMobile ? 16 : 9, init: isMobile ? 4 : 10 };

    function createPetal() {
        const p = document.createElement('div');
        p.className = 'petal';
        const size = Math.random() * 4 + 6;
        const dur = Math.random() * (CFG.maxD - CFG.minD) + CFG.minD;
        p.style.cssText = `left:${Math.random()*100}vw;width:${size}px;height:${size*1.3}px;animation-duration:${dur}s;opacity:${Math.random()*.3+.35};transform:rotate(${Math.random()*360}deg);background:radial-gradient(circle at center,#ff6b9d,#ff1744)`;
        container.appendChild(p);
        setTimeout(() => p.remove(), (dur + 2) * 1000);
    }

    setInterval(createPetal, CFG.interval);
    for (let i = 0; i < CFG.init; i++) setTimeout(createPetal, i * 400);
})();

/* ===== SNOW (Giáng sinh, tháng 12 & 1) ===== */
(function () {
    const snowContainer = $('snow-container');
    if (!snowContainer) return;
    const month = new Date().getMonth() + 1;
    if (!(month === 12 || month === 1)) return;
    const isMobile = window.innerWidth <= 600;
    const CFG = { interval: isMobile ? 900 : 300, minD: isMobile ? 12 : 6, maxD: isMobile ? 18 : 10, minS: isMobile ? 3 : 4, maxS: isMobile ? 6 : 8, init: isMobile ? 5 : 14 };

    function spawnSnow() {
        const s = document.createElement('div');
        s.className = 'snowflake';
        const size = Math.random() * (CFG.maxS - CFG.minS) + CFG.minS;
        const dur = Math.random() * (CFG.maxD - CFG.minD) + CFG.minD;
        s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}vw;animation-duration:${dur}s;opacity:${Math.random()*.4+.4}`;
        snowContainer.appendChild(s);
        setTimeout(() => s.remove(), (dur + 2) * 1000);
    }

    setInterval(spawnSnow, CFG.interval);
    for (let i = 0; i < CFG.init; i++) setTimeout(spawnSnow, i * 350);
})();
