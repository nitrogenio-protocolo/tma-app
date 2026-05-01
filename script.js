/**
 * NITROGÊNIO PROTOCOLO - v3.0 stable
 * Motor Reforçado: Segurança de Ouro e Lógica Multi-Rede
 */

const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
const SENHA_MESTRA = "2026"; 
let provider, signer, userAccount, scannerAtivo = false;
let senhaDigitada = "", salaDestino = "";

// 1. SPLASH CONTROL
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    const delay = 600; 
    setTimeout(() => { document.getElementById('text-dao')?.classList.add('fade-in'); }, delay);
    setTimeout(() => { 
        document.getElementById('text-dao').style.display = 'none'; 
        document.getElementById('text-nitrogenio')?.classList.add('fade-in'); 
    }, delay * 2);
    setTimeout(() => { 
        document.getElementById('text-nitrogenio').style.display = 'none'; 
        document.getElementById('splash-logo')?.classList.add('fade-in'); 
    }, delay * 3);
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => { splash.remove(); }, 600);
    }, delay * 5);
});

// 2. CONEXÃO WEB3 REFORÇADA
async function syncWallet() {
    if (!window.ethereum) return alert("Abra o app dentro da MetaMask Browser.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        
        // Garante que está na rede BNB Chain (Jundiaí não aceita rede lenta!)
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }], 
        }).catch(async (err) => {
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
        });

        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
        atualizarSaldoRealCofre();
    } catch (err) { console.error("Falha na ignição:", err); }
}

function updateUI() {
    const btn = document.getElementById('connect-trigger');
    const balanceDisplay = document.querySelector('.balance-amount');
    if (userAccount && btn) {
        btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        provider.getBalance(userAccount).then(bal => {
            const formatBal = parseFloat(ethers.formatEther(bal)).toFixed(4);
            if (balanceDisplay) balanceDisplay.innerText = `${formatBal} BNB`;
        });
    }
}
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// 3. SEGURANÇA: TECLADO DE OURO
function abrirPainel(id) {
    salaDestino = id;
    document.getElementById('modal-acesso').style.display = 'flex';
    senhaDigitada = "";
    atualizarDots();
}

function digitar(num) {
    if (senhaDigitada.length < 4) {
        senhaDigitada += num;
        atualizarDots();
        if (senhaDigitada.length === 4) validarSenha();
    }
}

function validarSenha() {
    const status = document.getElementById('status-acesso');
    if (senhaDigitada === SENHA_MESTRA) {
        status.innerText = "✅ IDENTIDADE CONFIRMADA";
        status.style.color = "#D4AF37"; 
        setTimeout(() => {
            document.getElementById('modal-acesso').style.display = 'none';
            concederAcesso(salaDestino);
        }, 600);
    } else {
        status.innerText = "❌ CHAVE INVÁLIDA";
        status.style.color = "#FF3B30";
        senhaDigitada = "";
        setTimeout(() => { atualizarDots(); status.innerText = "VALIDANDO NFT ALPHA..."; status.style.color = "#8e8e93"; }, 1000);
    }
}

function atualizarDots() {
    const spans = document.querySelectorAll('#display-senha span');
    spans.forEach((span, i) => { span.className = i < senhaDigitada.length ? 'preenchido' : ''; });
}

function concederAcesso(id) {
    const painel = document.getElementById('painel-' + id);
    if (painel) {
        painel.classList.add('aberto');
        document.body.style.overflow = 'hidden';
        if (id === 'comunidade') carregarPautasReaisDoCofre();
        if (id === 'cofre') atualizarSaldoRealCofre();
    }
}

function fecharPainel(id) {
    document.getElementById('painel-' + id)?.classList.remove('aberto');
    document.body.style.overflow = 'auto';
}

function cancelarAcesso() { document.getElementById('modal-acesso').style.display = 'none'; }
function apagarDigitado() { if (senhaDigitada.length > 0) { senhaDigitada = senhaDigitada.slice(0, -1); atualizarDots(); } }

// 4. LÓGICA DE PAGAMENTO E QR
function abrirPagar() { document.getElementById('area-pagar').style.display = 'block'; }
function abrirReceber() { document.getElementById('area-receber').style.display = 'block'; }
function fecharPagar() { pararScanner(); document.getElementById('area-pagar').style.display = 'none'; }
function fecharReceber() { document.getElementById('area-receber').style.display = 'none'; }

function gerarCobranca() {
    const bnbValor = document.getElementById('bnb-receber').value;
    const container = document.getElementById('qrcode-container');
    if (!userAccount) return alert("Conecte a carteira!");
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbValor}`, width: 180, height: 180 });
}

// 5. NAVEGAÇÃO E TERMOS
function validarTermos() {
    const c1 = document.getElementById('check-tecnico').checked;
    const c2 = document.getElementById('check-responsabilidade').checked;
    const btn = document.getElementById('btn-entrar');
    btn.disabled = !(c1 && c2);
    btn.classList.toggle('ativo', (c1 && c2));
}

function aceitarTermos() {
    document.getElementById('modal-termos').style.transform = 'translateY(-100%)';
    localStorage.setItem('termosAceitos', 'true');
}

// Inicialização
window.addEventListener('load', () => {
    if(localStorage.getItem('termosAceitos') === 'true') document.getElementById('modal-termos').style.display = 'none';
    if (window.ethereum?.selectedAddress) syncWallet();
});
