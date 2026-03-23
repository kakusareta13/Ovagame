// ==================== ИГРОВЫЕ ПЕРЕМЕННЫЕ ====================
let balance = 1000;
let selectedNumber = null;
let history = [];
let totalBets = 0;
let wins = 0;
let bestWin = 0;
let balanceHistory = []; // для графика (последние 20 значений баланса)
let betHistory = []; // для хранения деталей ставок для графика
let currentStreak = 0;
let bestStreak = 0;
let numberFrequency = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};

// Коэффициенты
const multipliers = {0: 8, 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 7, 8: 7, 9: 8};

// График
let balanceChart = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    createNumberButtons();
    loadGameData();
    updateUI();
    initChart();
    
    const betInput = document.getElementById('betAmount');
    betInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') placeBet();
    });
    
    betInput.addEventListener('change', () => {
        let value = parseFloat(betInput.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > balance && balance > 0) value = balance;
        betInput.value = Math.floor(value);
    });
});

// Создание кнопок цифр
function createNumberButtons() {
    const grid = document.getElementById('numbersGrid');
    grid.innerHTML = '';
    
    for(let i = 0; i <= 9; i++) {
        const btn = document.createElement('div');
        btn.className = 'number-btn';
        btn.id = `num-${i}`;
        btn.textContent = i;
        btn.title = `Коэффициент x${multipliers[i]}`;
        btn.onclick = (function(num) {
            return function() { selectNumber(num); };
        })(i);
        grid.appendChild(btn);
    }
}

// Выбор цифры
function selectNumber(number) {
    selectedNumber = number;
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById(`num-${number}`).classList.add('selected');
    showToast(`Выбрана цифра ${number} (коэффициент x${multipliers[number]})`, true);
}

// Генерация случайного числа (криптостойкая)
function getRandomNumber() {
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    return array[0] % 10;
}

// Анимация
async function animateNumber(finalNumber) {
    const display = document.getElementById('currentNumber');
    display.classList.add('spinning-animation');
    
    for(let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 60));
        const randomDigit = Math.floor(Math.random() * 10);
        display.textContent = randomDigit;
    }
    
    display.textContent = finalNumber;
    setTimeout(() => display.classList.remove('spinning-animation'), 600);
}

// Анимация золотых монет (конфетти)
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

// Добавляем CSS анимацию для монет
const style = document.createElement('style');
style.textContent = `
    @keyframes coinFall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Размещение ставки
async function placeBet() {
    if (selectedNumber === null) {
        showToast('Выберите цифру от 0 до 9!', false);
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    
    if (isNaN(betAmount) || betAmount <= 0) {
        showToast('Введите корректную сумму ставки!', false);
        return;
    }
    
    if (betAmount > balance) {
        showToast('Недостаточно средств!', false);
        return;
    }
    
    const betBtn = document.getElementById('placeBetBtn');
    betBtn.disabled = true;
    betBtn.textContent = '🎰 ВРАЩЕНИЕ...';
    
    const result = getRandomNumber();
    const isWin = (result === selectedNumber);
    const multiplier = multipliers[selectedNumber];
    const winAmount = isWin ? betAmount * multiplier : 0;
    
    await animateNumber(result);
    
    // Обновляем частоту цифр
    numberFrequency[result]++;
    
    if (isWin) {
        balance += winAmount;
        showToast(`ПОБЕДА! Выпала цифра ${result}! Выигрыш ${winAmount}$!`, true);
        wins++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        
        // Анимация монет при любом выигрыше
        showCoinsAnimation();
        
        if (winAmount > bestWin) bestWin = winAmount;
    } else {
        balance -= betAmount;
        showToast(`ПРОИГРЫШ! Выпала цифра ${result}`, false);
        currentStreak = 0;
    }
    
    totalBets++;
    
    // Сохраняем в историю
    history.unshift({
        number: result,
        bet: betAmount,
        win: isWin,
        selected: selectedNumber,
        winAmount: winAmount
    });
    
    if (history.length > 10) history.pop();
    
    // Сохраняем баланс для графика
    balanceHistory.push(balance);
    if (balanceHistory.length > 20) balanceHistory.shift();
    
    // Сохраняем детали ставки для графика
    betHistory.unshift({
        balance: balance,
        win: isWin,
        winAmount: winAmount,
        bet: betAmount
    });
    if (betHistory.length > 20) betHistory.pop();
    
    updateUI();
    updateHistoryDisplay();
    updateLeaderboard();
    updateChart();
    saveGameData();
    
    betBtn.disabled = false;
    betBtn.textContent = '🎲 СДЕЛАТЬ СТАВКУ';
    
    if (balance <= 0) {
        setTimeout(() => {
            if (confirm('💀 ИГРА ОКОНЧЕНА! Баланс = 0. Начать заново?')) {
                resetGame();
            }
        }, 500);
    }
}

// Обновление UI
function updateUI() {
    document.getElementById('balance').textContent = Math.floor(balance);
    const winRate = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : 0;
    document.getElementById('winRate').textContent = winRate + '%';
    document.getElementById('totalBets').textContent = totalBets;
    
    const profit = balance - 1000;
    const profitElement = document.getElementById('profit');
    profitElement.textContent = (profit > 0 ? '+' : '') + profit;
    
    document.getElementById('bestWin').textContent = bestWin;
}

// Обновление истории
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div style="color: #666; text-align: center; width: 100%;">Нет ставок. Сделайте первую ставку!</div>';
        return;
    }
    
    historyList.innerHTML = '';
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${item.win ? 'win' : 'lose'}`;
        
        if (item.win) {
            historyItem.innerHTML = `🎲 ${item.number} | ✨ +${item.winAmount}$ ✨<br><small>ставили ${item.bet}$ на ${item.selected}</small>`;
        } else {
            historyItem.innerHTML = `🎲 ${item.number} | 💔 -${item.bet}$<br><small>ставили на ${item.selected}</small>`;
        }
        historyList.appendChild(historyItem);
    });
}

// Обновление таблицы лидеров
function updateLeaderboard() {
    const profit = balance - 1000;
    document.getElementById('leaderboardMaxWin').textContent = bestWin;
    document.getElementById('leaderboardProfit').textContent = (profit > 0 ? '+' : '') + profit;
    document.getElementById('recordBet').textContent = bestWin;
    
    // Самая частая цифра
    let mostCommon = 0;
    let maxCount = 0;
    for (let i = 0; i <= 9; i++) {
        if (numberFrequency[i] > maxCount) {
            maxCount = numberFrequency[i];
            mostCommon = i;
        }
    }
    document.getElementById('mostCommonNumber').textContent = maxCount > 0 ? mostCommon : '-';
    document.getElementById('bestStreak').textContent = bestStreak;
}

// Инициализация графика
function initChart() {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Баланс',
                data: [],
                borderColor: '#0ff',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#0ff',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Баланс: ${Math.floor(context.raw)} $`
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#0ff', callback: (value) => value + '$' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// Обновление графика
function updateChart() {
    const labels = balanceHistory.map((_, i) => i + 1);
    balanceChart.data.labels = labels;
    balanceChart.data.datasets[0].data = balanceHistory;
    balanceChart.update();
}

// Сохранение данных
function saveGameData() {
    const gameData = {
        balance: balance,
        totalBets: totalBets,
        wins: wins,
        bestWin: bestWin,
        bestStreak: bestStreak,
        numberFrequency: numberFrequency,
        history: history,
        balanceHistory: balanceHistory,
        currentStreak: currentStreak
    };
    localStorage.setItem('bettingGameData', JSON.stringify(gameData));
}

// Загрузка данных
function loadGameData() {
    const savedData = localStorage.getItem('bettingGameData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            balance = data.balance || 1000;
            totalBets = data.totalBets || 0;
            wins = data.wins || 0;
            bestWin = data.bestWin || 0;
            bestStreak = data.bestStreak || 0;
            numberFrequency = data.numberFrequency || {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
            history = data.history || [];
            balanceHistory = data.balanceHistory || [1000];
            currentStreak = data.currentStreak || 0;
            
            if (balanceHistory.length === 0) balanceHistory = [1000];
            if (balanceHistory.length > 20) balanceHistory = balanceHistory.slice(-20);
            
            updateUI();
            updateHistoryDisplay();
            updateLeaderboard();
            updateChart();
        } catch(e) {
            console.error('Ошибка загрузки данных:', e);
        }
    } else {
        balanceHistory = [1000];
    }
}

// Сброс игры
function resetGame() {
    if (confirm('Сбросить баланс и всю статистику?')) {
        balance = 1000;
        totalBets = 0;
        wins = 0;
        bestWin = 0;
        bestStreak = 0;
        currentStreak = 0;
        history = [];
        selectedNumber = null;
        numberFrequency = {0:0,1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0};
        balanceHistory = [1000];
        
        updateUI();
        updateHistoryDisplay();
        updateLeaderboard();
        updateChart();
        saveGameData();
        
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        showToast('Игра сброшена! Баланс: 1000$', true);
    }
}

// Очистка истории
function clearHistory() {
    if (confirm('Очистить историю ставок?')) {
        history = [];
        updateHistoryDisplay();
        saveGameData();
        showToast('История очищена', true);
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