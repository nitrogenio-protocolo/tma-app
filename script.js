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

// 3. Navegação Melhorada (Sem esconder a Home)
function abrirView(viewId) {
    // Apenas mostramos a nova tela por cima da Home
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'block';
        // Trava o scroll da Home ao fundo
        document.body.style.overflow = 'hidden'; 
    }
}

function fecharView(viewId) {
    if (scannerAtivo) pararScanner();
    const view = document.getElementById(viewId);
    if (view) {
        view.style.display = 'none';
        // Devolve o scroll para a Home
        document.body.style.overflow = 'auto';
    }
}

// Garanta que as funções específicas usem a nova lógica
function abrirPagar() { abrirView('area-pagar'); }
function abrirReceber() { abrirView('area-receber'); }

function fecharReceber() {
    if(bnbReceberInput) bnbReceberInput.value = "";
    document.getElementById('qrcode-container').innerHTML = "";
    validateReceber(); 
    fecharView('area-receber');
}

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
    validateReceber(); 
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
    validatePagar(); 
    fecharView('area-pagar');
}

/// CONTROLE DE PAINÉIS (SHEETS) - INTEGRADO COM COMUNIDADE
function abrirPainel(id) {
    const painel = document.getElementById('painel-' + id);
    if (painel) {
        painel.classList.add('aberto');
        document.body.style.overflow = 'hidden'; 

        // Se abrir Governo ou Mural -> Busca pautas de execução (Blockchain)
        if (id === 'governo' || id === 'mural') {
            carregarPautasReaisDoCofre();
        }
        
        // Se abrir Sala da Comunidade -> Busca as votações de sugestões (Jaquetas/Ideias)
        if (id === 'comunidade') {
            carregarVotacaoComunidade();
        }
        
        // Se abrir Sala Cofre -> Atualiza apenas o saldo de BNB
        if (id === 'cofre') {
            atualizarSaldoRealCofre();
        }
    }
}

function fecharPainel(id) {
    const painel = document.getElementById('painel-' + id);
    if (painel) {
        painel.classList.remove('aberto');
        document.body.style.overflow = 'auto'; 
    }
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
    
    // Seleciona os novos containers que criamos no HTML
    const containerGoverno = document.getElementById('lista-pautas-governo');
    const containerMural = document.getElementById('lista-mural-automatica');
    const displayContador = document.getElementById('contador-assinaturas');
    const avisoGas = document.getElementById('aviso-gas');

    try {
        const resposta = await fetch(urlAPI);
        const dados = await resposta.json();
        
        // Separa o que é pendente do que já foi executado
        const pautasPendentes = dados.results.filter(tx => !tx.isExecuted);
        const pautasExecutadas = dados.results.filter(tx => tx.isExecuted);

        // --- LÓGICA DA SALA GOVERNO ---
        if (containerGoverno) {
            if (pautasPendentes.length === 0) {
                containerGoverno.innerHTML = "<p style='text-align:center; color:#8e8e93; font-size:12px;'>Nenhuma pauta para execução no momento.</p>";
            } else {
                containerGoverno.innerHTML = "";
                pautasPendentes.forEach(tx => {
                    const confirmacoes = tx.confirmations ? tx.confirmations.length : 0;
                    
                    // Atualiza o contador global se for a pauta mais recente
                    if(displayContador) displayContador.innerText = `${confirmacoes} de 11 Assinaturas`;
                    
                    // Alerta de Gás para o 11º Guardião
                    if(confirmacoes === 10 && avisoGas) {
                        avisoGas.style.display = 'block';
                    }

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
                            ${confirmacoes >= 10 ? 'EXECUTAR (PAGAR GÁS)' : 'ASSINAR AGORA'}
                        </button>
                    `;
                    containerGoverno.appendChild(card);
                });
            }
        }

        // --- LÓGICA DO MURAL (HISTÓRICO) ---
if (containerMural) {
    containerMural.innerHTML = "";
    
    // Filtra e garante que pautasExecutadas existe
    const lista = pautasExecutadas || [];

    lista.slice(0, 10).forEach(tx => {
        const cardMural = document.createElement('div');
        cardMural.className = 'card-pauta';
        cardMural.style.borderLeft = "4px solid #34C759";
        
        // PROTEÇÃO: Tenta pegar a descrição. 
        // Se não existir, tenta o método com segurança (usando o ?. )
        // Se nada funcionar, usa o texto padrão com o Nonce.
        const textoExibicao = tx.description || 
                             tx.dataDecoded?.method || 
                             `Execução de Protocolo (Nonce #${tx.nonce})`;

        cardMural.innerHTML = `
            <small style="color:#34C759; font-weight:bold;">RECURSO LIBERADO ✅</small>
            <p style="font-size:14px; font-weight:700; margin:5px 0; color:#1c1c1e;">${textoExibicao}</p>
            <a href="https://bscscan.com/tx/${tx.transactionHash}" target="_blank" style="font-size:11px; color:#007AFF; text-decoration:none; display:block; margin-top:5px;">
                Ver comprovante na Blockchain ↗
            </a>
        `;
        
        // DICA: Use prepend para o Nonce mais novo aparecer em cima
        containerMural.appendChild(cardMural);
    });
}
        
// --- ÁREA NFT ALPHA (EFEITO SUBIDA - SUBSTITUÍDO) ---
function abrirNFT() {
    document.getElementById('home-app').style.display = 'none';
    document.getElementById('area-nft').style.display = 'block';
}

function fecharNFT() {
    document.getElementById('area-nft').style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

function iniciarMint() {
    if (!userAccount) {
        alert("Peraí! Você precisa conectar sua carteira primeiro para garantir seu NFT Alpha.");
        syncWallet(); // Tenta conectar se ele esqueceu
        return;
    }
    // Aqui no futuro entra o contrato inteligente do NFT
    alert("Iniciando processo de Mint para a carteira: " + userAccount);
}

function motorGovernançaNitrogenio() {
    function atualizarRelogio() {
        // ESSA LINHA É A CHAVE: Procure o ID toda vez que o segundo mudar
        const displayTempo = document.getElementById('tempo-restante');
        
        if (displayTempo) {
            const agoraRelogio = new Date();
            const vencimento = new Date();
            vencimento.setHours(24, 0, 0, 0); 

            const diff = vencimento - agoraRelogio;

            if (diff > 0) {
                const horas = Math.floor(diff / (1000 * 60 * 60));
                const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const segundos = Math.floor((diff % (1000 * 60)) / 1000);
                
                // Formatação bonita com 2 dígitos
                const h = horas.toString().padStart(2, '0');
                const m = minutos.toString().padStart(2, '0');
                const s = segundos.toString().padStart(2, '0');

                // CORREÇÃO: Trocamos o primeiro 's' por 'm' (horas, minutos, segundos)
                displayTempo.innerText = `${h}h ${m}m ${s}s`;
            }
        }
    }

    setInterval(atualizarRelogio, 1000); // Faz o motor girar a cada segundo
    atualizarRelogio();
    carregarPautasReaisDoCofre();
}

// --- BLOCO INTEGRADO: GOVERNANÇA DE PRODUTO (JAQUETAS) ---

// Dados simulados (no futuro virão do Snapshot.org via API)
const pautasComunidade = [
    { id: 1, autor: "Guardião 01", titulo: "Jaqueta Corta-Vento Azul", votos: 12 },
    { id: 2, autor: "Guardião 02", titulo: "Modelo Refletivo Total", votos: 8 },
    { id: 3, autor: "Sidnei", titulo: "Colete de Proteção Alpha", votos: 15 }
];

async function carregarVotacaoComunidade() {
    console.log("Buscando pautas da comunidade...");
    // Aqui simulamos a chamada da API do Snapshot
    renderizarPautas();
}

function renderizarPautas() {
    const sala = document.getElementById('lista-pautas-comunidade');
    if (!sala) return;

    // Ordena: Mais votados no topo
    pautasComunidade.sort((a, b) => b.votos - a.votos);
    
    sala.innerHTML = pautasComunidade.map(p => `
        <div class="card-pauta" style="border-left: 4px solid #007AFF; margin-bottom: 12px; padding: 15px; background: #fff; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <small style="color: #8e8e93; font-weight: bold;">SUGESTÃO: ${p.autor}</small>
                <span style="background: #e5f1ff; color: #007AFF; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">${p.votos} VOTOS</span>
            </div>
            <h3 style="font-size: 16px; margin: 8px 0; color: #1c1c1e;">${p.titulo}</h3>
            <button class="btn-votar" onclick="votarNaPauta(${p.id})" 
                    style="width:100%; background:#f2f2f7; color:#007AFF; border:none; padding:10px; border-radius:8px; font-weight:600; cursor:pointer;">
                APOIAR ESTA IDEIA
            </button>
        </div>
    `).join('');
}

function votarNaPauta(id) {
    if(!userAccount) return alert("Conecte a carteira para votar!");
    alert("Voto registrado para a pauta #" + id + " via carteira " + userAccount.substring(0,6));
    // Aqui entraria a chamada de contrato ou API do Snapshot
}

// A CHAVE NA IGNIÇÃO: Esta linha abaixo faz tudo o que está acima começar a funcionar
motorGovernançaNitrogenio();

// 9. Execução de Pagamento (O que estava faltando)
async function executarPagamento() {
    if (!signer) {
        alert("Por favor, conecte sua carteira primeiro.");
        return;
    }

    const valor = valorPagarInput.value.replace(',', '.');
    const destino = addrInput.value.trim();

    try {
        // Mostra um feedback visual de "processando"
        const btn = document.getElementById('btn-confirmar-pagar');
        const textoOriginal = btn.innerText;
        btn.innerText = "PROCESSANDO...";
        btn.disabled = true;

        // Monta a transação
        const tx = await signer.sendTransaction({
            to: destino,
            value: ethers.parseEther(valor)
        });

        console.log("Transação enviada:", tx.hash);
        
        // Aguarda a confirmação na rede
        await tx.wait();
        
        alert("Pagamento realizado com sucesso!");
        fecharPagar(); // Limpa os campos e volta para a home

    } catch (err) {
        console.error("Erro ao pagar:", err);
        alert("Erro na transação: " + (err.reason || "Usuário cancelou ou saldo insuficiente"));
    } finally {
        const btn = document.getElementById('btn-confirmar-pagar');
        btn.innerText = "CONFIRMAR PAGAMENTO";
        btn.disabled = false;
    }
}

// Vincula a função ao clique do botão
document.getElementById('btn-confirmar-pagar')?.addEventListener('click', executarPagamento);

// Tenta reconectar automaticamente se o usuário já autorizou antes
window.addEventListener('load', () => {
    if (window.ethereum && window.ethereum.selectedAddress) {
        syncWallet();
    }
});

// 10. Assinatura de Governança via Safe
async function assinarNoSafe(safeTxHash) {
    if (!signer) {
        alert("Conecte sua carteira de Guardião primeiro.");
        return syncWallet();
    }

    try {
        // O pop-up da MetaMask vai subir aqui
        console.log("Solicitando assinatura para:", safeTxHash);
        
        // Na Safe, a assinatura é uma mensagem assinada (Personal Sign)
        const assinatura = await signer.signMessage(ethers.getBytes(safeTxHash));

        if (assinatura) {
            alert("Assinatura enviada com sucesso! Aguardando sincronização da rede.");
            // Atualiza a tela para mostrar o novo contador (ex: 1/11, 2/11...)
            setTimeout(() => carregarPautasReaisDoCofre(), 3000);
        }
    } catch (err) {
        console.error("Erro ao assinar:", err);
        alert("Assinatura cancelada ou erro técnico: " + (err.reason || "Verifique sua conexão"));
    }
}
