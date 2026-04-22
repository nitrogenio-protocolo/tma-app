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
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; 
let provider, signer, userAccount, scannerAtivo = false;

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
    } catch (err) { 
        console.error("Erro Safe:", err); 
    }
}

function updateUI() {
    const btn = document.getElementById('connect-trigger');
    const balanceDisplay = document.querySelector('.balance-amount');

    if (userAccount && btn) {
        btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        provider.getBalance(userAccount).then(bal => {
            const formatBal = parseFloat(ethers.formatEther(bal)).toFixed(4);
            if (balanceDisplay) balanceDisplay.innerText = `${formatBal} BNB`;
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

// 4. Validações
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
        btnGerar.classList.toggle('active', isValid); 
    }
};

['input', 'change', 'paste'].forEach(evt => {
    valorPagarInput?.addEventListener(evt, validatePagar);
    addrInput?.addEventListener(evt, validatePagar);
    bnbReceberInput?.addEventListener(evt, validateReceber);
});

// 5. QR Code
function gerarCobranca() {
    const bnbValor = bnbReceberInput.value;
    const container = document.getElementById('qrcode-container');
    if (!userAccount || !bnbValor) return alert("Conecte a carteira!");
    container.innerHTML = "";
    new QRCode(container, { text: `ethereum:${userAccount}?value=${bnbValor}`, width: 180, height: 180 });
}

function fecharReceber() {
    if(bnbReceberInput) bnbReceberInput.value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    fecharView('area-receber');
}

// 6. Scanner & Salas
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
                    addrInput.value = decodedText.replace(/^(ethereum:)/i, "").split("?")[0].trim();
                    pararScanner();
                    validatePagar();
                }
            );
        } catch (err) { pararScanner(); }
    } else { pararScanner(); }
}

async function pararScanner() {
    if (html5QrCode && scannerAtivo) {
        try { await html5QrCode.stop(); } catch (err) { console.error(err); }
        finally { document.getElementById('reader').style.display = 'none'; scannerAtivo = false; }
    }
}

async function fecharPagar() {
    await pararScanner();
    if(valorPagarInput) valorPagarInput.value = "";
    if(addrInput) addrInput.value = "";
    fecharView('area-pagar');
}

function expandRoom(card) {
    card.classList.toggle('expanded');
    document.body.style.overflow = card.classList.contains('expanded') ? 'hidden' : 'auto';
}

// 7. Termos
function validarTermos() {
    const check1 = document.getElementById('check-tecnico').checked;
    const check2 = document.getElementById('check-responsabilidade').checked;
    const btn = document.getElementById('btn-entrar');
    if (check1 && check2) {
        btn.disabled = false;
        btn.classList.add('ativo');
        document.getElementById('msg-convite').innerText = ""; 
    } else {
        btn.disabled = true;
        btn.classList.remove('ativo');
        document.getElementById('msg-convite').innerText = "Aceite os termos para prosseguir";
    }
}

function aceitarTermos() {
    document.getElementById('modal-termos').style.transform = 'translateY(-100%)';
    localStorage.setItem('termosAceitos', 'true');
}

setTimeout(() => {
    if(localStorage.getItem('termosAceitos') === 'true') {
        const modal = document.getElementById('modal-termos');
        if(modal) modal.style.display = 'none';
    }
}, 100);

// 8. Governança
function abrirModalVotacao(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('modal-votacao');
    if (modal) { modal.style.zIndex = "9500"; modal.style.bottom = "0"; }
}

function fecharModalVotacao() {
    const modal = document.getElementById('modal-votacao');
    if (modal) modal.style.bottom = "-100%";
}

async function carregarPautasReaisDoCofre() {
    const urlAPI = `https://safe-transaction-bsc.safe.global/api/v1/safes/${ENDERECO_COFRE_SAFE}/multisig-transactions/`;
    const container = document.getElementById('cronometro-da-dao');
    if (!container) return;

    try {
        const resposta = await fetch(urlAPI);
        const dados = await resposta.json();
        const pautas = dados.results.filter(tx => !tx.isExecuted);

        if (pautas.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#8e8e93;'>Nenhuma pauta pendente.</p>";
            return;
        }

        container.innerHTML = ""; 
        pautas.forEach(pauta => {
            if (pauta.nonce === null) return;
            let textoNota = "Ação técnica de governança";
            if (pauta.origin) {
                try {
                    const obj = JSON.parse(pauta.origin);
                    textoNota = obj.description || obj.name || pauta.origin;
                } catch(e) { textoNota = pauta.origin; }
            }
            // Limpeza "Hakuna Matata" para o texto ficar perfeito
            textoNota = textoNota.replace(/^note:\s*/i, "");
            try {
                // Converte códigos como \u00e7 em letras reais (ç, ã, etc)
                textoNota = JSON.parse('"' + textoNota.replace(/"/g, '\\"') + '"');
            } catch (e) {
                textoNota = textoNota.replace(/[\\"{}]/g, "");
            }
            textoNota = textoNota.trim();

            const card = document.createElement('div');
            card.className = 'card-pauta'; 
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#8e8e93; margin-bottom:10px;">
                    <span>#${pauta.nonce}</span>
                    <span style="color:#007AFF;">COFRE NITROGÊNIO</span>
                </div>
                <div style="margin-bottom:12px;">
                    <h4 style="font-size:11px; color:#8e8e93; margin:0; text-transform:uppercase;">PROPÓSITO DA COMUNIDADE:</h4>
                    <p style="font-size:15px; color:#1a1a1a; margin:4px 0; font-weight:700; line-height:1.4;">
                        ${textoNota}
                    </p>
                </div>
                <button class="btn-votar" onclick="abrirModalVotacao(event)" 
                        style="width:100%; background:#007AFF; color:white; border:none; padding:14px; border-radius:50px; font-size:14px; font-weight:bold; cursor:pointer;">
                    VOTAR
                </button>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Erro Safe:", e);
    }
}

function motorGovernançaNitrogenio() {
    const agora = new Date();
    const diaSemana = agora.getDay(); 
    const crono = document.getElementById('cronometro-da-dao');
    const displayTempo = document.getElementById('tempo-restante');
    
    // 1. Lógica do Cronômetro Real
    function atualizarRelogio() {
        const agoraRelogio = new Date();
        // Próxima Segunda-feira às 00:00:00
        const proximaSegunda = new Date();
        proximaSegunda.setDate(agoraRelogio.getDate() + (7 - agoraRelogio.getDay() + 1) % 7);
        proximaSegunda.setHours(0, 0, 0, 0);

        const diff = proximaSegunda - agoraRelogio;

        if (diff > 0) {
            const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
            const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (displayTempo) {
                displayTempo.innerText = `${dias}d ${horas}h ${minutos}m`;
            }
        }
    }

    // Atualiza o relógio a cada minuto
    setInterval(atualizarRelogio, 60000);
    atualizarRelogio();

    // 2. Lógica das Pautas
    if (!crono) return;
    
    if (diaSemana === 1 || diaSemana === 2) {
        crono.innerHTML = `<p style="text-align:center; padding:20px; color:#666;">Votação Finalizada. Em análise pelos Guardiões.</p>`;
    } else {
        carregarPautasReaisDoCofre();
    }
}

motorGovernançaNitrogenio();
