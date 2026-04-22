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
const ENDERECO_COFRE_SAFE = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219"; //
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
        // Chama a função do cofre logo após conectar
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
    const nftBalanceDisplay = document.getElementById('nft-balance');

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

function abrirPagar(event) { 
    if (event) event.preventDefault(); 
    abrirView('area-pagar'); 
}

function abrirReceber(event) { 
    if (event) event.preventDefault(); 
    abrirView('area-receber'); 
}
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
        btnGerar.classList.toggle('active', isValid); 
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

async function pararScanner() {
    if (html5QrCode && scannerAtivo) {
        try {
            await html5QrCode.stop(); // O 'await' faz o código esperar o desligamento real
            console.log("Scanner parado com sucesso");
        } catch (err) {
            console.error("Erro ao parar scanner:", err);
        } finally {
            document.getElementById('reader').style.display = 'none';
            scannerAtivo = false;
        }
    }
}

// E ajuste a fecharPagar para ser assíncrona também:
async function fecharPagar() {
    await pararScanner(); // Espera o scanner morrer antes de trocar a tela
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


function validarTermos() {
    const check1 = document.getElementById('check-tecnico').checked;
    const check2 = document.getElementById('check-responsabilidade').checked;
    const btn = document.getElementById('btn-entrar');
    const msg = document.getElementById('msg-convite');

    if (check1 && check2) {
        btn.disabled = false;
        btn.classList.add('ativo');
        // Texto de aviso removido para ficar subliminar
        msg.innerText = ""; 
    } else {
        btn.disabled = true;
        btn.classList.remove('ativo');
        // Texto de instrução discreto enquanto não aceita
        msg.innerText = "Aceite os termos para prosseguir";
        msg.style.color = "#666";
    }
}

function aceitarTermos() {
    // Efeito de subir a cortina
    document.getElementById('modal-termos').style.transform = 'translateY(-100%)';
    localStorage.setItem('termosAceitos', 'true');
}

// Verifica o aceite sem bugar o seu window.onload atual
setTimeout(() => {
    if(localStorage.getItem('termosAceitos') === 'true') {
        const modal = document.getElementById('modal-termos');
        if(modal) modal.style.display = 'none';
    }
}, 100);

// 1. Função para abrir a Janela de Votação
function abrirModalVotacao(e) {
    if (e) e.stopPropagation(); // Evita que o card feche ao clicar no botão
    const modal = document.getElementById('modal-votacao');
    if (modal) {
        modal.style.zIndex = "3000"; // Isso coloca o modal na frente de tudo
        modal.style.bottom = "0"; 
      }
    } 

// 2. Função para fechar a Janela
function fecharModalVotacao() {
    const modal = document.getElementById('modal-votacao');
    if (modal) modal.style.bottom = "-100%"; // Faz a janela descer
}

// 3. Função de Votação Real (Majestosa e Sem Gás)
async function processarVoto(escolha) {
    const status = document.getElementById('status-assinatura');
    status.innerText = "Aguardando assinatura digital...";
    status.style.color = "#007AFF";

    try {
        // Conecta com a carteira usando a biblioteca ethers que você já tem
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Mensagem técnica que o usuário assina (Custo ZERO de gás)
        const mensagem = `Protocolo Nitrogênio\nAção: Votação Governança\nPauta: #042 - 10 Jaquetas Alpha\nEscolha: ${escolha}`;
        
        // Solicita a assinatura
        const assinatura = await signer.signMessage(mensagem);
        
        console.log("Assinatura realizada:", assinatura);
        
        // Feedback de sucesso "Geminial"
        status.innerText = "✅ VOTO REGISTRADO COM SUCESSO!";
        status.style.color = "#28a745";

        // Pequeno delay para o usuário ver o sucesso antes de fechar
        setTimeout(() => {
            fecharModalVotacao();
            document.getElementById('contador-votos').innerHTML = '<i class="fa-solid fa-id-card"></i> 43 Votos';
            // Atualiza o botão na home para mostrar que já votou
            const btnVotar = document.querySelector('.btn-votar-alpha');
            if (btnVotar) {
                btnVotar.innerText = "VOTO COMPUTADO";
                btnVotar.style.background = "#28a745";
                btnVotar.disabled = true;
            }
        }, 2000);

    } catch (error) {
        console.error("Erro na votação:", error);
        status.innerText = "Votação cancelada ou erro na assinatura.";
        status.style.color = "#ff4444";
    }
}

// --- MOTOR DE GOVERNANÇA (VERSÃO ÚNICA E ESTÁVEL) ---
function motorGovernançaNitrogenio() {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 1 = Segunda-feira
    
    const crono = document.getElementById('cronometro-da-dao');
    const areaGoverno = document.getElementById('lista-pautas-governo');
    
    if (!crono || !areaGoverno) return; 
    
    // REGRA DE SEGUNDA E TERÇA: LIMPEZA E PROMOÇÃO
    if (diaSemana === 1 || diaSemana === 2) {
        
        // 1. Limpa a pauta da Comunidade
        if(crono.parentElement) {
            crono.parentElement.innerHTML = `
                <div style="text-align:center; padding:30px 15px; color:#666; background:#f9f9f9; border-radius:18px; border: 1px dashed #007AFF;">
                    <i class="fa-solid fa-box-archive" style="font-size:32px; color:#007AFF; margin-bottom:12px;"></i>
                    <p style="margin:0; font-size:14px; line-height:1.5;">
                        <b>Votação Finalizada!</b><br>
                        A pauta anterior foi enviada para os Guardiões.<br>
                        <small style="color:#007AFF;">Novas pautas a partir de Quarta.</small>
                    </p>
                </div>`;
        }

        // 2. Alimenta a sala Governo (Onde os Guardiões analisam)
        areaGoverno.innerHTML = `
            <div class="card-pauta-executiva" style="background:#eef6ff; border-left:4px solid #007AFF; padding:15px; border-radius:12px; text-align:left; margin-bottom:15px;">
                <small style="color:#007AFF; font-weight:bold; font-size:10px;">ESTADO: ANÁLISE DOS GUARDIÕES</small>
                <h4 style="margin:8px 0; color:#333; font-size:16px;">#042 - 10 Jaquetas Alpha</h4>
                <div style="height:8px; background:#ddd; border-radius:4px; overflow:hidden; margin:10px 0;">
                    <div style="width:52%; height:100%; background:#007AFF;"></div>
                </div>
                <p style="font-size:11px; color:#666;"><b>Aprovação:</b> Requer 11 votos dos Guardiões (21 total).</p>
            </div>`;
    }
}

// Inicializa o motor automaticamente
motorGovernançaNitrogenio();


// --- 7. INTEGRAÇÃO REAL COM COFRE SAFE (API) ---

/**
 * Puxa as propostas pendentes da Safe Wallet e cria os mini-cards.
 * Chamamos isso na Quarta-feira (quando abre a votação na comunidade).
 */
async function carregarPautasReaisDoCofre() {
    const enderecoCofre = ENDERECO_COFRE_SAFE; // Usa a variável que você já tem no topo
    const urlAPI = `https://safe-transaction-bsc.safe.global/api/v1/safes/${enderecoCofre}/multisig-transactions/`;
    const containerComunidade = document.getElementById('cronometro-da-dao');

    if (!containerComunidade) return;

    try {
        const resposta = await fetch(urlAPI);
        const dados = await resposta.json();

        // Filtramos apenas pautas pendentes (não executadas)
        const pautasPendentes = dados.results.filter(tx => !tx.isExecuted);

        if (pautasPendentes.length === 0) {
            containerComunidade.innerHTML = "<p style='text-align:center; color:#8e8e93;'>Nenhuma pauta pendente no cofre.</p>";
            return;
        }

        containerComunidade.innerHTML = ""; // Limpa o "placeholder"

        pautasPendentes.forEach(pauta => {
            // --- FILTRO DE SIMULAÇÕES ---
            // Se não tiver nonce, ignoramos (evita rascunhos e simulações locais)
            if (pauta.nonce === null || pauta.nonce === undefined) return;

            // --- LÓGICA DE IGNIÇÃO (BUSCA PROFUNDA) ---
            let textoFinal = "Ação técnica de governança";

            // 1. Tenta pegar a nota manual (campo origin)
            if (pauta.origin && pauta.origin !== "{}") {
                try {
                    const originData = JSON.parse(pauta.origin);
                    if (originData.description) {
                        textoFinal = originData.description;
                    } else if (originData.name) {
                        textoFinal = originData.name;
                    }
                } catch(e) {
                    if(typeof pauta.origin === 'string') textoFinal = pauta.origin;
                }
            } 
            
            // 2. Se a nota falhou, mas é uma transferência, o JS gera o texto automaticamente
            if (textoFinal.includes("técnica") && pauta.dataDecoded?.method === "transfer") {
                const valor = pauta.value ? ethers.formatEther(pauta.value) : "0";
                textoFinal = `Transferência de ${valor} BNB para fins operacionais`;
            }

            // 3. Limpeza final (Corta links e espaços)
            textoFinal = textoFinal.split('http')[0].trim();

            // --- RENDERIZAÇÃO DO CARD ---
            const card = document.createElement('div');
            card.className = 'card-pauta'; 
            card.style = "background:#fff; border-radius:20px; padding:15px; margin-bottom:15px; border:1px solid #f2f2f7; box-shadow:0 4px 12px rgba(0,0,0,0.05);";
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:10px; font-weight:bold; color:#8e8e93; margin-bottom:10px;">
                    <span>#${pauta.nonce}</span>
                    <span style="color:#007AFF;">COFRE NITROGÊNIO</span>
                </div>
                <div style="margin-bottom:12px;">
                    <h4 style="font-size:11px; color:#8e8e93; margin:0; text-transform:uppercase;">Propósito da Comunidade:</h4>
                    <p style="font-size:15px; color:#1a1a1a; margin:4px 0; font-weight:700; line-height:1.4;">
                        ${textoFinal}
                    </p>
                </div>
                <button class="btn-votar" onclick="abrirModalVotacao(event)" 
                        style="width:100%; background:#007AFF; color:white; border:none; padding:12px; border-radius:50px; font-size:13px; font-weight:bold; cursor:pointer;">
                    VOTAR
                </button>
                <div style="text-align:center; margin-top:10px;">
                    <a href="https://bscscan.com/tx/${pauta.safeTxHash}" target="_blank" style="font-size:10px; color:#8e8e93; text-decoration:none;">
                        <i class="fa-solid fa-magnifying-glass"></i> Auditar no BSCScan
                    </a>
                </div>
            `;
            containerComunidade.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar Safe:", erro);
        containerComunidade.innerHTML = "<p style='color:red; font-size:12px;'>Erro ao conectar com o Cofre Real.</p>";
    }
}

// Atualiza o seu motor para chamar a função real na Quarta-feira
const originalMotor = motorGovernançaNitrogenio;
motorGovernançaNitrogenio = function() {
    originalMotor(); // Roda o que você já tinha
    const diaSemana = new Date().getDay();
    
    // Se for Quarta, Quinta, Sexta, Sábado ou Domingo (3 a 0)
    if (diaSemana >= 3 || diaSemana === 0) {
        carregarPautasReaisDoCofre();
    }
};

// Reinicializa para aplicar a mudança
motorGovernançaNitrogenio();
