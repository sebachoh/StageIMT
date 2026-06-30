// Setup Video FLV (Real stream from 5G network)
const videoElement1 = document.getElementById('videoElement1');
const videoElement2 = document.getElementById('videoElement2');

function initPlayer(element, streamName, offlineId) {
    const offlineMsg = document.getElementById(offlineId);
    try {
        if (typeof flvjs !== 'undefined' && flvjs.isSupported()) {
            let flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: `http://${window.location.hostname}:8001/live/${streamName}.flv`
            });
            flvPlayer.attachMediaElement(element);
            flvPlayer.load();
            
            // Hide offline message when video receives data
            flvPlayer.on(flvjs.Events.STATISTICS_INFO, function() {
                if(offlineMsg) offlineMsg.style.display = 'none';
            });
            
            flvPlayer.on(flvjs.Events.ERROR, (errType, errDetail) => {
                console.log(`Error on ${streamName}:`, errType, errDetail);
                if(offlineMsg) offlineMsg.style.display = 'flex';
            });

            flvPlayer.play().catch(e => console.log(`Auto-play prevented for ${streamName}`));
            return flvPlayer;
        } else {
            console.warn("FLV.js is not supported or failed to load");
        }
    } catch (error) {
        console.error("Error setting up video:", error);
    }
    return null;
}

const player1 = initPlayer(videoElement1, 'camera', 'offline-cam1');
const player2 = initPlayer(videoElement2, 'camera2', 'offline-cam2');

// --- Panning Logic for Video Elements ---
function makePannable(videoElement, handleElement) {
    let isDragging = false;
    let startX, startY;
    let objX = 50, objY = 50; // default centered

    videoElement.style.objectPosition = `${objX}% ${objY}%`;
    handleElement.style.touchAction = 'none'; // Prevent page scrolling on touch

    const startDrag = (x, y) => {
        isDragging = true;
        startX = x;
        startY = y;
        handleElement.style.cursor = 'grabbing';
    };

    const doDrag = (x, y) => {
        if (!isDragging) return;
        const dx = x - startX;
        const dy = y - startY;
        startX = x;
        startY = y;
        
        // Dragging logic: drag left reveals right content (increases X%)
        const factor = 0.15; 
        objX -= dx * factor;
        objY -= dy * factor;

        // Clamp values between 0% and 100%
        objX = Math.max(0, Math.min(100, objX));
        objY = Math.max(0, Math.min(100, objY));

        videoElement.style.objectPosition = `${objX}% ${objY}%`;
    };

    const endDrag = () => {
        if (isDragging) {
            isDragging = false;
            handleElement.style.cursor = 'grab';
        }
    };

    // Mouse events
    handleElement.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // prevent triggering pause overlay if it bubbled
        startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    // Touch events
    handleElement.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchmove', (e) => doDrag(e.touches[0].clientX, e.touches[0].clientY));
    window.addEventListener('touchend', endDrag);
}

makePannable(videoElement1, document.getElementById('drag-handle-cam1'));
makePannable(videoElement2, document.getElementById('drag-handle-cam2'));

const pauseBtn = document.getElementById('pauseBtn');
const recIndicator = document.getElementById('rec-indicator');

function togglePlay() {
    if (videoElement1.paused || videoElement2.paused) {
        // Resincronizar al momento EN VIVO (saltar el búfer acumulado durante la pausa)
        const syncToLive = (video) => {
            if (video.buffered && video.buffered.length > 0) {
                video.currentTime = video.buffered.end(video.buffered.length - 1) - 0.1;
            }
        };
        syncToLive(videoElement1);
        syncToLive(videoElement2);

        videoElement1.play().catch(e=>{});
        videoElement2.play().catch(e=>{});
        pauseBtn.innerText = "⏸ PAUSE";
        recIndicator.style.display = "flex";
    } else {
        videoElement1.pause();
        videoElement2.pause();
        pauseBtn.innerText = "▶ REPRENDRE";
        recIndicator.style.display = "none";
    }
}

// Layout Switcher
function setLayout(layout) {
    const cont1 = document.getElementById('container-cam1');
    const cont2 = document.getElementById('container-cam2');
    const btn1 = document.getElementById('btn-cam1');
    const btn2 = document.getElementById('btn-cam2');
    const btnSplit = document.getElementById('btn-split');
    const handle1 = document.getElementById('drag-handle-cam1');
    const handle2 = document.getElementById('drag-handle-cam2');

    // Reset buttons
    [btn1, btn2, btnSplit].forEach(btn => {
        btn.className = "px-3 py-1.5 text-xs font-semibold rounded-md text-apple-gray hover:text-apple-dark transition-all";
    });

    if (layout === 'cam1') {
        cont1.style.display = 'block';
        cont2.style.display = 'none';
        btn1.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-apple-dark transition-all";
        handle1.style.display = 'none';
        handle2.style.display = 'none';
    } else if (layout === 'cam2') {
        cont1.style.display = 'none';
        cont2.style.display = 'block';
        btn2.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-apple-dark transition-all";
        handle1.style.display = 'none';
        handle2.style.display = 'none';
    } else if (layout === 'split') {
        cont1.style.display = 'block';
        cont2.style.display = 'block';
        btnSplit.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-apple-dark transition-all";
        handle1.style.display = 'block';
        handle2.style.display = 'block';
    }
}

// Setup Sockets FIRST so vitals work even if charts/video fail
const socket = io();
const elHr = document.getElementById('val-hr');
const elSpo2 = document.getElementById('val-spo2');
const elBp = document.getElementById('val-bp');

let hrChartInstance = null;

socket.on('vitals_update', (data) => {
    elHr.innerText = data.hr;
    elSpo2.innerText = data.spo2;
    elBp.innerText = `${data.sys}/${data.dia}`;
    
    elHr.style.transform = 'scale(1.1)';
    setTimeout(() => elHr.style.transform = 'scale(1)', 100);

    // Update Chart if it exists
    if (hrChartInstance) {
        hrChartInstance.data.datasets[0].data.shift();
        hrChartInstance.data.datasets[0].data.push(data.hr);
        hrChartInstance.update();
    }
});

// Setup Chart (inside try-catch in case CDN fails)
try {
    if (typeof Chart !== 'undefined') {
        const ctxChart = document.getElementById('hrChart').getContext('2d');
        const hrData = Array(30).fill(null);
        hrChartInstance = new Chart(ctxChart, {
            type: 'line',
            data: {
                labels: Array(30).fill(''),
                datasets: [{
                    label: 'Battements par minute',
                    data: hrData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 0 },
                scales: {
                    y: { min: 60, max: 120, grid: { color: '#27272a' }, ticks: { color: '#a1a1aa' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
} catch (error) {
    console.warn("Chart.js failed to load", error);
}
