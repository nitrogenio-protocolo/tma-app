// --- PROJETO NITROGÊNIO: LÓGICA DE ELITE ---

// 1. CONTROLE DA SPLASH SCREEN (ABERTURA CINEMATOGRÁFICA)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const home = document.getElementById('home-app');
    
    // O tempo total foi para 11 segundos para o usuário absorver a Raposa Alpha grande
    setTimeout(() => {
        if (splash) {
            // Inicia o desaparecimento suave (configurado para 1.5s no CSS)
            splash.classList.add('fade-out');
            
            setTimeout(() => {
                splash.remove(); // Tira da memória para o app ficar leve
                home.style.display = 'block';
                
                // Entrada da Home com efeito de "subida" suave
                setTimeout(() => { 
                    home.style.opacity = '1'; 
                }, 100);
            }, 1500); 
        }
    }, 11000); 
});

// 2. LÓGICA DO OLHO (PRIVACIDADE DO SALDO)
// Certifique-se de que o botão no HTML tenha o id="toggle-visibility"
const eyeBtn = document.getElementById('toggle-visibility');
const balanceVal = document.querySelector('.balance-amount');
let currentBalance = "0.00 N"; 

if (eyeBtn) {
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

// 3. CONEXÃO COM A CARTEIRA (FOCO EM REDE BNB / SMART CHAIN)
const connectBtn = document.querySelector('.btn-connect'); // Seleciona pela classe do seu HTML

if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        if (window.ethereum) {
            try {
                // Solicita conexão com a MetaMask/Safe
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                // Força a mudança para a rede Binance Smart Chain (0x38)
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x38' }], 
                    });
                } catch (switchError) {
                    console.log("Rede já configurada ou usuário recusou a troca.");
                }

                connectBtn.innerText = "LENDO SALDO...";
                
                // Usando ethers.js (certifique-se de que a biblioteca está carregada se for usar esse método)
                const provider = new ethers.BrowserProvider(window.ethereum);
                const balance = await provider.getBalance(account);
                const ethBalance = ethers.formatEther(balance);
                
                // Atualiza o saldo real da carteira
                currentBalance = parseFloat(ethBalance).toFixed(4) + " BNB";
                
                // Se o "olho" estiver aberto, mostra o valor; se não, mostra asteriscos
                if (eyeBtn && eyeBtn.classList.contains('active')) {
                    balanceVal.innerText = currentBalance;
                } else {
                    balanceVal.innerText = "****";
                }

                // Exibe o endereço resumido no botão
                connectBtn.innerText = account.substring(0, 6) + "..." + account.substring(38);
                
            } catch (error) {
                console.error(error);
                alert("Erro ao conectar na carteira. Verifique se está na MetaMask.");
                connectBtn.innerText = "CONECTAR";
            }
        } else {
            alert("Por favor, abra o app através da sua carteira Web3 (MetaMask/Safe).");
        }
    });
}
