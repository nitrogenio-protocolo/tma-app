/**
 * NITROGÊNIO PROTOCOLO - v2.1
 * Lógica: Web3 Flow, UI Sheets & Safe Governance
 */

// --- 1. CONFIGURAÇÕES E ESTADO GLOBAL ---
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let provider, signer, userAccount, scannerAtivo = false;
let html5QrCode;

// Elementos de Input
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');
const bnbReceberInput = document.getElementById('bnb-receber');

// --- 2. CONTROLE DE TELA (SPLASH & TERMOS) ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // Sequência de animação Splash
    setTimeout(() => document.getElementById('text-dao')?.classList.add('fade-in'), 500);
    setTimeout(() => {
        document.getElementById('text-dao').style.display = 'none';
        document.getElementById('text-nitrogenio')?.classList.add('fade-in');
    }, 1500);
    setTimeout(() => {
        document.getElementById('text-nitrogenio').style.display = 'none';
        document.getElementById('splash-logo')?.classList.add('fade-in');
    }, 2500);
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 600);
    }, 4000);

    // Auto-reconexão Web3
    if (window.ethereum?.selectedAddress) syncWallet();
});

function validarTermos() {
    const check1 = document.getElementById('check-tecnico').checked;
    const check2 = document.getElementById('check-responsabilidade').checked;
    const btn = document.getElementById('btn-entrar');
    const msg = document.getElementById('msg-convite');
    
    btn.disabled = !(check1 && check2);
    btn.classList.toggle('ativo', !btn.disabled);
    if(msg) msg.innerText = btn.disabled ? "Aceite os termos para prosseguir" : "";
}

function aceitarTermos() {
    document.getElementById('modal-termos').style.transform = 'translateY(-100%)';
    localStorage.setItem('termosAceitos', 'true');
}

// --- 3. CONEXÃO WEB3 & SALDOS ---
async function syncWallet() {
    if (!window.ethereum) return alert("Abra na MetaMask.");
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        signer = await provider.getSigner();
        
        // Atualiza UI
        const btn = document.getElementById('connect-trigger');
        if (btn) btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        
        atualizarSaldos();
    } catch (err) { console.error("Falha na conexão", err); }
}

async function atualizarSaldos() {
    if (!provider || !userAccount) return;
    try {
        // Saldo Usuário
        const bal = await provider.getBalance(userAccount);
        const balDisp = document.querySelector('.balance-amount');
        if (balDisp) balDisp.innerText = `${parseFloat(ethers.formatEther(bal)).toFixed(4)} BNB`;
        
        // Saldo Cofre Safe
        const safeBal = await provider.getBalance(ENDERECO_COFRE_SAFE);
        const safeDisp = document.getElementById('saldo-safe-real');
        if (safeDisp) safeDisp.innerText = `${parseFloat(ethers.formatEther(safeBal)).toFixed(4)} BNB`;
    } catch (err) { console.error("Erro saldo", err); }
}

// --- 4. NAVEGAÇÃO DE SALAS (UI SHEETS) ---
function abrirPainel(id) {
    const p = document.getElementById('painel-' + id);
    if (p) {
        p.classList.add('aberto');
        document.body.style.overflow = 'hidden';
        if (id === 'comunidade') carregarPautasReaisDoCofre();
        if (id === 'cofre') atualizarSaldos();
    }
}

function fecharPainel(id) {
    const p = document.getElementById('painel-' + id);
    if (p) {
        p.classList.remove('aberto');
        document.body.style.overflow = 'auto';
    }
}

function abrirNFT() { document.getElementById('area-nft').classList.add('ativa'); }
function fecharNFT() { document.getElementById('area-nft').classList.remove('ativa'); }

// --- 5. PAGAR & RECEBER ---
function abrirPagar() { document.getElementById('area-pagar').classList.add('ativa'); }
async function fecharPagar() {
    pararScanner();
    if(valorPagarInput) valorPagarInput.value = "";
    if(addrInput) addrInput.value = "";
    document.getElementById('area-pagar').classList.remove('ativa');
}

function abrirReceber() { document.getElementById('area-receber').classList.add('ativa'); }
function fecharReceber() {
    if(bnbReceberInput) bnbReceberInput.value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    document.getElementById('area-receber').classList.remove('ativa');
}

// Validações
const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    const valor = parseFloat(valorPagarInput.value) || 0;
    const isValid = valor > 0 && addrInput.value.length === 42;
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

const validateReceber = () => {
    const btn = document.getElementById('btn-gerar-qr');
    const isValid = (parseFloat(bnbReceberInput.value) || 0) > 0;
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

// --- 6. SCANNER & QR CODE ---
async function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    if (!scannerAtivo) {
        readerDiv.style.display = 'block';
        scannerAtivo = true;
        html5QrCode = new Html5Qrcode("reader");
        try {
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
                addrInput.value = text.replace(/^(ethereum:)/i, "").split("?")[0].trim();
                pararScanner();
                validatePagar();
            });
        } catch (e) { pararScanner(); }
    } else { pararScanner(); }
}

async function pararScanner() {
    if (html5QrCode && scannerAtivo) {
        await html5QrCode.stop();
        document.getElementById('reader').style.display = 'none';
        scannerAtivo = false;
    }
}

function gerarCobranca() {
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbReceberInput.value) return alert("Conecte e insira o valor!");
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbReceberInput.value}`, width: 180, height: 180 });
}

// --- 7. GOVERNANÇA (SAFE API) ---
async function carregarPautasReaisDoCofre() {
    const container = document.getElementById('cronometro-da-dao');
    if (!container) return;
    try {
        const res = await fetch(`https://safe-transaction-bsc.safe.global/api/v1/safes/${ENDERECO_COFRE_SAFE}/multisig-transactions/`);
        const dados = await res.json();
        const pautas = dados.results.filter(tx => !tx.isExecuted);
        
        container.innerHTML = pautas.length ? "" : "<p style='text-align:center;'>Nenhuma pauta pendente.</p>";
        
        pautas.forEach(p => {
            let desc = p.origin ? p.origin.replace(/[\\"{}]/g, "").replace(/^note:\s*/i, "") : "Ação de Governança";
            const card = document.createElement('div');
            card.className = 'card-pauta';
            card.innerHTML = `
                <small>#${p.nonce} - COFRE</small>
                <p><strong>${desc}</strong></p>
                <button class="btn-acao active" onclick="abrirModalVotacao()">VOTAR</button>
            `;
            container.appendChild(card);
        });
    } catch (e) { console.error("Erro API Safe", e); }
}

function abrirModalVotacao() { document.getElementById('modal-votacao').style.bottom = "0"; }
function fecharModalVotacao() { document.getElementById('modal-votacao').style.bottom = "-100%"; }

// --- 8. EXECUÇÃO DE PAGAMENTO ---
async function executarPagamento() {
    if (!signer) return alert("Conecte sua carteira!");
    const btn = document.getElementById('btn-confirmar-pagar');
    try {
        btn.innerText = "ENVIANDO...";
        btn.disabled = true;
        const tx = await signer.sendTransaction({
            to: addrInput.value.trim(),
            value: ethers.parseEther(valorPagarInput.value.replace(',', '.'))
        });
        await tx.wait();
        alert("Sucesso!");
        fecharPagar();
    } catch (e) { alert("Erro: " + (e.reason || "Cancelado")); }
    finally {
        btn.innerText = "CONFIRMAR PAGAMENTO";
        validatePagar();
    }
}

// Event Listeners
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);
document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);
[valorPagarInput, addrInput].forEach(i => i?.addEventListener('input', validatePagar));
bnbReceberInput?.addEventListener('input', validateReceber);

// Motor de Tempo
setInterval(() => {
    const disp = document.getElementById('tempo-restante');
    if (disp) {
        const agora = new Date();
        const fim = new Date().setHours(24,0,0,0);
        const diff = fim - agora;
        const h = Math.floor(diff/3600000).toString().padStart(2,'0');
        const m = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
        disp.innerText = `${h}h ${m}m ${s}s`;
    }
}, 1000);
