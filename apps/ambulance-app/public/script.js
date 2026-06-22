// Setup Video FLV (Real stream from 5G network)
const videoElement = document.getElementById('videoElement');
try {
    if (typeof flvjs !== 'undefined' && flvjs.isSupported()) {
        let flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: `http://${window.location.hostname}:8001/live/camera.flv`
        });
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        flvPlayer.play().catch(e => console.log("Auto-play prevented"));
    } else {
        console.warn("FLV.js is not supported or failed to load");
    }
} catch (error) {
    console.error("Error setting up video:", error);
}

const pauseBtn = document.getElementById('pauseBtn');
const recIndicator = document.getElementById('rec-indicator');
function togglePlay() {
    if (videoElement.paused) {
        videoElement.play();
        pauseBtn.innerText = "⏸ PAUSE";
        recIndicator.style.display = "block";
    } else {
        videoElement.pause();
        pauseBtn.innerText = "▶ REPRENDRE";
        recIndicator.style.display = "none";
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
