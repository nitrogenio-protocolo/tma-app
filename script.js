class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.destinoAtual = "";
        this.cotacaoBNB = 3300.00; // Valor base
        
        this.iniciarBotoes();
    }

    async buscarPrecoBNB() {
        try {
            const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL");
            const data = await res.json();
            this.cotacaoBNB = parseFloat(data.price);
        } catch (e) { console.log("Usando cotação offline"); }
    }

    abrirFolha(tipo) {
        this.buscarPrecoBNB();
        const panel = document.getElementById('side-panel');
        const title = document.getElementById('panel-title');
        const content = document.getElementById('panel-content');
        
        content.innerHTML = ""; // Limpa a sala antes de entrar
        panel.classList.add('active');

        if (tipo === 'pagar') {
            title.innerText = "PAGAR EM BNB";
            content.innerHTML = `
                <div id="reader-interno" style="width:100%; border-radius:15px; overflow:hidden; background:#000; min-height:250px;"></div>
                <div id="area-valor" style="display:none; margin-top:15px;">
                    <p id="info-dest" style="font-size:0.7rem; color:#666; margin-bottom:10px;"></p>
                    <div class="converter-box">
                        <small>VALOR EM R$</small>
                        <input type="number" id="input-brl" class="input-brl" placeholder="0,00" inputmode="decimal">
                        <span id="label-bnb-calc" class="label-bnb">≈ 0.000000 BNB</span>
                    </div>
                    <button class="btn-confirm" id="btn-finalizar">CONFIRMAR E ASSINAR</button>
                </div>
            `;
            this.iniciarScanner();
        } 
        else if (tipo === 'receber') {
            title.innerText = "MEU ENDEREÇO";
            const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.account}`;
            content.innerHTML = `
                <div style="background:white; padding:20px; border-radius:20px; display:inline-block;">
                    <img src="${this.account ? qrLink : ''}" style="width:200px; height:200px; background:#eee;">
                </div>
                <p style="margin-top:15px; font-size:0.8rem; word-break:break-all; color:#666;">${this.account || "Conecte sua carteira"}</p>
                <button class="btn-confirm" onclick="navigator.clipboard.writeText('${this.account}')">COPIAR</button>
            `;
        }
        else {
            title.innerText = tipo.toUpperCase();
            content.innerHTML = `<p style="margin-top:50px; color:#AAA;">Módulo ${tipo} em manutenção.</p>`;
        }
    }

    iniciarScanner() {
        this.scanner = new Html5Qrcode("reader-interno");
        this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
            this.destinoAtual = txt.split(':')[0];
            document.getElementById('reader-interno').style.display = 'none';
            document.getElementById('area-valor').style.display = 'block';
            document.getElementById('info-dest').innerText = "DESTINO: " + this.destinoAtual;
            
            const input = document.getElementById('input-brl');
            input.oninput = () => {
                const bnb = input.value / this.cotacaoBNB;
                document.getElementById('label-bnb-calc').innerText = `≈ ${bnb.toFixed(6)} BNB`;
            };
            document.getElementById('btn-finalizar').onclick = () => this.executar(input.value / this.cotacaoBNB);
        }).catch(e => alert("Erro na câmera"));
    }

    async executar(valorBNB) {
        if (!valorBNB || valorBNB <= 0) return alert("Digite um valor");
        try {
            const tx = await this.signer.sendTransaction({
                to: this.destinoAtual,
                value: ethers.parseEther(valorBNB.toFixed(18))
            });
            alert("Sucesso! Enviado.");
            this.fecharFolha();
        } catch (e) { alert("Falha na transação"); }
    }

    fecharFolha() {
        if (this.scanner) { this.scanner.stop().catch(()=>{}); }
        document.getElementById('side-panel').classList.remove('active');
        // Limpeza garantida: o abrirFolha já limpa o conteúdo ao entrar
    }

    async conectar() {
        if (!window.ethereum) return alert("Use a MetaMask/iFood Wallet");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.account = accounts[0];
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        document.getElementById('btn-conectar').innerText = this.account.substring(0,6)+"...";
        this.atualizarSaldo();
    }

    async atualizarSaldo() {
        const saldo = await this.provider.getBalance(this.account);
        document.getElementById('display-bnb').innerHTML = `${ethers.formatEther(saldo).substring(0,6)} <span>BNB</span>`;
    }

    iniciarBotoes() {
        document.getElementById('btn-pagar').onclick = () => this.abrirFolha('pagar');
        document.getElementById('btn-receber').onclick = () => this.abrirFolha('receber');
        document.getElementById('btn-coletar').onclick = () => this.abrirFolha('coletar');
        document.getElementById('btn-trocar').onclick = () => this.abrirFolha('trocar');
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        document.getElementById('close-panel').onclick = () => this.fecharFolha();
    }
}
const App = new NitrogenDAO();
