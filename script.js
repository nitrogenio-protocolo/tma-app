// --- VARIÁVEIS GLOBAIS (AS PEÇAS DO MOTOR) ---
let provider, signer, account, scanner;
let destinoAtual = "";

// --- FUNÇÃO 1: LIGAR O MOTOR (CONEXÃO) ---
async function conectar() {
    // Verifica se a biblioteca Ethers carregou corretamente
    if (typeof ethers === 'undefined') {
        alert("Erro: Biblioteca de conexão não carregada. Verifique sua internet.");
        return;
    }

    if (window.ethereum) {
        try {
            // Sintaxe correta para a versão 6 do Ethers
            provider = new ethers.BrowserProvider(window.ethereum);
            
            // Abre o pop-up da carteira para o usuário autorizar
            const accs = await provider.send("eth_requestAccounts", []);
            account = accs[0];
            signer = await provider.getSigner();

            // Atualiza o botão azul: mostra o início e o fim da carteira
            const btn = document.getElementById('btn-conectar');
            btn.innerText = account.substring(0,6) + "..." + account.substring(38);
            btn.style.backgroundColor = "#28a745"; // Cor de "Motor Ligado" (Verde)

            atualizarSaldo();
            return true;
        } catch (e) {
            alert("Conexão recusada ou erro: " + e.message);
            return false;
        }
    } else {
        alert("Abra o app pelo navegador da sua MetaMask ou Trust Wallet!");
        return false;
    }
}

// --- FUNÇÃO 2: PAINEL DE CONTROLE (SALDO BNB) ---
async function atualizarSaldo() {
    if (!account || !provider) return;
    try {
        const saldoWei = await provider.getBalance(account);
        const saldoBnb = ethers.formatEther(saldoWei);
        document.getElementById('display-bnb').innerHTML = saldoBnb.substring(0,6) + " <span>BNB</span>";
    } catch (e) {
        console.error("Falha ao ler saldo:", e);
    }
}

// --- FUNÇÃO 3: ROTA PAGAR (SCANNER + AUTO-CONEXÃO) ---
async function abrirScanner() {
    // Se não estiver conectado, tenta ligar o motor primeiro
    if (!account) {
        const conectado = await conectar();
        if (!conectado) return;
    }

    document.getElementById('cam-overlay').style.display = 'block';
    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (txt) => {
            scanner.stop();
            document.getElementById('cam-overlay').style.display = 'none';
            
            const dados = txt.split(':');
            destinoAtual = dados[0];
            
            document.getElementById('modal-confirm').style.display = 'block';
            document.getElementById('info-destino').innerText = "DESTINO: " + destinoAtual;
            document.getElementById('valor-input').value = dados[1] || "";

            // Foca no teclado se o valor estiver vazio
            if (!dados[1]) {
                setTimeout(() => document.getElementById('valor-input').focus(), 400);
            }
        }
    ).catch(err => alert("Erro na câmera ou permissão negada."));
}

// --- FUNÇÃO 4: LIMPAR A SALA (RESET/FECHAR TUDO) ---
function fecharTudo() {
    if (scanner) {
        try { scanner.stop(); } catch(e) {}
    }
    document.getElementById('cam-overlay').style.display = 'none';
    document.getElementById('modal-confirm').style.display = 'none';
    document.getElementById('valor-input').value = "";
    destinoAtual = "";
}

// --- FUNÇÃO 5: O GATILHO FINAL (ENVIAR BNB) ---
async function executarPagamento() {
    const valor = document.getElementById('valor-input').value;
    if (!valor || valor <= 0) return alert("Digite um valor válido!");

    try {
        const tx = await signer.sendTransaction({
            to: destinoAtual,
            value: ethers.parseEther(valor)
        });
        
        alert("Transação enviada! Aguarde a confirmação na rede.");
        fecharTudo();
        setTimeout(atualizarSaldo, 4000); // Atualiza saldo após 4 segundos
    } catch (e) {
        alert("Erro no envio ou ação cancelada.");
    }
}

// --- MAPEAMENTO DOS BOTÕES (INTERFACE) ---
document.getElementById('btn-conectar').onclick = conectar;
document.getElementById('btn-pagar').onclick = abrirScanner;
document.getElementById('confirmar-pagamento').onclick = executarPagamento;
document.getElementById('cancelar-pagamento').onclick = fecharTudo;
document.getElementById('fechar-cam').onclick = fecharTudo;
