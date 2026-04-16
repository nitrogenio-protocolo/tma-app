/**
 * NITROGÊNIO PROTOCOLO - v2.0 stable (Updated)
 * Lógica: Web3 Flow & Splash Control com Scanner Robusto
 */

// 1. Splash Control (Animação Sequencial)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    const textDao = document.getElementById('text-dao');
    const textNitrogenio = document.getElementById('text-nitrogenio');
    const splashLogo = document.getElementById('splash-logo');

    if (!splash) return;

    const delay = 800; 

    setTimeout(() => { textDao?.classList.add('fade-in'); }, delay);
    setTimeout(() => { 
        if(textDao) textDao.style.display = 'none'; 
        textNitrogenio?.classList.add('fade-in'); 
    }, delay * 2);
    setTimeout(() => { 
        if(textNitrogenio) textNitrogenio.style.display = 'none'; 
        splashLogo?.classList.add('fade-in'); 
    }, delay * 3);

    setTimeout(() => {
        splash.style.transition = 'opacity 0.6s ease';
        splash.style.opacity = '0';
        setTimeout(() => { splash.remove(); }, 600);
    }, delay * 5);
});

// 2. Web3 Connection
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
            if(balanceDisplay) balanceDisplay.innerText = `${formatBal} BNB`;
            if(nftBalanceDisplay) nftBalanceDisplay.innerText = NFT ALPHA 
        });
    }
}

document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// 3. Navigation Engine
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

// 4. Validations (Melhorado para Mobile)
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');

const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    if (!btn || !valorPagarInput || !addrInput) return;

    let valorStr = valorPagarInput.value.replace(',', '.');
    const valor = parseFloat(valorStr);
    const endereco = addrInput.value.trim();

    // Valida se o endereço começa com 0x e tem o tamanho certo
    const isValid = valor > 0 && endereco.startsWith('0x') && endereco.length === 42;
    
    btn.disabled = !isValid;
    btn.classList.toggle('active', isValid);
};

// Escuta múltiplos eventos para garantir que o "colar" funcione sempre
['input', 'change', 'paste', 'keyup'].forEach(evt => {
    valorPagarInput?.addEventListener(evt, validatePagar);
    addrInput?.addEventListener(evt, validatePagar);
});

// 5. QR Code & Scanner
function gerarCobranca() {
    const balInput = document.getElementById('bnb-receber');
    const bnbValor = balInput.value;
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbValor) return alert("Conecte a carteira e insira valor!");
    
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbValor}`, width: 200, height: 200 });
}

async function executarPagamento() {
    let valorN = document.getElementById('valor-pagar').value.replace(',', '.');
    const enderecoDestino = document.getElementById('wallet-address').value.trim();

    if (!userAccount || !signer) return alert("Conecte a carteira primeiro!");
    if (!ethers.isAddress(enderecoDestino)) return alert("Endereço de destino inválido!");

    try {
        const btnPagar = document.getElementById('btn-confirmar-pagar');
        btnPagar.innerText = "PROCESSANDO...";
        btnPagar.disabled = true;

        const tx = await signer.sendTransaction({
            to: enderecoDestino,
            value: ethers.parseEther(valorN) 
        });

        alert("Transação enviada!");
        await tx.wait(); 
        
        alert("Pagamento concluído!");
        fecharPagar();
        updateUI(); 

    } catch (err) {
        console.error(err);
        alert("Falha no pagamento. Verifique saldo.");
    } finally {
        const btnPagar = document.getElementById('btn-confirmar-pagar');
        if(btnPagar) {
            btnPagar.innerText = "PAGAR";
            btnPagar.disabled = false;
        }
    }
}

document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);

function fecharReceber() {
    document.getElementById('bnb-receber').value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    fecharView('area-receber');
}

// --- SCANNER COM LIMPEZA DE PREFIXO ---
let html5QrCode;

async function toggleScanner() {
    const readerDiv = document.getElementById('reader');
    
    if (!scannerAtivo) {
        readerDiv.style.display = 'block';
        scannerAtivo = true;
        
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 250, height: 250 } };

        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    // LIMPEZA: Remove "ethereum:" e qualquer parâmetro após "?"
                    let cleanAddr = decodedText.replace(/^(ethereum:)/i, "").trim();
                    if (cleanAddr.includes("?")) {
                        cleanAddr = cleanAddr.split("?")[0];
                    }

                    document.getElementById('wallet-address').value = cleanAddr;
                    pararScanner(); 
                    validatePagar(); 
                }
            );
        } catch (err) {
            console.error("Erro câmera:", err);
            pararScanner();
        }
    } else {
        pararScanner();
    }
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = false;
        }).catch(() => {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = false;
        });
    } else {
        scannerAtivo = false;
    }
}

function fecharPagar() {
    pararScanner();
    if(valorPagarInput) valorPagarInput.value = "";
    if(addrInput) addrInput.value = "";
    fecharView('area-pagar');
}
