// 游戏常量
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BALL_SPEED = 7;
const SHOOT_POWER = 10;
const GRAVITY = 0.5;

// 球员数据
const players = {
    lebron: {
        name: "勒布朗·詹姆斯",
        image: "lebron.png",
        stats: {
            speed: 8,
            shooting: 9,
            dribbling: 8,
            defense: 7,
            stamina: 9
        },
        skills: ["强力突破", "后仰跳投", "追身大帽", "战斧劈扣"]
    },
    curry: {
        name: "斯蒂芬·库里",
        image: "curry.png",
        stats: {
            speed: 7,
            shooting: 10,
            dribbling: 9,
            defense: 6,
            stamina: 8
        },
        skills: ["超远三分", "背后运球", "快速出手", "无球跑动"]
    },
    jordan: {
        name: "迈克尔·乔丹",
        image: "jordan.png",
        stats: {
            speed: 9,
            shooting: 9,
            dribbling: 9,
            defense: 9,
            stamina: 9
        },
        skills: ["后仰跳投", "空中换手", "抢断快攻", "飞人扣篮"]
    }
};

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    dribble: null,
    shoot: null,
    score: null,
    block: null,
    crowd: null
};

// 初始化音效
function initSounds() {
    // 运球音效
    sounds.dribble = createDribbleSound();
    
    // 投篮音效
    sounds.shoot = createShootSound();
    
    // 得分音效
    sounds.score = createScoreSound();
    
    // 盖帽音效
    sounds.block = createBlockSound();
    
    // 观众音效
    sounds.crowd = createCrowdSound();
}

// 创建运球音效
function createDribbleSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), 100);
        }
    };
}

// 创建投篮音效
function createShootSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        }
    };
}

// 创建得分音效
function createScoreSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), 300);
        }
    };
}

// 创建盖帽音效
function createBlockSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
        }
    };
}

// 创建观众音效
function createCrowdSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    return {
        play: () => {
            oscillator.start();
        },
        stop: () => {
            oscillator.stop();
        }
    };
}

// 修改playSound函数
function playSound(soundName) {
    if (sounds[soundName]) {
        try {
            sounds[soundName].play();
        } catch (error) {
            console.warn(`播放音效出错: ${soundName}`, error);
        }
    }
}

// 游戏状态
let gameState = {
    mode: 'quick',
    selectedPlayer: null,
    player: {
        x: 100,
        y: 300,
        width: 40,
        height: 80,
        speed: PLAYER_SPEED,
        hasBall: true,
        score: 0,
        stamina: 100,
        skills: [],
        cooldowns: {}
    },
    ai: {
        x: 700,
        y: 300,
        width: 40,
        height: 80,
        speed: PLAYER_SPEED,
        hasBall: false,
        score: 0,
        difficulty: 1,
        behavior: 'defensive'
    },
    ball: {
        x: 100,
        y: 300,
        radius: 10,
        dx: 0,
        dy: 0,
        inAir: false
    },
    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false,
        space: false,
        '1': false,
        '2': false,
        '3': false,
        '4': false
    }
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const playerSelection = document.getElementById('playerSelection');
const playerCards = document.getElementById('playerCards');
const startGameBtn = document.getElementById('startGame');

// 初始化球员选择界面
function initPlayerSelection() {
    Object.entries(players).forEach(([id, player]) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <h3>${player.name}</h3>
            <div class="player-stats">
                <p>速度: ${player.stats.speed}/10</p>
                <p>投篮: ${player.stats.shooting}/10</p>
                <p>运球: ${player.stats.dribbling}/10</p>
                <p>防守: ${player.stats.defense}/10</p>
                <p>体力: ${player.stats.stamina}/10</p>
            </div>
        `;
        card.addEventListener('click', () => selectPlayer(id));
        playerCards.appendChild(card);
    });

    document.querySelectorAll('.game-mode').forEach(button => {
        button.addEventListener('click', () => {
            gameState.mode = button.dataset.mode;
            document.querySelectorAll('.game-mode').forEach(b => b.style.backgroundColor = '#555');
            button.style.backgroundColor = '#666';
        });
    });

    startGameBtn.addEventListener('click', startGame);
}

function selectPlayer(playerId) {
    gameState.selectedPlayer = playerId;
    document.querySelectorAll('.player-card').forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function startGame() {
    if (!gameState.selectedPlayer) return;
    
    const selectedPlayer = players[gameState.selectedPlayer];
    gameState.player.speed = selectedPlayer.stats.speed;
    gameState.player.skills = selectedPlayer.skills;
    
    playerSelection.style.display = 'none';
    canvas.style.display = 'block';
    
    // 尝试播放背景音效，但不强制要求
    try {
        if (sounds.crowd) {
            sounds.crowd.play();
        }
    } catch (error) {
        console.warn('初始化背景音效失败', error);
    }
}

// 事件监听
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function handleKeyDown(e) {
    if (e.key.toLowerCase() === 'w') gameState.keys.w = true;
    if (e.key.toLowerCase() === 'a') gameState.keys.a = true;
    if (e.key.toLowerCase() === 's') gameState.keys.s = true;
    if (e.key.toLowerCase() === 'd') gameState.keys.d = true;
    if (e.key === 'Shift') gameState.keys.shift = true;
    if (e.key === ' ') gameState.keys.space = true;
    if (['1', '2', '3', '4'].includes(e.key)) {
        gameState.keys[e.key] = true;
        useSkill(parseInt(e.key));
    }
}

function handleKeyUp(e) {
    if (e.key.toLowerCase() === 'w') gameState.keys.w = false;
    if (e.key.toLowerCase() === 'a') gameState.keys.a = false;
    if (e.key.toLowerCase() === 's') gameState.keys.s = false;
    if (e.key.toLowerCase() === 'd') gameState.keys.d = false;
    if (e.key === 'Shift') gameState.keys.shift = false;
    if (e.key === ' ') gameState.keys.space = false;
    if (['1', '2', '3', '4'].includes(e.key)) gameState.keys[e.key] = false;
}

// 技能系统
function useSkill(skillNumber) {
    if (!gameState.player.skills[skillNumber - 1]) return;
    if (gameState.player.cooldowns[skillNumber]) return;
    
    const skill = gameState.player.skills[skillNumber - 1];
    gameState.player.cooldowns[skillNumber] = 100; // 10秒冷却
    
    switch(skill) {
        case "强力突破":
            gameState.player.speed *= 1.5;
            setTimeout(() => gameState.player.speed = players[gameState.selectedPlayer].stats.speed, 2000);
            break;
        case "后仰跳投":
            if (gameState.player.hasBall) {
                gameState.player.hasBall = false;
                gameState.ball.inAir = true;
                gameState.ball.dx = BALL_SPEED * 1.2;
                gameState.ball.dy = -SHOOT_POWER * 1.2;
                playSound('shoot');
            }
            break;
        // 其他技能实现...
    }
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 更新游戏状态
function update() {
    // 更新冷却时间
    Object.keys(gameState.player.cooldowns).forEach(skill => {
        if (gameState.player.cooldowns[skill] > 0) {
            gameState.player.cooldowns[skill]--;
        }
    });

    // 玩家移动和体力消耗
    if (gameState.keys.w || gameState.keys.a || gameState.keys.s || gameState.keys.d) {
        gameState.player.stamina = Math.max(0, gameState.player.stamina - 0.1);
    } else {
        gameState.player.stamina = Math.min(100, gameState.player.stamina + 0.05);
    }

    // 根据体力调整速度
    const staminaMultiplier = 0.5 + (gameState.player.stamina / 200);
    const currentSpeed = gameState.player.speed * staminaMultiplier;

    // 计算新的位置
    let newX = gameState.player.x;
    let newY = gameState.player.y;

    if (gameState.keys.w) newY -= currentSpeed;
    if (gameState.keys.s) newY += currentSpeed;
    if (gameState.keys.a) newX -= currentSpeed;
    if (gameState.keys.d) newX += currentSpeed;

    // 边界检查（允许部分移动）
    if (newX >= 0 && newX <= CANVAS_WIDTH - gameState.player.width) {
        gameState.player.x = newX;
    }
    if (newY >= 0 && newY <= CANVAS_HEIGHT - gameState.player.height) {
        gameState.player.y = newY;
    }

    // AI行为
    updateAI();

    // 球的位置更新
    updateBall();

    // 得分检查
    checkScore();
}

function updateAI() {
    const ai = gameState.ai;
    const difficulty = ai.difficulty;
    
    // AI根据难度和当前状态选择行为
    if (gameState.ball.inAir) {
        // 追踪球
        let newX = ai.x + (gameState.ball.x - ai.x) * 0.02 * difficulty;
        let newY = ai.y + (gameState.ball.y - ai.y) * 0.02 * difficulty;
        
        // 边界检查
        if (newX >= 0 && newX <= CANVAS_WIDTH - ai.width) {
            ai.x = newX;
        }
        if (newY >= 0 && newY <= CANVAS_HEIGHT - ai.height) {
            ai.y = newY;
        }
    } else if (gameState.player.hasBall) {
        // 防守玩家
        if (Math.random() < 0.1 * difficulty) {
            // 尝试抢断
            if (Math.abs(ai.x - gameState.player.x) < 50 && 
                Math.abs(ai.y - gameState.player.y) < 50) {
                if (Math.random() < 0.3 * difficulty) {
                    gameState.player.hasBall = false;
                    gameState.ball.inAir = true;
                    gameState.ball.x = ai.x;
                    gameState.ball.y = ai.y;
                    playSound('block');
                }
            }
        }
        // 保持防守距离
        let newX = ai.x + (gameState.player.x - ai.x) * 0.01 * difficulty;
        let newY = ai.y + (gameState.player.y - ai.y) * 0.01 * difficulty;
        
        // 边界检查
        if (newX >= 0 && newX <= CANVAS_WIDTH - ai.width) {
            ai.x = newX;
        }
        if (newY >= 0 && newY <= CANVAS_HEIGHT - ai.height) {
            ai.y = newY;
        }
    } else if (ai.hasBall) {
        // 进攻
        if (Math.random() < 0.05 * difficulty) {
            // 尝试投篮
            ai.hasBall = false;
            gameState.ball.inAir = true;
            gameState.ball.dx = -BALL_SPEED;
            gameState.ball.dy = -SHOOT_POWER;
            playSound('shoot');
        } else {
            // 运球移动
            let newX = ai.x + (CANVAS_WIDTH / 2 - ai.x) * 0.01 * difficulty;
            let newY = ai.y + (CANVAS_HEIGHT / 2 - ai.y) * 0.01 * difficulty;
            
            // 边界检查
            if (newX >= 0 && newX <= CANVAS_WIDTH - ai.width) {
                ai.x = newX;
            }
            if (newY >= 0 && newY <= CANVAS_HEIGHT - ai.height) {
                ai.y = newY;
            }
        }
    }
}

function updateBall() {
    if (gameState.ball.inAir) {
        // 计算新的位置
        let newX = gameState.ball.x + gameState.ball.dx;
        let newY = gameState.ball.y + gameState.ball.dy;
        gameState.ball.dy += GRAVITY;

        // 球碰到地面
        if (newY + gameState.ball.radius > CANVAS_HEIGHT) {
            gameState.ball.y = CANVAS_HEIGHT - gameState.ball.radius;
            gameState.ball.dy = -gameState.ball.dy * 0.5;
            if (Math.abs(gameState.ball.dy) < 1) {
                gameState.ball.inAir = false;
                gameState.ball.dy = 0;
            }
        } else {
            gameState.ball.y = newY;
        }

        // 球碰到墙壁
        if (newX - gameState.ball.radius < 0 || 
            newX + gameState.ball.radius > CANVAS_WIDTH) {
            gameState.ball.dx = -gameState.ball.dx * 0.5;
        } else {
            gameState.ball.x = newX;
        }
    }

    // 球与球员碰撞
    if (!gameState.ball.inAir) {
        if (checkCollision(gameState.player, gameState.ball)) {
            gameState.player.hasBall = true;
            gameState.ball.x = gameState.player.x + gameState.player.width;
            gameState.ball.y = gameState.player.y + gameState.player.height / 2;
            if (gameState.keys.shift) {
                playSound('dribble');
            }
        } else if (checkCollision(gameState.ai, gameState.ball)) {
            gameState.ai.hasBall = true;
            gameState.ball.x = gameState.ai.x;
            gameState.ball.y = gameState.ai.y + gameState.ai.height / 2;
        }
    }
}

function checkScore() {
    if (gameState.ball.x > CANVAS_WIDTH - 50 && 
        gameState.ball.y > CANVAS_HEIGHT / 2 - 50 && 
        gameState.ball.y < CANVAS_HEIGHT / 2 + 50) {
        gameState.player.score++;
        playSound('score');
        resetBall();
    } else if (gameState.ball.x < 50 && 
               gameState.ball.y > CANVAS_HEIGHT / 2 - 50 && 
               gameState.ball.y < CANVAS_HEIGHT / 2 + 50) {
        gameState.ai.score++;
        playSound('score');
        resetBall();
    }

    // 更新记分牌
    scoreBoard.textContent = `玩家: ${gameState.player.score} - AI: ${gameState.ai.score}`;
}

function resetBall() {
    gameState.ball.x = CANVAS_WIDTH / 2;
    gameState.ball.y = CANVAS_HEIGHT / 2;
    gameState.ball.dx = 0;
    gameState.ball.dy = 0;
    gameState.ball.inAir = false;
    gameState.player.hasBall = true;
    gameState.ai.hasBall = false;
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制篮球场
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制中线
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();

    // 绘制篮筐
    ctx.fillStyle = 'orange';
    ctx.fillRect(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2 - 50, 5, 100);
    ctx.fillRect(45, CANVAS_HEIGHT / 2 - 50, 5, 100);

    // 绘制球员
    drawPlayer(gameState.player, 'blue');
    drawPlayer(gameState.ai, 'red');

    // 绘制球
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制体力条
    drawStaminaBar();
}

function drawPlayer(player, color) {
    ctx.fillStyle = color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制球员轮廓
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
}

function drawStaminaBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = CANVAS_WIDTH - barWidth - 10;
    const y = 10;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // 体力值
    const staminaWidth = (gameState.player.stamina / 100) * barWidth;
    ctx.fillStyle = gameState.player.stamina > 50 ? '#4CAF50' : '#FF5722';
    ctx.fillRect(x, y, staminaWidth, barHeight);
    
    // 边框
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
}

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 初始化游戏
initPlayerSelection();
initSounds();
gameLoop(); 