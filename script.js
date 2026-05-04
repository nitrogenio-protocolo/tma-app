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

// 3. Navegação Melhorada
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

// 4. Validações
const valorPagarInput = document.getElementById('valor-pagar');
const addrInput = document.getElementById('wallet-address');
const bnbReceberInput = document.getElementById('bnb-receber');

const validatePagar = () => {
    const btn = document.getElementById('btn-confirmar-pagar');
    if (!btn || !valorPagarInput || !addrInput) return;
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

// 5. QR Code e Scanner
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
    validateReceber(); 
    fecharView('area-receber');
}

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
    validatePagar(); 
    fecharView('area-pagar');
}

// 6. Painéis e Governança Reais (Safe)
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

async function carregarPautasReaisDoCofre() {
    const urlAPI = `https://safe-transaction-bsc.safe.global/api/v1/safes/${ENDERECO_COFRE_SAFE}/multisig-transactions/`;
    const containerGoverno = document.getElementById('lista-pautas-governo');
    const containerMural = document.getElementById('lista-mural-automatica');
    const displayContador = document.getElementById('contador-assinaturas');
    const avisoGas = document.getElementById('aviso-gas');

    try {
        const resposta = await fetch(urlAPI);
        const dados = await resposta.json();
        const pautasPendentes = dados.results.filter(tx => !tx.isExecuted);
        const pautasExecutadas = dados.results.filter(tx => tx.isExecuted);

        if (containerGoverno) {
            if (pautasPendentes.length === 0) {
                containerGoverno.innerHTML = "<p style='text-align:center; color:#8e8e93; font-size:12px;'>Nenhuma pauta pendente.</p>";
            } else {
                containerGoverno.innerHTML = "";
                pautasPendentes.forEach(tx => {
                    const confirmacoes = tx.confirmations ? tx.confirmations.length : 0;
                    if(displayContador) displayContador.innerText = `${confirmacoes} de 11 Assinaturas`;
                    if(confirmacoes === 10 && avisoGas) avisoGas.style.display = 'block';

                    const card = document.createElement('div');
                    card.className = 'card-pauta';
                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:8px;">
                            <span style="color:#8e8e93;">NONCE #${tx.nonce}</span>
                            <span style="color:#007AFF;">${confirmacoes}/11 ASSINATURAS</span>
                        </div>
                        <p style="font-size:14px; font-weight:700; margin:10px 0;">${tx.description || "Transação de Protocolo"}</p>
                        <button class="btn-votar" onclick="assinarNoSafe('${tx.safeTxHash}')" 
                                style="width:100%; background:#007AFF; color:white; border:none; padding:12px; border-radius:50px; font-weight:bold;">
                            ${confirmacoes >= 10 ? 'EXECUTAR' : 'ASSINAR AGORA'}
                        </button>
                    `;
                    containerGoverno.appendChild(card);
                });
            }
        }

        // --- MURAL COM FILTRO (CORRIGIDO) ---
        if (containerMural) {
            containerMural.innerHTML = "";
            pautasExecutadas
                .filter(tx => tx.description && tx.description !== "") 
                .slice(0, 10) 
                .forEach(tx => {
                    const cardMural = document.createElement('div');
                    cardMural.className = 'card-pauta';
                    cardMural.style.borderLeft = "4px solid #34C759";
                    cardMural.innerHTML = `
                        <small style="color:#34C759; font-weight:bold;">RECURSO LIBERADO ✅</small>
                        <p style="font-size:13px; margin:5px 0; font-weight:600;">${tx.description}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:10px; color:#8e8e93;">Nonce #${tx.nonce}</span>
                            <a href="https://bscscan.com/tx/${tx.transactionHash}" target="_blank" style="font-size:11px; color:#007AFF; text-decoration:none;">
                                Ver na Blockchain ↗
                            </a>
                        </div>
                    `;
                    containerMural.appendChild(cardMural);
                });
        }
    } catch (e) { console.error("Erro Safe:", e); }
}

// 7. Termos (Versão Corrigida para Destravar)
function validarTermos() {
    const check1 = document.getElementById('check-tecnico');
    const check2 = document.getElementById('check-responsabilidade');
    const btn = document.getElementById('btn-entrar');
    const msg = document.getElementById('msg-convite');

    if (check1 && check2 && btn) {
        if (check1.checked && check2.checked) {
            btn.disabled = false;
            btn.classList.add('ativo'); // Garante que ele fique azul/clicável
            if(msg) msg.innerText = "Tudo pronto!";
        } else {
            btn.disabled = true;
            btn.classList.remove('ativo');
            if(msg) msg.innerText = "Aceite os termos para prosseguir";
        }
    }
}

// Essa função faz a tela sumir quando você clica em Avançar
function aceitarTermos() {
    const modal = document.getElementById('modal-termos');
    if(modal) {
        modal.style.transform = 'translateY(-100%)';
        setTimeout(() => { modal.style.display = 'none'; }, 500);
    }
    localStorage.setItem('termosAceitos', 'true');
}

    setInterval(atualizarRelogio, 1000);
    atualizarRelogio();
}

// 8. Comunidade (Jaquetas)
const pautasComunidade = [
    { id: 1, autor: "Guardião 01", titulo: "Jaqueta Corta-Vento Azul", votos: 12 },
    { id: 2, autor: "Guardião 02", titulo: "Modelo Refletivo Total", votos: 8 },
    { id: 3, autor: "Sidnei", titulo: "Colete de Proteção Alpha", votos: 15 }
];

async function carregarVotacaoComunidade() {
    const sala = document.getElementById('lista-pautas-comunidade');
    if (!sala) return;
    pautasComunidade.sort((a, b) => b.votos - a.votos);
    sala.innerHTML = pautasComunidade.map(p => `
        <div class="card-pauta" style="border-left: 4px solid #007AFF; margin-bottom: 12px; padding: 15px; background: #fff; border-radius: 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <small style="color: #8e8e93; font-weight: bold;">SUGESTÃO: ${p.autor}</small>
                <span style="color: #007AFF; font-size: 11px; font-weight: bold;">${p.votos} VOTOS</span>
            </div>
            <h3 style="font-size: 16px; margin: 8px 0;">${p.titulo}</h3>
            <button class="btn-votar" onclick="votarNaPauta(${p.id})" style="width:100%; background:#f2f2f7; color:#007AFF; border:none; padding:10px; border-radius:8px;">APOIAR</button>
        </div>
    `).join('');
}

function votarNaPauta(id) {
    if(!userAccount) return alert("Conecte a carteira!");
    alert("Voto registrado via: " + userAccount.substring(0,6));
}

// Inicia o motor
motorGovernançaNitrogenio();

// 9. Assinatura e Pagamento
async function assinarNoSafe(safeTxHash) {
    if (!signer) return syncWallet();
    try {
        const assinatura = await signer.signMessage(ethers.getBytes(safeTxHash));
        if (assinatura) {
            alert("Assinado!");
            setTimeout(() => carregarPautasReaisDoCofre(), 3000);
        }
    } catch (err) { console.error(err); }
}

async function executarPagamento() {
    if (!signer) return alert("Conecte a carteira.");
    const valor = valorPagarInput.value.replace(',', '.');
    const destino = addrInput.value.trim();
    try {
        const tx = await signer.sendTransaction({ to: destino, value: ethers.parseEther(valor) });
        await tx.wait();
        alert("Sucesso!");
        fecharPagar();
    } catch (err) { alert("Erro na transação."); }
}

document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);

// Inicialização
window.addEventListener('load', () => {
    if (window.ethereum && window.ethereum.selectedAddress) syncWallet();
});
