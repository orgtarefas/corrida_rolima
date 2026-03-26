// ==================== FUNÇÕES UTILITÁRIAS ====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function showJoinModal() {
    const modal = document.getElementById('joinModal');
    if (modal) modal.classList.add('show');
}

function hideJoinModal() {
    const modal = document.getElementById('joinModal');
    if (modal) modal.classList.remove('show');
}

function showConfigModal() {
    let configModal = document.getElementById('roomConfigModal');
    if (!configModal) {
        configModal = document.createElement('div');
        configModal.id = 'roomConfigModal';
        configModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;justify-content:center;align-items:center;z-index:300;';
        configModal.innerHTML = `
            <div style="background:white;padding:35px;border-radius:32px;text-align:center;max-width:450px;width:90%;">
                <h3 style="color:#ff6b35;margin-bottom:10px;">🎮 CONFIGURAR CORRIDA</h3>
                <p style="color:#666;margin-bottom:20px;">Escolha a distância e número de jogadores</p>
                
                <div style="margin-bottom:25px;">
                    <label style="display:block;margin-bottom:10px;font-weight:bold;">📏 DISTÂNCIA (metros)</label>
                    <div style="display:flex;justify-content:center;align-items:center;gap:20px;">
                        <button id="distMinus" style="width:45px;height:45px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:24px;">-</button>
                        <span id="distanceValue" style="font-size:28px;font-weight:bold;min-width:100px;">1000</span>
                        <button id="distPlus" style="width:45px;height:45px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:24px;">+</button>
                    </div>
                    <p style="font-size:12px;color:#999;margin-top:8px;">Mínimo: 500m | Máximo: 5000m</p>
                </div>
                
                <div style="margin-bottom:25px;">
                    <label style="display:block;margin-bottom:10px;font-weight:bold;">👥 NÚMERO DE JOGADORES</label>
                    <div style="display:flex;justify-content:center;align-items:center;gap:20px;">
                        <button id="playersMinus" style="width:45px;height:45px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:24px;">-</button>
                        <span id="playersCount" style="font-size:28px;font-weight:bold;min-width:60px;">2</span>
                        <button id="playersPlus" style="width:45px;height:45px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:24px;">+</button>
                    </div>
                    <p style="font-size:12px;color:#999;margin-top:8px;">Mínimo: 2 | Máximo: 6</p>
                </div>
                
                <div style="display:flex;gap:15px;margin-top:20px;">
                    <button id="confirmConfigBtn" style="flex:1;background:#ff6b35;color:white;padding:14px;border-radius:16px;border:none;font-weight:bold;cursor:pointer;">CRIAR CORRIDA</button>
                    <button id="cancelConfigBtn" style="flex:1;background:#dc3545;color:white;padding:14px;border-radius:16px;border:none;font-weight:bold;cursor:pointer;">CANCELAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(configModal);
        
        let selectedDistance = 1000;
        let selectedMaxPlayers = 2;
        
        document.getElementById('distMinus')?.addEventListener('click', () => {
            if (selectedDistance > 500) {
                selectedDistance -= 100;
                document.getElementById('distanceValue').textContent = selectedDistance;
            }
        });
        document.getElementById('distPlus')?.addEventListener('click', () => {
            if (selectedDistance < 5000) {
                selectedDistance += 100;
                document.getElementById('distanceValue').textContent = selectedDistance;
            }
        });
        document.getElementById('playersMinus')?.addEventListener('click', () => {
            if (selectedMaxPlayers > 2) {
                selectedMaxPlayers--;
                document.getElementById('playersCount').textContent = selectedMaxPlayers;
            }
        });
        document.getElementById('playersPlus')?.addEventListener('click', () => {
            if (selectedMaxPlayers < 6) {
                selectedMaxPlayers++;
                document.getElementById('playersCount').textContent = selectedMaxPlayers;
            }
        });
        document.getElementById('confirmConfigBtn')?.addEventListener('click', () => {
            configModal.style.display = 'none';
            if (typeof createRoomWithConfig === 'function') {
                createRoomWithConfig(selectedMaxPlayers, selectedDistance);
            }
        });
        document.getElementById('cancelConfigBtn')?.addEventListener('click', () => {
            configModal.style.display = 'none';
        });
    }
    configModal.style.display = 'flex';
}

function generateRoomCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    return code;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Constantes
const ROAD_LEFT = 45;
const ROAD_RIGHT = 755;
const TOP_Y = 60;
const BOTTOM_Y = 550;
