/**
 * NITROGÊNIO PROTOCOLO - MOTOR WEB3 (CLASSE OFICIAL)
 * Organizado por classes para facilitar ajustes futuros.
 */

const NitrogenApp = {
    // 1. Peças do Motor (Estado)
    data: {
        provider: null,
        signer: null,
        account: null,
        scanner: null,
        destinoAtual: ""
    },

    // 2. Ignição (Conexão com a Carteira)
    async conectar() {
        if (typeof ethers === 'undefined') {
            alert("Erro: Biblioteca Ethers não carregada. Verifique sua internet.");
            return false;
        }

        if (!window.ethereum) {
            alert("Abra o app dentro da MetaMask ou Trust Wallet!");
            return false;
        }

        try {
            // Inicializa Provider e Signer (Ethers v6)
            this.data.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.data.provider.send("eth_requestAccounts", []);
            
            this.data.account = accounts[0];
            this.data.signer = await this.data.provider.getSigner();

            // Atualiza Interface do Botão
            const btn = document.getElementById('btn-conectar');
            const curta = this.data.account;
            btn.innerText = curta.substring(0,6) + "..." + curta.substring(38);
            btn.style.background = "#28a745"; // Verde Sucesso

            this.atualizarSaldo();
            return true;
        } catch (error) {
            console.error("Erro na conexão:", error);
            alert("Conexão cancelada.");
            return false;
        }
    },

    // 3. Painel (Saldo)
    async atualizarSaldo() {
        if (!this.data.account) return;
        try {
            const saldoWei = await this.data.provider.getBalance(this.data.account);
            const saldoBnb = ethers.formatEther(saldoWei);
            document.getElementById('display-bnb').innerHTML = `${saldoBnb.substring(0, 6)} <span>BNB</span>`;
        } catch (e) {
            console.error("Erro ao ler saldo.");
        }
    },

    // 4. Scanner (Pagar)
    async abrirScanner() {
        // Auto-conectar se estiver desligado
        if (!this.data.account) {
            const ok = await this.conectar();
            if (!ok) return;
        }

        document.getElementById('cam-overlay').style.display = 'block';
        
        this.data.scanner = new Html5Qrcode("reader");
        this.data.scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (txt) => {
                this.data.scanner.stop();
                document.getElementById('cam-overlay').style.display = 'none';
                
                const partes = txt.split(':');
                this.data.destinoAtual = partes[0];
                
                document.getElementById('modal-confirm').style.display = 'block';
                document.getElementById('info-destino').innerText = "DESTINO: " + this.data.destinoAtual;
                document.getElementById('valor-input').value = partes[1] || "";

                if(!partes[1]) setTimeout(() => document.getElementById('valor-input').focus(), 400);
            }
        ).catch(err => alert("Erro na câmera."));
    },

    // 5. O Gatilho (Executar Pagamento)
    async executarPagamento() {
        const valor = document.getElementById('valor-input').value;
        if (!valor || valor <= 0) return alert("Digite o valor.");

        try {
            const tx = await this.data.signer.sendTransaction({
                to: this.data.destinoAtual,
                value: ethers.parseEther(valor)
            });
            alert("Pagamento enviado!");
            this.fecharTudo();
            setTimeout(() => this.atualizarSaldo(), 4000);
        } catch (e) {
            alert("Falha na transação.");
        }
    },

    // 6. Limpeza (Fechar Modais)
    fecharTudo() {
        if (this.data.scanner) {
            try { this.data.scanner.stop(); } catch(e) {}
        }
        document.getElementById('cam-overlay').style.display = 'none';
        document.getElementById('modal-confirm').style.display = 'none';
        document.getElementById('valor-input').value = "";
    }
};

// --- MAPEAMENTO DOS BOTÕES (INTERFACE) ---
// Usamos o NitrogenApp.função para chamar a lógica da classe
document.getElementById('btn-conectar').onclick = () => NitrogenApp.conectar();
document.getElementById('btn-pagar').onclick = () => NitrogenApp.abrirScanner();
document.getElementById('confirmar-pagamento').onclick = () => NitrogenApp.executarPagamento();
document.getElementById('cancelar-pagamento').onclick = () => NitrogenApp.fecharTudo();
document.getElementById('fechar-cam').onclick = () => NitrogenApp.fecharTudo();
