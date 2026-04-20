/**
 * NITROGÊNIO PROTOCOLO - v2.0 stable
 * Foco: Automação de Fluxo e Sigilo do Cofre
 */

// --- 1. MEMÓRIA E ESTADO INICIAL ---
let userAccount = null;
let provider, signer, scannerAtivo = false;

// Onde as pautas ficam guardadas (Trilho invisível)
let pautasNitrogenio = [
    { id: "001", titulo: "Sugestão #01", status: "COMUNIDADE", data: new Date() }
];

// --- 2. MOTOR DE TEMPO E GOVERNANÇA (O CORAÇÃO) ---
function motorGovernançaNitrogenio() {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0:Dom, 1:Seg, 3:Qua

    pautasNitrogenio.forEach(pauta => {
        // REGRA SEG/TER: Sai da Comunidade -> Vai para Governo
        if ((diaSemana === 1 || diaSemana === 2) && pauta.status === "COMUNIDADE") {
            pauta.status = "GOVERNO";
        }
        // REGRA SEGUNDA: Sai do Governo -> Vai para Mural (após o ciclo)
        if (diaSemana === 1 && pauta.status === "GOVERNO") {
            pauta.status = "MURAL";
        }
    });

    renderizarSalas();
}

// --- 3. INTERFACE E RENDERIZAÇÃO ---
function renderizarSalas() {
    const divComunidade = document.getElementById('cronometro-da-dao')?.parentElement;
    const divGoverno = document.getElementById('lista-pautas-governo');
    const divMural = document.getElementById('historico-mural');

    // Limpa apenas o conteúdo das listas
    if (divGoverno) divGoverno.innerHTML = "";
    if (divMural) divMural.innerHTML = "";

    pautasNitrogenio.forEach(p => {
        const card = `
            <div class="card-pauta-executiva" style="background:#f4f7f9; border-left:4px solid #007AFF; padding:15px; border-radius:12px; margin-bottom:15px;">
                <small style="color:#007AFF; font-weight:bold; font-size:10px;">ID: #${p.id} | STATUS: ${p.status}</small>
                <h4 style="margin:8px 0; color:#333; font-size:16px;">${p.titulo}</h4>
            </div>`;
        
        if (p.status === "GOVERNO" && divGoverno) divGoverno.innerHTML += card;
        if (p.status === "MURAL" && divMural) divMural.innerHTML += card;
    });

    // Se for Seg/Ter, exibe aviso na Comunidade
    const dia = new Date().getDay();
    if ((dia === 1 || dia === 2) && divComunidade) {
        divComunidade.innerHTML = "<p style='text-align:center; padding:20px; color:#666;'>Aguardando novas sugestões (Quarta-feira)...</p>";
    }
}

// --- 4. FUNÇÃO DO COFRE (SIGILO TOTAL) ---
function criarPautaCofre(textoPrivado) {
    const novaPauta = {
        id: (pautasNitrogenio.length + 1).toString().padStart(3, '0'),
        titulo: textoPrivado,
        status: "COMUNIDADE",
        data: new Date()
    };
    pautasNitrogenio.push(novaPauta);
    motorGovernançaNitrogenio(); // Atualiza o fluxo na hora
}

// --- 5. NAVEGAÇÃO E SPLASH ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 600);
        }, 3000);
    }
    // Inicia o motor assim que abre
    motorGovernançaNitrogenio();
});

function abrirView(viewId) {
    document.getElementById('home-app').style.display = 'none';
    document.querySelectorAll('.area-interna').forEach(a => a.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function fecharView(viewId) {
    document.getElementById(viewId).style.display = 'none';
    document.getElementById('home-app').style.display = 'block';
}

// --- 6. WEB3 & CARTEIRA ---
async function syncWallet() {
    if (!window.ethereum) return alert("Use a MetaMask Browser.");
    try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        userAccount = accounts[0];
        provider = browserProvider;
        signer = await browserProvider.getSigner();
        updateUI();
    } catch (err) { console.error(err); }
}

function updateUI() {
    const btn = document.getElementById('connect-trigger');
    const balanceDisplay = document.querySelector('.balance-amount');
    if (userAccount && btn) {
        btn.innerText = `${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        provider.getBalance(userAccount).then(bal => {
            if (balanceDisplay) balanceDisplay.innerText = `${parseFloat(ethers.formatEther(bal)).toFixed(4)} BNB`;
        });
    }
}
document.getElementById('connect-trigger')?.addEventListener('click', syncWallet);

// --- 7. PAGAMENTOS E QR CODE ---
async function executarPagamento() {
    const valor = document.getElementById('valor-pagar').value.replace(',', '.');
    const destino = document.getElementById('wallet-address').value.trim();
    try {
        const tx = await signer.sendTransaction({ to: destino, value: ethers.parseEther(valor) });
        await tx.wait();
        alert("Sucesso!");
        updateUI();
    } catch (err) { alert("Erro na transação"); }
}

// --- 8. VOTANTE ALPHA (SEM GÁS) ---
async function processarVoto(escolha) {
    try {
        const mensagem = `Protocolo Nitrogênio\nVotação: ${escolha}`;
        const assinatura = await signer.signMessage(mensagem);
        console.log("Voto assinado:", assinatura);
        alert("Voto registrado com sucesso!");
        // Aqui você pode adicionar lógica para esconder o botão de voto
    } catch (error) { console.error(error); }
}
