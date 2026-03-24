// common.js - общие данные для всех режимов игры

// Ключ для localStorage
const STORAGE_KEY = 'bettingGameGlobalData';

// Глобальные переменные
let globalBalance = 1000;
let globalTotalBets = 0;
let globalWins = 0;
let globalBestWin = 0;
let globalBestStreak = 0;
let globalHistory = [];
let globalBalanceHistory = [1000];

// Загрузка данных
function loadGlobalData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            globalBalance = data.balance || 1000;
            globalTotalBets = data.totalBets || 0;
            globalWins = data.wins || 0;
            globalBestWin = data.bestWin || 0;
            globalBestStreak = data.bestStreak || 0;
            globalHistory = data.history || [];
            globalBalanceHistory = data.balanceHistory || [1000];
            
            if (globalBalanceHistory.length === 0) globalBalanceHistory = [1000];
            if (globalBalanceHistory.length > 20) globalBalanceHistory = globalBalanceHistory.slice(-20);
        } catch(e) {
            console.error('Ошибка загрузки данных:', e);
        }
    }
}

// Сохранение данных
function saveGlobalData() {
    const gameData = {
        balance: globalBalance,
        totalBets: globalTotalBets,
        wins: globalWins,
        bestWin: globalBestWin,
        bestStreak: globalBestStreak,
        history: globalHistory,
        balanceHistory: globalBalanceHistory
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

// Обновление баланса и статистики
function updateGlobalBalance(change, isWin, winAmount, betAmount, result, selected) {
    globalBalance += change;
    
    if (isWin) {
        globalWins++;
        if (winAmount > globalBestWin) globalBestWin = winAmount;
        
        // Обновляем лучшую серию
        if (typeof window !== 'undefined' && window.currentStreak !== undefined) {
            window.currentStreak = (window.currentStreak || 0) + 1;
            if (window.currentStreak > globalBestStreak) {
                globalBestStreak = window.currentStreak;
            }
        }
    } else {
        // Сбрасываем серию при проигрыше
        if (typeof window !== 'undefined') {
            window.currentStreak = 0;
        }
    }
    
    globalTotalBets++;
    
    // Определяем тип игры (автоматически из URL)
    let gameType = 'unknown';
    if (window.location.pathname.includes('index') || window.location.pathname === '/' || window.location.pathname === '') {
        gameType = 'number';
    } else if (window.location.pathname.includes('keno')) {
        gameType = 'keno';
    } else if (window.location.pathname.includes('penalty')) {
        gameType = 'penalty';
    } else if (window.location.pathname.includes('crash')) {
        gameType = 'crash';
    }
    
    // Добавляем в историю
    globalHistory.unshift({
        game: gameType,
        result: result,
        bet: betAmount,
        win: isWin,
        selected: selected || '-',
        winAmount: winAmount,
        timestamp: new Date().toLocaleTimeString()
    });
    
    if (globalHistory.length > 10) globalHistory.pop();
    
    // Сохраняем баланс для графика
    globalBalanceHistory.push(globalBalance);
    if (globalBalanceHistory.length > 20) globalBalanceHistory.shift();
    
    saveGlobalData();
}

// Сброс всех данных
function resetGlobalData() {
    globalBalance = 1000;
    globalTotalBets = 0;
    globalWins = 0;
    globalBestWin = 0;
    globalBestStreak = 0;
    globalHistory = [];
    globalBalanceHistory = [1000];
    
    // Сбрасываем текущую серию если есть
    if (typeof window !== 'undefined') {
        window.currentStreak = 0;
    }
    
    saveGlobalData();
}

// Получить историю баланса для графика
function getBalanceHistory() {
    return globalBalanceHistory;
}

// Получить текущий баланс
function getBalance() {
    return globalBalance;
}

// Получить статистику
function getStats() {
    return {
        balance: globalBalance,
        totalBets: globalTotalBets,
        wins: globalWins,
        bestWin: globalBestWin,
        bestStreak: globalBestStreak,
        winRate: globalTotalBets > 0 ? (globalWins / globalTotalBets * 100).toFixed(1) : 0,
        profit: globalBalance - 1000
    };
}

// Экспорт для использования в других файлах
window.GameData = {
    load: loadGlobalData,
    save: saveGlobalData,
    updateBalance: updateGlobalBalance,
    reset: resetGlobalData,
    getBalance: getBalance,
    getHistory: getBalanceHistory,
    getStats: getStats,
    balance: () => globalBalance,
    setBalance: (newBalance) => { globalBalance = newBalance; saveGlobalData(); }
};

// Автоматическая загрузка данных при старте
loadGlobalData();
