/**
 * NITROGÊNIO PROTOCOLO - v2.2 Stable
 * Core Engine: Web3, UI Navigation & Governance
 */

// --- 1. CONFIGURAÇÕES GLOBAIS ---
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";
let provider, signer, userAccount, html5QrCode, scannerAtivo = false;

// --- 2. CONTROLE DE SPLASH & STARTUP ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    
    const delay = 800;
    const fade = (id, time) => setTimeout(() => document.getElementById(id)?.classList.add('fade-in'), time);
    const hide = (id, time) => setTimeout(() => { const el = document.getElementById(id); if(el) el.style.display = 'none'; }, time);

    fade('text-dao', delay);
    hide('text-dao', delay * 2);
    fade('text-nitrogenio', delay * 2);
    hide('text-nitrogenio', delay * 3);
    fade('splash-logo', delay * 3);

    setTimeout(() => {
        splash.style.transition = 'opacity 0.6s ease';
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 600);
    }, delay * 5);

    // Auto-reconexão e Início do Relógio
    if (window.ethereum?.selectedAddress) syncWallet();
    motorGovernançaNitrogenio();
});

// --- 3. CONECTIVIDADE WEB3 (METAMASK/CORE) ---
async function syncWallet() {
    if (!window.ethereum) return alert("Abra o app dentro da MetaMask Browser.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
        atualizarSaldoRealCofre();
    } catch (err) {
        console.error("Conexão falhou:", err);
    }
}

async function atualizarSaldoRealCofre() {
    if (!provider) return;
    try {
        const saldoCofre = await provider.getBalance(ENDERECO_COFRE_SAFE);
        const formatado = parseFloat(ethers.formatEther(saldoCofre)).toFixed(4);
        const display = document.getElementById('saldo-safe-real');
        if (display) display.innerText = `${formatado} BNB`;
    } catch (err) { console.error("Erro Safe:", err); }
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

// --- 4. NAVEGAÇÃO DE INTERFACES (VIEWS & PAINÉIS) ---
function abrirView(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function fecharView(viewId) {
    if (scannerAtivo) pararScanner();
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function abrirPagar() { abrirView('area-pagar'); }
function abrirReceber() { abrirView('area-receber'); }
function abrirNFT() { abrirView('area-nft'); }
function fecharNFT() { fecharView('area-nft'); }

function abrirPainel(id) {
    const painel = document.getElementById('painel-' + id);
    if (painel) {
        painel.classList.add('aberto');
        document.body.style.overflow = 'hidden';
        if (id === 'governo' || id === 'mural') carregarPautasReaisDoCofre();
        if (id === 'comunidade') carregarVotacaoComunidade();
        if (id === 'cofre') atualizarSaldoRealCofre();
    }
}

function fecharPainel(id) {
    const painel = document.getElementById('painel-' + id);
    if (painel) {
        painel.classList.remove('aberto');
        document.body.style.overflow = 'auto';
    }
}

// --- 5. LÓGICA DE TRANSAÇÕES & QR CODE ---
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');
const bnbReceberInput = document.getElementById('bnb-receber');

const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    const valor = parseFloat(valorPagarInput.value.replace(',', '.') || 0);
    const endereco = addrInput.value.trim();
    const isValid = valor > 0 && endereco.startsWith('0x') && endereco.length === 42;
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

const validateReceber = () => {
    const btnGerar = document.getElementById('btn-gerar-qr');
    const valor = parseFloat(bnbReceberInput?.value.replace(',', '.') || 0);
    const isValid = valor > 0;
    if (btnGerar) {
        btnGerar.disabled = !isValid;
        btnGerar.classList.toggle('active', isValid);
    }
};

function gerarCobranca() {
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbReceberInput.value) return alert("Conecte a carteira e insira o valor!");
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbReceberInput.value}`, width: 180, height: 180 });
}

async function executarPagamento() {
    if (!signer) return syncWallet();
    const valor = valorPagarInput.value.replace(',', '.');
    const destino = addrInput.value.trim();
    const btn = document.getElementById('btn-confirmar-pagar');

    try {
        btn.innerText = "PROCESSANDO..."; btn.disabled = true;
        const tx = await signer.sendTransaction({ to: destino, value: ethers.parseEther(valor) });
        await tx.wait();
        alert("Sucesso!");
        fecharPagar();
    } catch (err) {
        alert("Erro: " + (err.reason || "Cancelado"));
    } finally {
        btn.innerText = "CONFIRMAR PAGAMENTO";
        btn.disabled = false;
    }
}

// --- 6. SCANNER QR (CAMERA) ---
async function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    if (!scannerAtivo) {
        readerDiv.style.display = 'block';
        scannerAtivo = true;
        html5QrCode = new Html5Qrcode("reader");
        try {
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (text) => {
                addrInput.value = text.replace(/^(ethereum:)/i, "").split("?")[0].trim();
                pararScanner(); validatePagar();
            });
        } catch (err) { pararScanner(); }
    } else { pararScanner(); }
}

async function pararScanner() {
    if (html5QrCode && scannerAtivo) {
        try { await html5QrCode.stop(); } finally { 
            document.getElementById('reader').style.display = 'none'; 
            scannerAtivo = false; 
        }
    }
}

// --- 7. GOVERNANÇA & SAFE API ---
async function carregarPautasReaisDoCofre() {
    const urlAPI = `https://safe-transaction-bsc.safe.global/api/v1/safes/${ENDERECO_COFRE_SAFE}/multisig-transactions/`;
    try {
        const resposta = await fetch(urlAPI);
        const dados = await resposta.json();
        const pendentes = dados.results.filter(tx => !tx.isExecuted);
        const executadas = dados.results.filter(tx => tx.isExecuted);

        // Render Governo
        const govContainer = document.getElementById('lista-pautas-governo');
        if (govContainer) {
            govContainer.innerHTML = pendentes.length ? "" : "<p>Sem pautas pendentes.</p>";
            pendentes.forEach(tx => {
                const confs = tx.confirmations ? tx.confirmations.length : 0;
                const card = document.createElement('div');
                card.className = 'card-pauta';
                card.innerHTML = `
                    <small>NONCE #${tx.nonce} | ${confs}/11</small>
                    <p><b>${tx.description || "Transação Safe"}</b></p>
                    <button class="btn-pilula btn-acao active" onclick="assinarNoSafe('${tx.safeTxHash}')" style="width:100%; margin-top:10px;">
                        ${confs >= 10 ? 'EXECUTAR' : 'ASSINAR'}
                    </button>`;
                govContainer.appendChild(card);
            });
        }

        // Render Mural (Últimas 3)
        const muralContainer = document.getElementById('lista-mural-automatica');
        if (muralContainer) {
            muralContainer.innerHTML = "";
            executadas.slice(0, 3).forEach(tx => {
                const card = document.createElement('div');
                card.className = 'card-pauta';
                card.style.borderLeft = "4px solid #28a745";
                card.innerHTML = `<small>EXECUTADO ✅</small><p>${tx.description || "Ação Concluída"}</p>`;
                muralContainer.appendChild(card);
            });
        }
    } catch (e) { console.error("Erro API Safe", e); }
}

async function assinarNoSafe(hash) {
    if (!signer) return syncWallet();
    try {
        const assinatura = await signer.signMessage(ethers.getBytes(hash));
        if (assinatura) { alert("Assinado!"); carregarPautasReaisDoCofre(); }
    } catch (e) { alert("Erro na assinatura."); }
}

// --- 8. UTILITÁRIOS & EVENTOS ---
function motorGovernançaNitrogenio() {
    setInterval(() => {
        const display = document.getElementById('tempo-restante');
        if (!display) return;
        const agora = new Date();
        const final = new Date().setHours(24,0,0,0);
        const diff = final - agora;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        display.innerText = `${h}h ${m}m ${s}s`;
    }, 1000);
}

function validarTermos() {
    const ok = document.getElementById('check-tecnico').checked && document.getElementById('check-responsabilidade').checked;
    const btn = document.getElementById('btn-entrar');
    btn.disabled = !ok; btn.classList.toggle('ativo', ok);
}

function aceitarTermos() {
    document.getElementById('modal-termos').style.transform = 'translateY(-100%)';
    localStorage.setItem('termosAceitos', 'true');
}

// Listeners de Input
[valorPagarInput, addrInput].forEach(el => el?.addEventListener('input', validatePagar));
bnbReceberInput?.addEventListener('input', validateReceber);
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);
document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);
