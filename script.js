// --- 1. VARIÁVEIS GLOBAIS ---
let currentBalance = "0.00 BNB";
let userAccount = null;
let provider, signer;

// --- 2. LÓGICA DE PRIVACIDADE (OLHO) ---
const eyeBtn = document.getElementById('toggle-visibility');
const balanceVal = document.querySelector('.balance-amount');

eyeBtn.addEventListener('click', () => {
    eyeBtn.classList.toggle('active');
    const isActive = eyeBtn.classList.contains('active');
    balanceVal.innerText = isActive ? currentBalance : "****";
    eyeBtn.innerHTML = isActive ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
});

// --- 3. CONEXÃO E REDE (ESTRATÉGIA REAL) ---
const connectBtn = document.getElementById('connect-trigger');

async function syncWallet() {
    if (!window.ethereum) return alert("Abra na MetaMask!");

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];

        // Força a rede BNB (0x38)
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (err) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x38',
                        chainName: 'BNB Smart Chain',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                    }]
                });
            }
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Atualiza Saldo
        const balance = await provider.getBalance(userAccount);
        currentBalance = parseFloat(ethers.formatEther(balance)).toFixed(6) + " BNB";
        
        // UI Update
        if (eyeBtn.classList.contains('active')) balanceVal.innerText = currentBalance;
        connectBtn.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(38);
        
    } catch (error) {
        console.error(error);
        alert("Erro na conexão real.");
    }
}

connectBtn.addEventListener('click', syncWallet);

// --- 4. MOTOR DE RECEBIMENTO (CONVERSÃO BRL -> BNB) ---
async function getBnbPrice() {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=brl');
    const data = await response.json();
    return data.binancecoin.brl;
}

// Quando digitar no campo de Reais (id: brl-input)
async function handleBrlInput(val) {
    const price = await getBnbPrice();
    const bnbNeeded = (val / price).toFixed(6);
    document.getElementById('bnb-display').innerText = bnbNeeded + " BNB";
    return bnbNeeded;
}

// --- 5. MONITOR DE SUCESSO (WATCHER) ---
function startPaymentWatcher(expectedValue) {
    let initialBalance;
    
    provider.on("block", async () => {
        const current = await provider.getBalance(userAccount);
        if (!initialBalance) {
            initialBalance = current;
            return;
        }

        if (current > initialBalance) {
            const diff = ethers.formatEther(current - initialBalance);
            if (parseFloat(diff) >= parseFloat(expectedValue)) {
                showSuccessScreen(); // Crie esta função para mostrar o Check Verde
                provider.removeAllListeners("block");
            }
        }
    });
}

// --- 6. SPLASH SCREEN ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 800);
        }, 3000); // Reduzi para 3s para o teste real não ser cansativo
    }
});
// --- 7. FINALIZAÇÃO (TELA DE SUCESSO) ---
function showSuccessScreen(valorRecebido) {
    // 1. Esconde a área do QR Code ou formulário
    // Certifique-se que o ID 'home-app' ou o ID da sua área de cobrança exista
    const areaPrincipal = document.getElementById('home-app'); 
    if (areaPrincipal) areaPrincipal.style.display = 'none';

    // 2. Mostra a tela de sucesso (aquela que definimos no CSS)
    const telaSucesso = document.getElementById('tela-sucesso');
    if (telaSucesso) {
        telaSucesso.style.display = 'flex'; // Usamos flex para centralizar os itens
    }

    // 3. Atualiza o texto com o valor real que caiu
    const txtValor = document.getElementById('valor-confirmado');
    if (txtValor) {
        txtValor.innerText = `+ ${valorRecebido} BNB`;
    }

    // 4. Feedback Sonoro Real
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37a.mp3'); 
    audio.play().catch(e => console.log("Áudio aguardando interação do usuário."));
}
