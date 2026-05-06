/**
 * NITROGÊNIO PROTOCOLO - MOTOR WEB3 OFICIAL
 * Foco: Botão Conectar e Pagar Funcional
 */

class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.destinoAtual = "";
        
        // Liga os botões ao carregar o arquivo
        this.iniciarBotoes();
    }

    // --- FUNÇÃO 1: CONECTAR (IGNIÇÃO) ---
    async conectar() {
        // Verifica se a biblioteca carregou (Combustível)
        if (typeof window.ethers === 'undefined') {
            alert("Erro: Biblioteca Ethers não carregada. Recarregue a página.");
            return false;
        }

        // Verifica se está no navegador da carteira
        if (!window.ethereum) {
            alert("Abra o app dentro da MetaMask ou Trust Wallet.");
            return false;
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.provider.send("eth_requestAccounts", []);
            this.account = accounts[0];
            this.signer = await this.provider.getSigner();

            // Atualiza Interface
            const btn = document.getElementById('btn-conectar');
            btn.innerText = this.account.substring(0,6) + "..." + this.account.substring(38);
            btn.style.background = "#28a745"; // Verde Sucesso

            this.atualizarSaldo();
            return true;
        } catch (e) {
            alert("Conexão cancelada pelo usuário.");
            return false;
        }
    }

    // --- FUNÇÃO 2: SALDO (PAINEL) ---
    async atualizarSaldo() {
        if (!this.account) return;
        try {
            const saldoWei = await this.provider.getBalance(this.account);
            const saldoBnb = ethers.formatEther(saldoWei);
            document.getElementById('display-bnb').innerHTML = `${saldoBnb.substring(0, 6)} <span>BNB</span>`;
        } catch (e) { console.error("Erro no saldo."); }
    }

    // --- FUNÇÃO 3: PAGAR (SCANNER) 
            async abrirScanner() {
        if (!this.account) {
            const ok = await this.conectar();
            if (!ok) return;
        }

        const overlay = document.getElementById('cam-overlay');
        overlay.style.display = 'flex'; // Mudamos para flex para centralizar
        
        this.scanner = new Html5Qrcode("reader");

        this.scanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } }, // Centraliza o foco
            (txt) => {
                this.fecharTudo(); // Fecha tudo ao ler com sucesso
                
                const partes = txt.split(':');
                this.destinoAtual = partes[0];
                
                document.getElementById('modal-confirm').style.display = 'block';
                document.getElementById('info-destino').innerText = "DESTINO: " + this.destinoAtual;
                document.getElementById('valor-input').value = partes[1] || "";
            }
        ).catch(err => {
            alert("Erro na câmera: Certifique-se de dar permissão.");
            this.fecharTudo();
        });
    }

        document.getElementById('cam-overlay').style.display = 'block';
        this.scanner = new Html5Qrcode("reader");

        this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
            this.scanner.stop();
            document.getElementById('cam-overlay').style.display = 'none';
            
            const partes = txt.split(':');
            this.destinoAtual = partes[0];
            
            document.getElementById('modal-confirm').style.display = 'block';
            document.getElementById('info-destino').innerText = "DESTINO: " + this.destinoAtual;
            document.getElementById('valor-input').value = partes[1] || "";

            if(!partes[1]) setTimeout(() => document.getElementById('valor-input').focus(), 400);
        }).catch(err => alert("Câmera não disponível."));
    }

    // --- FUNÇÃO 4: EXECUTAR (GATILHO) ---
    async executar() {
        const valor = document.getElementById('valor-input').value;
        if (!valor || valor <= 0) return alert("Digite um valor.");

        try {
            const tx = await this.signer.sendTransaction({
                to: this.destinoAtual,
                value: ethers.parseEther(valor)
            });
            alert("Enviado com sucesso!");
            this.fecharTudo();
            setTimeout(() => this.atualizarSaldo(), 4000);
        } catch (e) { alert("Transação falhou."); }
    }

    // --- FUNÇÃO 5: LIMPEZA ---
    fecharTudo() {
        if (this.scanner) { try { this.scanner.stop(); } catch(e) {} }
        document.getElementById('cam-overlay').style.display = 'none';
        document.getElementById('modal-confirm').style.display = 'none';
    }

    // --- MAPEAMENTO (FIAÇÃO) ---
    iniciarBotoes() {
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        document.getElementById('btn-pagar').onclick = () => this.abrirScanner();
        document.getElementById('confirmar-pagamento').onclick = () => this.executar();
        document.getElementById('cancelar-pagamento').onclick = () => this.fecharTudo();
        document.getElementById('fechar-cam').onclick = () => this.fecharTudo();
    }
}

// Inicia o App
const App = new NitrogenDAO();
