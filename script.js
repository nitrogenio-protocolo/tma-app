// --- 1. TELA DE SPLASH (GARANTE ABERTURA) ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.remove();
            }, 800);
        }, 3000);
    }
});

// --- 2. VARIÁVEIS GLOBAIS ---
let currentBalance = "0.00 BNB";
let userAccount = null;
let provider, signer;

// --- 3. CONEXÃO COM A CARTEIRA ---
const connectBtn = document.getElementById('connect-trigger');

async function syncWallet() {
    if (!window.ethereum) return alert("Por favor, abra o app dentro do navegador da MetaMask!");

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
        
        // Atualiza Saldo na Tela
        const balance = await provider.getBalance(userAccount);
        currentBalance = parseFloat(ethers.formatEther(balance)).toFixed(6) + " BNB";
        
        document.querySelector('.balance-amount').innerText = currentBalance;
        connectBtn.innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(38);
        
    } catch (error) {
        console.error(error);
        alert("Erro ao conectar carteira.");
    }
}

if (connectBtn) {
    connectBtn.addEventListener('click', syncWallet);
}

// --- 4. FUNÇÕES DE NAVEGAÇÃO (BOTÕES) ---

// Abrir tela de Receber
const btnReceber = document.getElementById('btn-receber');
if (btnReceber) {
    btnReceber.addEventListener('click', () => {
        document.getElementById('home-app').style.display = 'none';
        document.getElementById('area-receber').style.display = 'block';
    });
}

// Voltar para Home
function fecharReceber() {
    document.getElementById('area-receber').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// --- 5. MOTOR DE PAGAMENTO (BRL -> BNB) ---

async function getBnbPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=brl');
        const data = await response.json();
        return data.binancecoin.brl;
    } catch (e) {
        return 3000; // Valor aproximado de segurança caso a API falhe
    }
}

const brlInput = document.getElementById('brl-input');
if (brlInput) {
    brlInput.addEventListener('input', async (e) => {
        const valorBrl = e.target.value;
        if (valorBrl > 0) {
            const price = await getBnbPrice();
            const bnbNeeded = (valorBrl / price).toFixed(6);
            document.getElementById('bnb-display').innerText = bnbNeeded + " BNB";
        }
    });
}

// --- 6. TELA DE SUCESSO ---
function showSuccessScreen(valorRecebido) {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-receber').style.display = 'none';
    
    const telaSucesso = document.getElementById('tela-sucesso');
    if (telaSucesso) {
        telaSucesso.style.display = 'flex';
        document.getElementById('valor-confirmado').innerText = `+ ${valorRecebido} BNB`;
    }

    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37a.mp3'); 
    audio.play().catch(e => console.log("Áudio aguardando interação."));
}

// --- 7. GERADOR DE QR CODE E BOTÃO FLUTUANTE ---
let qrcode = null;

function gerarCobranca(valorBNB) {
    const container = document.getElementById('qrcode-container');
    container.innerHTML = ""; 

    if (userAccount && valorBNB > 0) {
        const uri = `ethereum:${userAccount}@56?value=${ethers.parseEther(valorBNB.toString())}`;
        
        qrcode = new QRCode(container, {
            text: uri,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// Atualização do leitor de input para gerar o QR Code
if (brlInput) {
    brlInput.addEventListener('input', async (e) => {
        const valorBrl = e.target.value;
        const bnbDisplay = document.getElementById('bnb-display');
        
        if (valorBrl > 0) {
            const price = await getBnbPrice();
            const bnbNeeded = (valorBrl / price).toFixed(6);
            bnbDisplay.innerText = bnbNeeded;
            gerarCobranca(bnbNeeded); 
        } else {
            bnbDisplay.innerText = "0.000000";
            document.getElementById('qrcode-container').innerHTML = "";
        }
    });
}

// Lógica do Botão Flutuante 'Nitro'
document.addEventListener('DOMContentLoaded', () => {
    const btnFlutuante = document.getElementById('btn-flutuante-nitro');
    if (btnFlutuante) {
        btnFlutuante.addEventListener('click', () => {
            if (document.getElementById('area-receber').style.display === 'none') {
                document.getElementById('btn-receber').click();
            } else {
                alert("Aguardando confirmação do pagamento...");
            }
        });
    }
});
