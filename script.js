// --- PROJETO NITROGÊNIO: FOCO NA RAPOSA ALPHA ---

window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    
    // 1. Damos 11 segundos para a Raposa Alpha da Splash ser vista
    setTimeout(() => {
        if (splash && home) {
            // Em vez de remover, vamos suavizar a transparência
            splash.style.transition = "opacity 4.5s ease-in-out";
            splash.style.opacity = '0';
            
            // Ligamos a Home por baixo enquanto a Splash ainda some
            home.style.display = 'block';
            home.style.opacity = '0';

            setTimeout(() => {
                splash.remove(); // Agora sim tiramos da memória
                home.style.transition = "opacity 1s ease";
                home.style.opacity = '1'; 
                
                // Ativa o Olho e as funções de carteira
                inicializarSistema();
            }, 2000); 
        }
    }, 11000); 
});

// 2. FUNÇÃO QUE LIGA O OLHO E A CARTEIRA
function inicializarSistema() {
    const eyeBtn = document.getElementById('toggle-visibility');
    const balanceVal = document.querySelector('.balance-amount') || document.querySelector('.balance-valor');
    let currentBalance = "0.00 N"; 

    if (eyeBtn && balanceVal) {
        // Garante que o olho seja azul e clicável
        eyeBtn.style.color = "#007BFF";
        eyeBtn.style.cursor = "pointer";

        eyeBtn.addEventListener('click', () => {
            eyeBtn.classList.toggle('active');
            if (eyeBtn.classList.contains('active')) {
                balanceVal.innerText = currentBalance;
                eyeBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            } else {
                balanceVal.innerText = "****";
                eyeBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            }
        });
    }

    // Lógica do botão de conexão
    const connectBtn = document.querySelector('.btn-connect') || document.querySelector('.btn-conectar');
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    connectBtn.innerText = accounts[0].substring(0, 6) + "...";
                    // Aqui você pode adicionar a lógica de saldo BNB se quiser
                } catch (e) { console.error("Erro na conexão"); }
            }
        });
    }
}
