// --- PROJETO NITROGÊNIO: LÓGICA DE ELITE AJUSTADA ---

// 1. CONTROLE DA SPLASH SCREEN (ABERTURA CINEMATOGRÁFICA)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    
    // 11 segundos para o usuário absorver a Raposa Alpha grande
    setTimeout(() => {
        if (splash) {
            // Inicia o desaparecimento suave
            splash.classList.add('fade-out');
            
            setTimeout(() => {
                splash.remove(); // Tira da memória para o app ficar leve
                if (home) {
                    home.style.display = 'block';
                    
                    // Entrada da Home com efeito de "subida" suave
                    setTimeout(() => { 
                        home.style.opacity = '1'; 
                        // SÓ LIGA O RESTANTE DO MOTOR COM A HOME ABERTA
                        inicializarComponentes();
                    }, 100);
                }
            }, 1500); 
        }
    }, 11000); 
});

// 2. INICIALIZAÇÃO DOS COMPONENTES (OLHO E CARTEIRA)
function inicializarComponentes() {
    const eyeBtn = document.getElementById('toggle-visibility');
    // Ajuste aqui para garantir que seleciona o saldo correto no seu HTML
    const balanceVal = document.querySelector('.balance-amount') || document.querySelector('.balance-valor');
    let currentBalance = "0.00 N"; 

    if (eyeBtn && balanceVal) {
        // Garante que o olho seja visível (Azul Blueberry)
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

    // 3. CONEXÃO COM A CARTEIRA (SMART CHAIN)
    const connectBtn = document.querySelector('.btn-connect') || document.querySelector('.btn-conectar');

    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const account = accounts[0];
                    
                    // Troca para a rede BSC (0x38)
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x38' }], 
                        });
                    } catch (switchError) {
                        console.log("Rede pronta ou erro na troca.");
                    }

                    connectBtn.innerText = "LENDO...";
                    
                    // Renderização do saldo via Web3/Ethers
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const balance = await provider.getBalance(account);
                    const ethBalance = ethers.formatEther(balance);
                    
                    currentBalance = parseFloat(ethBalance).toFixed(4) + " BNB";
                    
                    if (eyeBtn && eyeBtn.classList.contains('active')) {
                        balanceVal.innerText = currentBalance;
                    } else {
                        balanceVal.innerText = "****";
                    }

                    connectBtn.innerText = account.substring(0, 6) + "..." + account.substring(38);
                    
                } catch (error) {
                    console.error(error);
                    connectBtn.innerText = "CONECTAR";
                }
            } else {
                alert("Abra pelo navegador da sua carteira (MetaMask/Safe).");
            }
        });
    }
}
