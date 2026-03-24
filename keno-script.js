// keno-script.js - логика игры Кено

// Переменные
let selectedNumbers = [];
let drawnNumbers = [];
let currentBet = 0;
let kenoHistory = [];
let gamesPlayed = 0;
let bestMatch = 0;
let numberFrequency = {};

let balanceChart = null;

// Таблица выплат
const payoutTable = {
    1: { 1: 3 },
    2: { 2: 5 },
    3: { 2: 1, 3: 10 },
    4: { 3: 2, 4: 20 },
    5: { 4: 5, 5: 50 },
    6: { 4: 1, 5: 10, 6: 100 },
    7: { 5: 2, 6: 20, 7: 200 },
    8: { 6: 5, 7: 50, 8: 500 },
    9: { 7: 10, 8: 100, 9: 1000 },
    10: { 8: 20, 9: 200, 10: 2000 }
};

// Загрузка данных
document.addEventListener('DOMContentLoaded', () => {
    GameData.load();
    createNumberGrid();
    updateUI();
    initBalanceChart();
    loadKenoHistory();
    updateLeaderboard();
});

// Создание сетки номеров 1-80
function createNumberGrid() {
    const grid = document.getElementById('numbersGridKeno');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 80; i++) {
        const num = document.createElement('div');
        num.className = 'keno-number';
        num.textContent = i;
        num.onclick = () => toggleNumber(i);
        grid.appendChild(num);
        
        // Инициализируем частоту
        if (!numberFrequency[i]) numberFrequency[i] = 0;
    }
}

// Выбор/снятие номера
function toggleNumber(number) {
    const index = selectedNumbers.indexOf(number);
    
    if (index === -1) {
        if (selectedNumbers.length >= 10) {
            showToast('Можно выбрать не более 10 номеров!', false);
            return;
        }
        selectedNumbers.push(number);
    } else {
        selectedNumbers.splice(index, 1);
    }
    
    updateSelectionUI();
    updateDrawButton();
}

// Обновление UI выбранных номеров
function updateSelectionUI() {
    const allNumbers = document.querySelectorAll('.keno-number');
    allNumbers.forEach((el, i) => {
        const num = i + 1;
        if (selectedNumbers.includes(num)) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
    
    document.getElementById('selectedCount').textContent = selectedNumbers.length;
    
    // Обновляем информацию о максимальном выигрыше
    const count = selectedNumbers.length;
    if (count > 0 && payoutTable[count]) {
        const maxMultiplier = Math.max(...Object.values(payoutTable[count]));
        document.getElementById('maxWinInfo').textContent = `${maxMultiplier}x`;
    } else {
        document.getElementById('maxWinInfo').textContent = '—';
    }
}

// Обновление кнопки розыгрыша
function updateDrawButton() {
    const drawBtn = document.getElementById('drawBtn');
    drawBtn.disabled = selectedNumbers.length === 0;
}

// Очистка выбора
function clearSelection() {
    selectedNumbers = [];
    updateSelectionUI();
    updateDrawButton();
    showToast('Все номера очищены', true);
}

// Генерация 20 случайных номеров
function generateDrawnNumbers() {
    const numbers = [];
    while (numbers.length < 20) {
        const num = Math.floor(Math.random() * 80) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers.sort((a, b) => a - b);
}

// Подсчет совпадений
function countMatches() {
    return selectedNumbers.filter(num => drawnNumbers.includes(num));
}

// Расчет выигрыша
function calculateWin(matches) {
    const count = selectedNumbers.length;
    const matchCount = matches.length;
    
    if (payoutTable[count] && payoutTable[count][matchCount]) {
        return payoutTable[count][matchCount];
    }
    return 0;
}

// Анимация выпавших номеров
async function animateDrawnNumbers() {
    const container = document.getElementById('drawnNumbersList');
    container.innerHTML = '';
    
    for (let i = 0; i < drawnNumbers.length; i++) {
        const num = drawnNumbers[i];
        const numElement = document.createElement('div');
        numElement.className = 'drawn-number';
        numElement.textContent = num;
        container.appendChild(numElement);
        
        // Подсвечиваем номер на сетке
        const gridNumber = document.querySelectorAll('.keno-number')[num - 1];
        gridNumber.classList.add('drawn');
        
        await new Promise(resolve => setTimeout(resolve, 80));
    }
}

// Анимация совпадений
async function animateMatches(matches) {
    const container = document.getElementById('matchesList');
    container.innerHTML = '';
    
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchElement = document.createElement('div');
        matchElement.className = 'match-number';
        matchElement.textContent = match;
        container.appendChild(matchElement);
        
        await new Promise(resolve => setTimeout(resolve, 100));
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

// Анимация золотых монет
function showCoinsAnimation() {
    const container = document.getElementById('toastContainer');
    for(let i = 0; i < 30; i++) {
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

// Добавляем CSS для монет
const coinStyle = document.createElement('style');
coinStyle.textContent = `
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
document.head.appendChild(coinStyle);

// Основная функция розыгрыша
async function drawNumbers() {
    if (selectedNumbers.length === 0) {
        showToast('Выберите номера от 1 до 10!', false);
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
    
    // Блокируем кнопку
    const drawBtn = document.getElementById('drawBtn');
    drawBtn.disabled = true;
    drawBtn.textContent = '🎲 РОЗЫГРЫШ...';
    
    // Генерируем выпавшие номера
    drawnNumbers = generateDrawnNumbers();
    
    // Подсчитываем совпадения
    const matches = countMatches();
    const matchCount = matches.length;
    const multiplier = calculateWin(matches);
    const winAmount = multiplier > 0 ? betAmount * multiplier : 0;
    const isWin = winAmount > 0;
    
    // Анимация
    await animateDrawnNumbers();
    await animateMatches(matches);
    
    // Обновляем статистику
    if (isWin) {
        GameData.updateBalance(winAmount, true, winAmount, betAmount, `${matchCount} совпадений`, selectedNumbers.join(','));
        showToast(`🎉 ПОБЕДА! ${matchCount} совпадений! Выигрыш ${winAmount.toFixed(2)}$ (x${multiplier})`, true);
        showCoinsAnimation();
        
        if (matchCount > bestMatch) bestMatch = matchCount;
    } else {
        GameData.updateBalance(-betAmount, false, 0, betAmount, `${matchCount} совпадений`, selectedNumbers.join(','));
        showToast(`😔 ПРОИГРЫШ! Только ${matchCount} совпадений из ${selectedNumbers.length}`, false);
    }
    
    // Обновляем частоту номеров
    selectedNumbers.forEach(num => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
    });
    
    gamesPlayed++;
    
    // Добавляем в историю
    kenoHistory.unshift({
        selected: [...selectedNumbers],
        drawn: [...drawnNumbers],
        matches: matchCount,
        multiplier: multiplier,
        winAmount: winAmount,
        bet: betAmount,
        isWin: isWin
    });
    
    if (kenoHistory.length > 10) kenoHistory.pop();
    updateKenoHistory();
    
    // Обновляем UI
    updateUI();
    updateBalanceChart();
    updateLeaderboard();
    
    // Сохраняем данные
    saveKenoHistory();
    GameData.save();
    
    // Разблокируем кнопку
    drawBtn.disabled = false;
    drawBtn.textContent = '🎲 РАЗЫГРАТЬ';
    
    // Убираем подсветку drawn через 3 секунды
    setTimeout(() => {
        const allNumbers = document.querySelectorAll('.keno-number');
        allNumbers.forEach(el => el.classList.remove('drawn'));
    }, 3000);
    
    // Проверка баланса
    if (GameData.getBalance() <= 0) {
        setTimeout(() => {
            if (confirm('💀 ИГРА ОКОНЧЕНА! Баланс = 0. Начать заново?')) {
                resetGame();
            }
        }, 500);
    }
}

// Обновление UI
function updateUI() {
    const stats = GameData.getStats();
    document.getElementById('balance').textContent = Math.floor(stats.balance);
    document.getElementById('winRate').textContent = stats.winRate + '%';
    document.getElementById('totalBets').textContent = stats.totalBets;
    const profit = stats.profit;
    const profitElement = document.getElementById('profit');
    if (profit >= 0) {
        profitElement.textContent = '+' + Math.floor(profit);
    } else {
        profitElement.textContent = Math.floor(profit);
    }
}

// Обновление таблицы лидеров
function updateLeaderboard() {
    const stats = GameData.getStats();
    document.getElementById('leaderboardMaxWin').textContent = Math.floor(stats.bestWin);
    const profit = stats.profit;
    if (profit >= 0) {
        document.getElementById('leaderboardProfit').textContent = '+' + Math.floor(profit);
    } else {
        document.getElementById('leaderboardProfit').textContent = Math.floor(profit);
    }
    
    document.getElementById('bestMatch').textContent = bestMatch;
    document.getElementById('gamesPlayed').textContent = gamesPlayed;
    
    // Любимый номер
    let favorite = null;
    let maxCount = 0;
    for (let num in numberFrequency) {
        if (numberFrequency[num] > maxCount) {
            maxCount = numberFrequency[num];
            favorite = num;
        }
    }
    document.getElementById('favoriteNumber').textContent = favorite || '—';
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

// Обновление графика баланса
function updateBalanceChart() {
    const balanceHistory = GameData.getHistory();
    balanceChart.data.labels = balanceHistory.map((_, i) => i + 1);
    balanceChart.data.datasets[0].data = balanceHistory;
    balanceChart.update();
}

// Обновление истории кено
function updateKenoHistory() {
    const historyList = document.getElementById('kenoHistoryList');
    
    if (kenoHistory.length === 0) {
        historyList.innerHTML = '<div style="color: #666; text-align: center; width: 100%;">Нет истории</div>';
        return;
    }
    
    historyList.innerHTML = '';
    kenoHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `keno-history-item ${item.isWin ? 'win' : 'lose'}`;
        
        if (item.isWin) {
            historyItem.innerHTML = `🎰 ${item.matches}/${item.selected.length} совпадений | +${item.winAmount.toFixed(0)}$ (x${item.multiplier})<br><small>Номера: ${item.selected.join(', ')}</small>`;
        } else {
            historyItem.innerHTML = `🎰 ${item.matches}/${item.selected.length} совпадений | -${item.bet}$<br><small>Номера: ${item.selected.join(', ')}</small>`;
        }
        
        historyList.appendChild(historyItem);
    });
}

// Очистка истории
function clearKenoHistory() {
    kenoHistory = [];
    updateKenoHistory();
    saveKenoHistory();
    showToast('История кено очищена', true);
}

// Сохранение истории
function saveKenoHistory() {
    const data = {
        kenoHistory: kenoHistory,
        gamesPlayed: gamesPlayed,
        bestMatch: bestMatch,
        numberFrequency: numberFrequency
    };
    localStorage.setItem('kenoGameData', JSON.stringify(data));
}

// Загрузка истории
function loadKenoHistory() {
    const saved = localStorage.getItem('kenoGameData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            kenoHistory = data.kenoHistory || [];
            gamesPlayed = data.gamesPlayed || 0;
            bestMatch = data.bestMatch || 0;
            numberFrequency = data.numberFrequency || {};
            updateKenoHistory();
        } catch(e) {}
    }
}

// Сброс игры
function resetGame() {
    if (confirm('Сбросить баланс и всю статистику?')) {
        GameData.reset();
        selectedNumbers = [];
        kenoHistory = [];
        gamesPlayed = 0;
        bestMatch = 0;
        numberFrequency = {};
        
        updateUI();
        updateBalanceChart();
        updateLeaderboard();
        updateKenoHistory();
        updateSelectionUI();
        updateDrawButton();
        saveKenoHistory();
        
        document.getElementById('drawnNumbersList').innerHTML = '<div style="color: #666; text-align: center;">Нажмите "РАЗЫГРАТЬ"</div>';
        document.getElementById('matchesList').innerHTML = '';
        document.getElementById('matchesCount').textContent = '0';
        
        showToast('Игра сброшена! Баланс: 1000$', true);
    }
}

// Переключение на игру "Угадай цифру"
function switchToNumberGame() {
    window.location.href = 'index.html';
}
