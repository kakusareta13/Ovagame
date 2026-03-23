// crash-script.js - логика краш-игры

// Переменные краш-игры
let isGameActive = false;
let currentMultiplier = 1.00;
let currentBet = 0;
let animationId = null;
let startTime = null;
let autoCashoutMultiplier = null;
let crashHistory = [];
let bestMultiplier = 1;
let crashPoint = 0;
let lastCrashPoint = 1;
let crashChart = null;
let balanceChart = null;
let chartData = [];
let chartLabels = [];

// Загружаем данные при старте
document.addEventListener('DOMContentLoaded', () => {
    GameData.load();
    updateUI();
    initCrashChart();
    initBalanceChart();
    loadCrashHistory();
    updateLeaderboard();
});

// Инициализация графика краша
function initCrashChart() {
    const ctx = document.getElementById('crashChart').getContext('2d');
    
    // Начальные данные для графика
    chartLabels = Array.from({length: 100}, (_, i) => i);
    chartData = Array.from({length: 100}, (_, i) => 1 + (i * 0.05));
    
    crashChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Множитель',
                data: chartData,
                borderColor: '#ff6600',
                backgroundColor: 'rgba(255, 102, 0, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    callbacks: {
                        label: (context) => `${context.raw.toFixed(2)}x`
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: 0,
                    max: 10,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#ff6600', callback: (value) => value + 'x' }
                }
            }
        }
    });
}

// Инициализация графика баланса
function initBalanceChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    const balanceHistory = GameData.getHistory();
    
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: balanceHistory.map((_, i) => i + 1),
            datasets: [{
                label: 'Баланс',
                data: balanceHistory,
                borderColor: '#0ff',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#0ff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#fff' } },
                tooltip: { callbacks: { label: (ctx) => `Баланс: ${Math.floor(ctx.raw)} $` } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#0ff' } },
                x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            }
        }
    });
}

// Обновление UI
function updateUI() {
    const stats = GameData.getStats();
    document.getElementById('balance').textContent = Math.floor(stats.balance);
    document.getElementById('winRate').textContent = stats.winRate + '%';
    document.getElementById('totalBets').textContent = stats.totalBets;
    const profitElement = document.getElementById('profit');
    const profit = stats.profit;
    // Форматируем профит: без десятичных знаков
    profitElement.textContent = (profit > 0 ? '+' : '') + Math.floor(Math.abs(profit));
}

// Обновление таблицы лидеров
function updateLeaderboard() {
    const stats = GameData.getStats();
    document.getElementById('leaderboardMaxWin').textContent = Math.floor(stats.bestWin);
    const profit = stats.profit;
    document.getElementById('leaderboardProfit').textContent = (profit > 0 ? '+' : '') + Math.floor(Math.abs(profit));
    document.getElementById('bestMultiplier').textContent = bestMultiplier.toFixed(2) + 'x';
    document.getElementById('bestStreak').textContent = stats.bestStreak;
    
    // Средний краш
    if (crashHistory.length > 0) {
        const avg = crashHistory.reduce((a, b) => a + b, 0) / crashHistory.length;
        document.getElementById('avgCrash').textContent = avg.toFixed(2) + 'x';
    }
}

// Обновление графика баланса
function updateBalanceChart() {
    const balanceHistory = GameData.getHistory();
    balanceChart.data.labels = balanceHistory.map((_, i) => i + 1);
    balanceChart.data.datasets[0].data = balanceHistory;
    balanceChart.update();
}

// Анимация золотых монет
function showCoinsAnimation() {
    const container = document.getElementById('toastContainer');
    for(let i = 0; i < 20; i++) {
        const coin = document.createElement('div');
        coin.innerHTML = '💰';
        coin.style.position = 'fixed';
        coin.style.left = Math.random() * window.innerWidth + 'px';
        coin.style.top = '-30px';
        coin.style.fontSize = (20 + Math.random() * 20) + 'px';
        coin.style.opacity = '0.8';
        coin.style.pointerEvents = 'none';
        coin.style.zIndex = '9999';
        coin.style.animation = `coinFall ${0.8 + Math.random() * 0.5}s linear forwards`;
        container.appendChild(coin);
        setTimeout(() => coin.remove(), 1000);
    }
}

// Показ уведомления
function showToast(message, isWin = false) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeftColor = isWin ? '#0f0' : '#f00';
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Генерация точки краша (случайная, но с распределением)
function generateCrashPoint() {
    // Алгоритм: чем выше множитель, тем меньше вероятность
    const r = Math.random();
    if (r < 0.3) return 1 + Math.random() * 0.5;      // 30% - краш до 1.5x
    if (r < 0.6) return 1.5 + Math.random() * 1;      // 30% - краш 1.5-2.5x
    if (r < 0.8) return 2.5 + Math.random() * 2;      // 20% - краш 2.5-4.5x
    if (r < 0.95) return 4.5 + Math.random() * 5.5;   // 15% - краш 4.5-10x
    return 10 + Math.random() * 20;                    // 5% - краш 10-30x
}

// Обновление графика во время игры
function updateGraph(multiplier) {
    const points = 100;
    const step = multiplier / points;
    
    chartData = [];
    for(let i = 0; i <= points; i++) {
        chartData.push(1 + (step * i));
    }
    
    crashChart.data.datasets[0].data = chartData;
    crashChart.update();
    
    // Обновляем линию прогресса
    const line = document.getElementById('crashLine');
    const progress = Math.min(multiplier / crashPoint, 1);
    line.style.left = (progress * 100) + '%';
}

// Запуск игры
function startCrashGame() {
    if (isGameActive) return;
    
    isGameActive = true;
    currentMultiplier = 1.00;
    crashPoint = generateCrashPoint();
    
    document.getElementById('currentMultiplier').textContent = currentMultiplier.toFixed(2) + 'x';
    document.getElementById('gameStatus').textContent = 'Игра идет...';
    document.getElementById('gameStatus').style.color = '#0f0';
    
    updateGraph(1);
    
    // Запускаем анимацию роста множителя
    startTime = Date.now();
    
    function updateMultiplier() {
        if (!isGameActive) return;
        
        const elapsed = (Date.now() - startTime) / 1000;
        // Рост: примерно +1x каждые 1.5 секунды
        currentMultiplier = 1 + (elapsed * 0.7);
        
        document.getElementById('currentMultiplier').textContent = currentMultiplier.toFixed(2) + 'x';
        updateGraph(currentMultiplier);
        
        // Проверка на краш
        if (currentMultiplier >= crashPoint) {
            crash();
            return;
        }
        
        // Проверка автовывода
        if (autoCashoutMultiplier && currentMultiplier >= autoCashoutMultiplier) {
            cashout();
            return;
        }
        
        animationId = requestAnimationFrame(updateMultiplier);
    }
    
    animationId = requestAnimationFrame(updateMultiplier);
}

// Краш
function crash() {
    if (!isGameActive) return;
    
    isGameActive = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('gameStatus').textContent = '💥 КРАШ!';
    document.getElementById('gameStatus').style.color = '#f00';
    
    // Сохраняем в историю
    lastCrashPoint = crashPoint;
    crashHistory.unshift(crashPoint);
    if (crashHistory.length > 10) crashHistory.pop();
    updateCrashHistory();
    
    document.getElementById('lastCrash').textContent = crashPoint.toFixed(2) + 'x';
    
    if (currentBet > 0) {
        // Проигрыш ставки
        GameData.updateBalance(-currentBet, false, 0, currentBet, crashPoint.toFixed(2), '-');
        showToast(`💥 КРАШ на ${crashPoint.toFixed(2)}x! Вы проиграли ${currentBet}$`, false);
        updateUI();
        updateBalanceChart();
        updateLeaderboard();
        
        currentBet = 0;
    }
    
    // Блокируем кнопки
    document.getElementById('placeBetBtn').disabled = false;
    document.getElementById('cashoutBtn').disabled = true;
    
    // Через 2 секунды готовим новый раунд
    setTimeout(() => {
        if (!isGameActive) {
            document.getElementById('gameStatus').textContent = 'Ожидание ставки';
            document.getElementById('gameStatus').style.color = '#888';
            document.getElementById('currentMultiplier').textContent = '1.00x';
            updateGraph(1);
        }
    }, 2000);
}

// Вывод средств
function cashout() {
    if (!isGameActive || currentBet === 0) return;
    
    isGameActive = false;
    cancelAnimationFrame(animationId);
    
    const winAmount = currentBet * currentMultiplier;
    GameData.updateBalance(winAmount, true, winAmount, currentBet, currentMultiplier.toFixed(2), '-');
    
    showToast(`🎉 ВЫВОД на ${currentMultiplier.toFixed(2)}x! Выигрыш ${winAmount.toFixed(2)}$`, true);
    showCoinsAnimation();
    
    updateUI();
    updateBalanceChart();
    updateLeaderboard();
    
    // Обновляем лучший множитель
    if (currentMultiplier > bestMultiplier) {
        bestMultiplier = currentMultiplier;
        updateLeaderboard();
    }
    
    document.getElementById('gameStatus').textContent = `✅ ВЫВОД: ${currentMultiplier.toFixed(2)}x`;
    document.getElementById('gameStatus').style.color = '#0f0';
    document.getElementById('cashoutBtn').disabled = true;
    document.getElementById('placeBetBtn').disabled = false;
    
    currentBet = 0;
    
    // Через 1.5 секунды показываем краш
    setTimeout(() => {
        if (!isGameActive) {
            document.getElementById('gameStatus').textContent = 'Ожидание ставки';
            document.getElementById('gameStatus').style.color = '#888';
            document.getElementById('currentMultiplier').textContent = '1.00x';
            updateGraph(1);
        }
    }, 1500);
}

// Размещение ставки
function placeCrashBet() {
    if (isGameActive) {
        showToast('Игра уже идет! Дождитесь окончания раунда', false);
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    const balance = GameData.getBalance();
    
    if (isNaN(betAmount) || betAmount <= 0) {
        showToast('Введите корректную сумму ставки!', false);
        return;
    }
    
    if (betAmount > balance) {
        showToast('Недостаточно средств!', false);
        return;
    }
    
    currentBet = betAmount;
    GameData.setBalance(balance - betAmount);
    updateUI();
    updateBalanceChart();
    
    startCrashGame();
    
    document.getElementById('placeBetBtn').disabled = true;
    document.getElementById('cashoutBtn').disabled = false;
}

// Установка автовывода
function setAutoCashout() {
    const value = parseFloat(document.getElementById('autoCashout').value);
    if (isNaN(value) || value <= 1) {
        autoCashoutMultiplier = null;
        showToast('Автовывод отключен', false);
        document.getElementById('autoCashout').value = '';
    } else {
        autoCashoutMultiplier = value;
        showToast(`Автовывод установлен на ${value.toFixed(2)}x`, true);
    }
}

// Обновление истории крашей
function updateCrashHistory() {
    const historyList = document.getElementById('crashHistoryList');
    
    if (crashHistory.length === 0) {
        historyList.innerHTML = '<div style="color: #666; text-align: center; width: 100%;">Нет истории</div>';
        return;
    }
    
    historyList.innerHTML = '';
    crashHistory.forEach(point => {
        const item = document.createElement('div');
        item.className = 'crash-history-item' + (point >= 5 ? ' high' : '');
        item.innerHTML = `💥 ${point.toFixed(2)}x`;
        historyList.appendChild(item);
    });
}

// Очистка истории крашей
function clearCrashHistory() {
    crashHistory = [];
    updateCrashHistory();
    showToast('История крашей очищена', true);
}

// Сброс игры
function resetGame() {
    if (confirm('Сбросить баланс и всю статистику?')) {
        GameData.reset();
        currentBet = 0;
        isGameActive = false;
        crashHistory = [];
        bestMultiplier = 1;
        autoCashoutMultiplier = null;
        
        if (animationId) cancelAnimationFrame(animationId);
        
        updateUI();
        updateBalanceChart();
        updateLeaderboard();
        updateCrashHistory();
        
        document.getElementById('placeBetBtn').disabled = false;
        document.getElementById('cashoutBtn').disabled = true;
        document.getElementById('gameStatus').textContent = 'Ожидание ставки';
        document.getElementById('gameStatus').style.color = '#888';
        document.getElementById('currentMultiplier').textContent = '1.00x';
        document.getElementById('autoCashout').value = '';
        updateGraph(1);
        
        showToast('Игра сброшена! Баланс: 1000$', true);
    }
}

// Загрузка истории крашей
function loadCrashHistory() {
    const saved = localStorage.getItem('crashHistory');
    if (saved) {
        try {
            crashHistory = JSON.parse(saved);
            updateCrashHistory();
        } catch(e) {}
    }
}

// Сохранение истории крашей
function saveCrashHistory() {
    localStorage.setItem('crashHistory', JSON.stringify(crashHistory));
}

// Сохраняем историю при изменении
setInterval(() => {
    if (crashHistory.length > 0) saveCrashHistory();
}, 5000);

// Переключение на игру "Угадай цифру"
function switchToNumberGame() {
    window.location.href = 'index.html';
}