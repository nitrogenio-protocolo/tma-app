// --- MOTOR DO PROJETO NITROGÊNIO ---

window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    
    // 1. TEMPO DE EXIBIÇÃO DA SPLASH
    // Texto (4.5s) + Raposa brilhando (3.5s) = 8 segundos total
    setTimeout(() => {
        if (splash && home) {
            // Inicia o sumiço da tela azul
            splash.style.transition = "opacity 1.5s ease-in-out";
            splash.style.opacity = '0';
            
            // Prepara a Home por baixo
            home.style.display = 'block';
            home.style.opacity = '0';

            setTimeout(() => {
                splash.remove(); // Tira a splash da memória
                home.style.transition = "opacity 1s ease";
                home.style.opacity = '1'; 
                
                // Liga as funções do olho e da carteira
                inicializarSistema();
            }, 1500); // Tempo da transição final
        }
    }, 8000); 
});

// 2. FUNÇÃO DE CONTROLE (OLHO E CARTEIRA)
function inicializarSistema() {
    const eyeBtn = document.getElementById('toggle-visibility');
    const balanceVal = document.getElementById('balance-val');
    let currentBalance = "0.00 N"; 
    let oculto = false;

    if (eyeBtn && balanceVal) {
        eyeBtn.addEventListener('click', () => {
            oculto = !oculto;
            if (oculto) {
                balanceVal.innerText = "****";
                eyeBtn.classList.replace('fa-eye', 'fa-eye-slash');
                eyeBtn.style.color = "#86868b"; // Cor neutra (escondido)
            } else {
                balanceVal.innerText = currentBalance;
                eyeBtn.classList.replace('fa-eye-slash', 'fa-eye');
                eyeBtn.style.color = "#007AFF"; // Cor Nitrogen (visível)
            }
        });
    }

    // Lógica simples de conexão (Web3)
    const connectBtn = document.querySelector('.btn-connect');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    connectBtn.innerText = accounts[0].substring(0, 6) + "...";
                } catch (e) { 
                    console.error("Conexão recusada"); 
                }
            } else {
                alert("Por favor, use uma carteira Web3.");
            }
        });
    }
}
