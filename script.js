/**
 * NITROGÊNIO PROTOCOLO - v2.0 stable
 * Lógica: Web3 Flow & UI Integration
 */

// 1. Splash Control
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    const delay = 800; 
    setTimeout(() => { document.getElementById('text-dao')?.classList.add('fade-in'); }, delay);
    setTimeout(() => { 
        const tDao = document.getElementById('text-dao');
        if(tDao) tDao.style.display = 'none'; 
        document.getElementById('text-nitrogenio')?.classList.add('fade-in'); 
    }, delay * 2);
    setTimeout(() => { 
        const tNit = document.getElementById('text-nitrogenio');
        if(tNit) tNit.style.display = 'none'; 
        document.getElementById('splash-logo')?.classList.add('fade-in'); 
    }, delay * 3);
    setTimeout(() => {
        splash.style.transition = 'opacity 0.6s ease';
        splash.style.opacity = '0';
        setTimeout(() => { splash.remove(); }, 600);
    }, delay * 5);
});

// 2. Web3 & Saldo
let userAccount = null;
let provider, signer, scannerAtivo = false;

async function syncWallet() {
    if (!window.ethereum) return alert("Abra o app dentro da MetaMask Browser.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
    } catch (err) { console.error("Conexão falhou:", err); }
}

function updateUI() {
    const btn = document.getElementById('connect-trigger');
    const balanceDisplay = document.querySelector('.balance-amount');
    const nftBalanceDisplay = document.getElementById('nft-balance');

    if (userAccount && btn) {
        btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        
        provider.getBalance(userAccount).then(bal => {
            const formatBal = parseFloat(ethers.formatEther(bal)).toFixed(4);
            if (balanceDisplay) balanceDisplay.innerText = `${formatBal} BNB`;
            
            // Aqui as pazes: O card da Raposa ganha um texto elegante em vez do saldo bruto
            if (nftBalanceDisplay) nftBalanceDisplay.innerText = "Credencial Alpha Ativa";
        }).catch(err => console.error(err));
    }
}
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// 3. Navegação
function abrirView(viewId) {
    document.getElementById('home-app').style.display = 'none';
    document.querySelectorAll('.area-interna').forEach(a => a.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function fecharView(viewId) {
    if (scannerAtivo) pararScanner();
    document.getElementById(viewId).style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

function abrirPagar() { abrirView('area-pagar'); }
function abrirReceber() { abrirView('area-receber'); }

// 4. Validações e Ajuste de Tamanho (Inputs)
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');
const bnbReceberInput = document.getElementById('bnb-receber');

const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    let valorStr = valorPagarInput.value.replace(',', '.');
    const valor = parseFloat(valorStr);
    const endereco = addrInput.value.trim();
    const isValid = valor > 0 && endereco.startsWith('0x') && endereco.length === 42;
    
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

const validateReceber = () => {
    const btnGerar = document.getElementById('btn-gerar-qr');
    const valor = parseFloat(bnbReceberInput?.value.replace(',', '.') || "0");
    const isValid = valor > 0;
    if (btnGerar) {
        btnGerar.disabled = !isValid;
        btnGerar.style.opacity = isValid ? "1" : "0.5";
    }
};

['input', 'change', 'paste'].forEach(evt => {
    valorPagarInput?.addEventListener(evt, validatePagar);
    addrInput?.addEventListener(evt, validatePagar);
    bnbReceberInput?.addEventListener(evt, validateReceber);
});

// 5. QR Code & Pagamento
function gerarCobranca() {
    const bnbValor = bnbReceberInput.value;
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbValor) return alert("Conecte a carteira!");
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbValor}`, width: 180, height: 180 });
}

async function executarPagamento() {
    let valorN = valorPagarInput.value.replace(',', '.');
    const destino = addrInput.value.trim();
    try {
        const btn = document.getElementById('btn-confirmar-pagar');
        btn.innerText = "PROCESSANDO...";
        const tx = await signer.sendTransaction({ to: destino, value: ethers.parseEther(valorN) });
        await tx.wait();
        alert("Sucesso!");
        fecharPagar();
        updateUI();
    } catch (err) { alert("Erro na transação"); }
    finally { document.getElementById('btn-confirmar-pagar').innerText = "CONFIRMAR PAGAMENTO"; }
}
document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);

function fecharReceber() {
    if(bnbReceberInput) bnbReceberInput.value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    fecharView('area-receber');
}

// 6. Scanner
let html5QrCode;
async function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    if (!scannerAtivo) {
        readerDiv.style.display = 'block';
        scannerAtivo = true;
        html5QrCode = new Html5Qrcode("reader");
        try {
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 },
                (decodedText) => {
                    let cleanAddr = decodedText.replace(/^(ethereum:)/i, "").split("?")[0].trim();
                    addrInput.value = cleanAddr;
                    pararScanner();
                    validatePagar();
                }
            );
        } catch (err) { pararScanner(); }
    } else { pararScanner(); }
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = false;
        }).catch(() => { scannerAtivo = false; });
    }
}

function fecharPagar() {
    pararScanner();
    if(valorPagarInput) valorPagarInput.value = "";
    if(addrInput) addrInput.value = "";
    fecharView('area-pagar');
}

function expandRoom(card) {
    card.classList.toggle('expanded');
    // Trava o fundo para foco total
    if (card.classList.contains('expanded')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}
