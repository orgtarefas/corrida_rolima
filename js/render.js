let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 600;
    }
}

function drawGame() {
    if (!ctx) return;
    
    // Fundo
    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.4, '#2c5a2c');
    grad.addColorStop(1, '#1e3a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);
    
    // Pista
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_RIGHT - ROAD_LEFT, 600);
    ctx.fillStyle = '#8B5A2B';
    ctx.fillRect(ROAD_LEFT - 8, 0, 8, 600);
    ctx.fillRect(ROAD_RIGHT, 0, 8, 600);
    
    // Linhas da pista
    const lineSpeed = calcularVelocidadeLinha(playerCar.velocidade);
    const lineOffset = (Date.now() * lineSpeed * 0.015) % 80;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.setLineDash([30, 50]);
    ctx.beginPath();
    ctx.moveTo((ROAD_LEFT + ROAD_RIGHT) / 2, 600 - lineOffset);
    ctx.lineTo((ROAD_LEFT + ROAD_RIGHT) / 2, -80 + lineOffset);
    ctx.stroke();
    
    ctx.strokeStyle = '#FFF9C4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ROAD_LEFT + 70, 600 - lineOffset);
    ctx.lineTo(ROAD_LEFT + 70, -80 + lineOffset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ROAD_RIGHT - 70, 600 - lineOffset);
    ctx.lineTo(ROAD_RIGHT - 70, -80 + lineOffset);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Obstáculos
    for (let obs of obstacles) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.width, obs.height);
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#000';
        ctx.font = `${obs.height - 8}px Arial`;
        ctx.fillText(obs.icon, obs.x + 5, obs.y + obs.height - 8);
    }
    
    // Outros jogadores
    drawOtherPlayers();
    
    // Carrinho do jogador
    drawPlayerCar();
    
    // UI
    drawUI();
    
    if (gameOver) drawGameOver();
}

function drawOtherPlayers() {
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (other.active && other.y !== undefined) {
            const otherY = other.y;
            const isVisible = otherY >= TOP_Y - 50 && otherY <= BOTTOM_Y + 50;
            
            if (isVisible) {
                ctx.save();
                const otherColor = `hsl(${Math.abs(hashCode(name) % 360)}, 70%, 55%)`;
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(other.x + 3, otherY + 3, playerCar.width, playerCar.height);
                ctx.fillStyle = otherColor;
                ctx.fillRect(other.x, otherY, playerCar.width, playerCar.height);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(other.x + 5, otherY - 8, 22, 10);
                ctx.fillStyle = '#222';
                ctx.fillRect(other.x - 5, otherY + 8, 7, 18);
                ctx.fillRect(other.x + playerCar.width - 2, otherY + 8, 7, 18);
                ctx.fillRect(other.x - 5, otherY + playerCar.height - 26, 7, 18);
                ctx.fillRect(other.x + playerCar.width - 2, otherY + playerCar.height - 26, 7, 18);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(name, other.x + 5, otherY - 12);
                
                if (otherY < playerCar.y) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillText('⬆️ NA FRENTE', other.x + 5, otherY - 24);
                } else if (otherY > playerCar.y) {
                    ctx.fillStyle = '#FF9800';
                    ctx.fillText('⬇️ ATRÁS', other.x + 5, otherY - 24);
                }
                ctx.restore();
            } else {
                drawArrowIndicator(name, other);
            }
        }
    }
}

function drawArrowIndicator(name, other) {
    let arrowX = Math.max(ROAD_LEFT + 20, Math.min(ROAD_RIGHT - 20, other.x));
    let arrowY, arrowDirection;
    
    if (other.y < TOP_Y) {
        arrowY = TOP_Y + 30;
        arrowDirection = '⬆️';
        ctx.fillStyle = '#4CAF50';
    } else {
        arrowY = BOTTOM_Y - 30;
        arrowDirection = '⬇️';
        ctx.fillStyle = '#FF9800';
    }
    
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(arrowX, arrowY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(arrowDirection, arrowX - 14, arrowY + 10);
    ctx.font = 'bold 10px monospace';
    ctx.fillText(name, arrowX - 18, arrowY - 8);
    ctx.restore();
}

function drawPlayerCar() {
    ctx.save();
    if (invincible && Math.floor(Date.now() / 80) % 2 === 0) ctx.globalAlpha = 0.6;
    
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(playerCar.x + 3, playerCar.y + 3, playerCar.width, playerCar.height);
    
    const upgradeSpeed = currentPlayer?.upgrades?.speed || 0;
    ctx.fillStyle = `hsl(${25 + upgradeSpeed * 3}, 75%, 55%)`;
    ctx.fillRect(playerCar.x, playerCar.y, playerCar.width, playerCar.height);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(playerCar.x + 5, playerCar.y - 8, 22, 10);
    ctx.fillStyle = '#222';
    ctx.fillRect(playerCar.x - 5, playerCar.y + 8, 7, 18);
    ctx.fillRect(playerCar.x + playerCar.width - 2, playerCar.y + 8, 7, 18);
    ctx.fillRect(playerCar.x - 5, playerCar.y + playerCar.height - 26, 7, 18);
    ctx.fillRect(playerCar.x + playerCar.width - 2, playerCar.y + playerCar.height - 26, 7, 18);
    
    if (playerCar.isBraking) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.fillRect(playerCar.x - 5, playerCar.y - 5, playerCar.width + 10, 5);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('🛑 FREANDO', playerCar.x - 10, playerCar.y - 12);
    }
    ctx.restore();
}

function drawUI() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(8, 8, 280, 130);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`🏁 ${Math.floor(playerCar.distancia)}m`, 18, 38);
    ctx.fillText(`⚡ ${Math.floor(playerCar.velocidade)} km/h`, 18, 68);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(18, 82, 240, 14);
    const maxDurability = 100 + (currentPlayer?.upgrades?.durability || 0) * 15;
    const durabilityPercent = playerCar.durability / maxDurability;
    ctx.fillStyle = durabilityPercent > 0.6 ? '#4CAF50' : (durabilityPercent > 0.3 ? '#FF9800' : '#F44336');
    ctx.fillRect(18, 82, 240 * durabilityPercent, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`💪 ${Math.max(0, Math.floor(playerCar.durability))}%`, 18, 96);
    
    let position = 1;
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (other.y > playerCar.y) position++;
    }
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🏆 POSIÇÃO: ${position}º`, 18, 118);
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(8, 560, 340, 32);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText('← A / → D = Desviar | ↓ S = Frear (sobe na ladeira)', 18, 582);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#F44336';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('💥 CARRINHO QUEBROU!', 210, 280);
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`${Math.floor(playerCar.distancia)} metros`, 320, 350);
}