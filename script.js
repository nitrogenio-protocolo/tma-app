let provider, signer, account, scanner;
let destinoAtual = "";

/// --- FUNÇÃO 1: LIGAR O MOTOR (CONEXÃO) ---
async function conectar() {
    console.log("Tentando ligar o motor...");
    
    if (window.ethereum) {
        try {
            // Cria a conexão com a carteira
            provider = new ethers.BrowserProvider(window.ethereum);
            
            // Pede para o usuário escolher a conta (abre o pop-up da carteira)
            const accs = await provider.send("eth_requestAccounts", []);
            
            account = accs[0];
            signer = await provider.getSigner();
            
            // Muda o texto do botão para mostrar que deu certo
            document.getElementById('btn-conectar').innerText = account.substring(0,6)+"..."+account.substring(38);
            document.getElementById('btn-conectar').style.background = "#28a745"; // Fica verde (sucesso)
            
            console.log("Motor ligado: " + account);
            atualizarSaldo();
            return true;
        } catch (e) {
            alert("Você cancelou a conexão ou houve um erro: " + e.message);
            return false;
        }
    } else {
        // Se cair aqui, é porque o usuário não abriu pelo navegador da carteira
        alert("ALERTA: Para o botão funcionar, você deve abrir o site 'nitrogenio-protocolo.github.io' dentro do navegador da sua Trust Wallet ou MetaMask.");
        return false;
    }
}

// --- FUNÇÃO 2: PAINEL DE CONTROLE (SALDO) ---
async function atualizarSaldo() {
    if(!account) return;
    try {
        const b = await provider.getBalance(account);
        document.getElementById('display-bnb').innerHTML = ethers.formatEther(b).substring(0,6) + " <span>BNB</span>";
    } catch (e) {
        console.error("Erro ao buscar saldo:", e);
    }
}

// --- FUNÇÃO 3: ROTA PAGAR (SCANNER + AUTO-CONECTAR) ---
async function abrirScanner() {
    // Se não estiver conectado, tenta conectar primeiro sem dar erro (Estilo Banco)
    if(!account) {
        const conectadoAgora = await conectar();
        if(!conectadoAgora) return; // Para se o usuário recusar a conexão
    }

    document.getElementById('cam-overlay').style.display = 'block';
    
    scanner = new Html5Qrcode("reader");
    
    scanner.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: 250 }, 
        (txt) => {
            // SUCESSO NA LEITURA
            scanner.stop();
            document.getElementById('cam-overlay').style.display = 'none';
            
            const p = txt.split(':');
            destinoAtual = p[0];
            
            document.getElementById('modal-confirm').style.display = 'block';
            document.getElementById('info-destino').innerText = "DESTINO: " + destinoAtual;
            document.getElementById('valor-input').value = p[1] || "";

            // Se não houver valor no QR Code, abre o teclado automaticamente
            if(!p[1]) {
                setTimeout(() => {
                    document.getElementById('valor-input').focus();
                }, 400); 
            }
        }
    ).catch(err => alert("Câmera não disponível ou permissão negada."));
}

// --- FUNÇÃO 4: LIMPAR A SALA (RESET DE SEGURANÇA) ---
function fecharTudo() {
    if(scanner) {
        try { scanner.stop(); } catch(e) {}
    }
    document.getElementById('cam-overlay').style.display = 'none';
    document.getElementById('modal-confirm').style.display = 'none';
    document.getElementById('valor-input').value = "";
    destinoAtual = "";
}

// --- FUNÇÃO 5: O GATILHO FINAL (TRANSAÇÃO REAL) ---
async function executar() {
    const v = document.getElementById('valor-input').value;
    if(!v || v <= 0) return alert("Digite um valor válido!");

    try {
        // Camada de segurança: Pede autorização biométrica na carteira
        const tx = await signer.sendTransaction({ 
            to: destinoAtual, 
            value: ethers.parseEther(v) 
        });
        
        alert("Enviado com sucesso!");
        fecharTudo();
        setTimeout(atualizarSaldo, 3000);
    } catch(e) {
        alert("Ação cancelada pelo usuário ou erro no envio.");
    }
}

// --- MAPEAMENTO DOS BOTÕES ---
document.getElementById('btn-conectar').onclick = conectar;
document.getElementById('btn-pagar').onclick = abrirScanner;
document.getElementById('confirmar-pagamento').onclick = executar;
document.getElementById('cancelar-pagamento').onclick = fecharTudo;
document.getElementById('fechar-cam').onclick = fecharTudo;
