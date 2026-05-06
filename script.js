/**
 * NITROGÊNIO PROTOCOLO - MOTOR WEB3 OFICIAL
 */

class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.destinoAtual = "";
        
        this.iniciarBotoes();
    }

    // --- CONTROLE DA FOLHA LATERAL ---
    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const title = document.getElementById('panel-title');
        const content = document.getElementById('panel-content');
        
        panel.classList.add('active');

        // Conteúdo dinâmico para os 4 botões
        if (tipo === 'pagar') {
            title.innerText = "SISTEMA DE PAGAMENTO";
            content.innerHTML = `
                <p style="margin-bottom:20px;">Use o scanner para ler o QR Code de destino.</p>
                <button class="btn-confirm" id="iniciar-scan-flow">ABRIR CÂMERA</button>
            `;
            // Liga o botão de dentro da folha à função de scanner original
            document.getElementById('iniciar-scan-flow').onclick = () => this.abrirScanner();
        } 
        else if (tipo === 'receber') {
            title.innerText = "RECEBER NITROGÊNIO";
            content.innerHTML = `
                <p>Seu endereço de carteira:</p>
                <div style="background:#eee; padding:15px; border-radius:10px; word-break:break-all; margin:15px 0; font-size:0.8rem;">
                    ${this.account || "Conecte sua carteira primeiro"}
                </div>
                <button class="btn-confirm" onclick="navigator.clipboard.writeText('${this.account}')">COPIAR ENDEREÇO</button>
            `;
        }
        else if (tipo === 'coletar') {
            title.innerText = "COLETAR RECOMPENSAS";
            content.innerHTML = `<p>Não há recompensas disponíveis para coleta no momento.</p>`;
        }
        else if (tipo === 'trocar') {
            title.innerText = "TROCAR TOKENS (SWAP)";
            content.innerHTML = `<p>O sistema de troca direta está em manutenção.</p>`;
        }
    }

    fecharFolha() {
        document.getElementById('side-panel').classList.remove('active');
    }

    // --- FUNÇÕES WEB3 (MANTIDAS ORIGINAIS) ---
    async conectar() {
        if (!window.ethereum) return alert("Abra no app da carteira.");
        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await this.provider.send("eth_requestAccounts", []);
            this.account = accounts[0];
            this.signer = await this.provider.getSigner();

            const btn = document.getElementById('btn-conectar');
            btn.innerText = this.account.substring(0,6) + "..." + this.account.substring(38);
            btn.style.background = "#28a745";

            this.atualizarSaldo();
            return true;
        } catch (e) { return false; }
    }

    async atualizarSaldo() {
        if (!this.account) return;
        try {
            const saldoWei = await this.provider.getBalance(this.account);
            const saldoBnb = ethers.formatEther(saldoWei);
            document.getElementById('display-bnb').innerHTML = `${saldoBnb.substring(0, 6)} <span>BNB</span>`;
        } catch (e) { console.error("Erro no saldo."); }
    }

    async abrirScanner() {
        if (!this.account) {
            const ok = await this.conectar();
            if (!ok) return;
        }
        this.fecharFolha(); // Fecha a folha para mostrar a câmera em tela cheia
        const overlay = document.getElementById('cam-overlay');
        overlay.style.display = 'flex'; 
        this.scanner = new Html5Qrcode("reader");

        this.scanner.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } }, 
            (txt) => {
                this.fecharTudo();
                const partes = txt.split(':');
                this.destinoAtual = partes[0];
                document.getElementById('modal-confirm').style.display = 'block';
                document.getElementById('info-destino').innerText = "DESTINO: " + this.destinoAtual;
                const input = document.getElementById('valor-input');
                input.value = partes[1] || "";
                setTimeout(() => input.focus(), 500); 
            }
        ).catch(err => {
            alert("Erro na câmera.");
            this.fecharTudo();
        });
    }

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

    fecharTudo() {
        if (this.scanner) { try { this.scanner.stop(); } catch(e) {} }
        document.getElementById('cam-overlay').style.display = 'none';
        document.getElementById('modal-confirm').style.display = 'none';
        this.fecharFolha();
    }

    iniciarBotoes() {
        // Botões da Home chamando a Folha
        document.getElementById('btn-pagar').onclick = () => this.abrirFolha('pagar');
        document.getElementById('btn-receber').onclick = () => this.abrirFolha('receber');
        document.getElementById('btn-coletar').onclick = () => this.abrirFolha('coletar');
        document.getElementById('btn-trocar').onclick = () => this.abrirFolha('trocar');

        // Botão Conectar
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        
        // Fechamento e Confirmação
        document.getElementById('close-panel').onclick = () => this.fecharFolha();
        document.getElementById('confirmar-pagamento').onclick = () => this.executar();
        document.getElementById('cancelar-pagamento').onclick = () => this.fecharTudo();
        document.getElementById('fechar-cam').onclick = () => this.fecharTudo();
    }
}

const App = new NitrogenDAO();
