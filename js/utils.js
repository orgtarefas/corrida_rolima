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
    // Criar modal de configuração dinamicamente
    let configModal = document.getElementById('roomConfigModal');
    if (!configModal) {
        configModal = document.createElement('div');
        configModal.id = 'roomConfigModal';
        configModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:300;';
        configModal.innerHTML = `
            <div style="background:white;padding:30px;border-radius:32px;text-align:center;max-width:400px;">
                <h3 style="color:#ff6b35;">🎮 CONFIGURAR SALA</h3>
                <p>Número de jogadores:</p>
                <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:20px 0;">
                    <button id="playersMinus" style="width:40px;height:40px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:20px;">-</button>
                    <span id="playersCount" style="font-size:24px;font-weight:bold;">2</span>
                    <button id="playersPlus" style="width:40px;height:40px;border-radius:50%;background:#ff6b35;color:white;border:none;font-size:20px;">+</button>
                </div>
                <p style="font-size:12px;color:#666;">Mínimo: 2 | Máximo: 6</p>
                <div style="display:flex;gap:15px;margin-top:20px;">
                    <button id="confirmConfigBtn" style="flex:1;background:#ff6b35;color:white;padding:12px;border-radius:12px;">CRIAR SALA</button>
                    <button id="cancelConfigBtn" style="flex:1;background:#dc3545;color:white;padding:12px;border-radius:12px;">CANCELAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(configModal);
        
        let selectedMaxPlayers = 2;
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
            if (typeof createRoomWithConfig === 'function') createRoomWithConfig(selectedMaxPlayers);
        });
        document.getElementById('cancelConfigBtn')?.addEventListener('click', () => {
            configModal.style.display = 'none';
        });
    }
    configModal.style.display = 'flex';
}

function hideConfigModal() {
    const modal = document.getElementById('roomConfigModal');
    if (modal) modal.style.display = 'none';
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