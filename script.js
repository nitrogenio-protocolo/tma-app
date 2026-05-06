class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.destinoAtual = "";
        this.cotacaoBNB = 3400.00; 
        
        this.iniciarBotoes();
    }

    async buscarPrecoBNB() {
        try {
            const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL");
            const data = await res.json();
            this.cotacaoBNB = parseFloat(data.price);
        } catch (e) { console.log("Erro cotação: " + e); }
    }

    abrirFolha(tipo) {
        this.buscarPrecoBNB();
        const panel = document.getElementById('side-panel');
        const title = document.getElementById('panel-title');
        const content = document.getElementById('panel-content');
        
        content.innerHTML = ""; // Limpa dados ao entrar
        panel.classList.add('active');

        if (tipo === 'pagar') {
            title.innerText = "ESCANEAR E PAGAR";
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
            title.innerText = "GERAR COBRANÇA";
            content.innerHTML = `
                <div class="converter-box">
                    <small>DEFINIR VALOR (R$)</small>
                    <input type="number" id="valor-cobrar" class="input-brl" placeholder="0,00" inputmode="decimal">
                    <span id="bnb-preview" class="label-bnb">≈ 0.0000 BNB</span>
                </div>
                <div id="qr-area" style="margin-top:20px; display:none;">
                    <div style="background:white; padding:15px; border-radius:15px; display:inline-block; border: 2px solid #EEE;">
                        <img id="qr-gerado" src="" style="width:200px; height:200px;">
                    </div>
                    <p style="font-size:0.75rem; color:var(--blue); font-weight:bold; margin-top:10px;">MOSTRAR QR CODE</p>
                </div>
            `;
            this.gerenciarGerador();
        } else {
            title.innerText = tipo.toUpperCase();
            content.innerHTML = `<p style="margin-top:50px; color:#AAA;">Módulo ${tipo} em manutenção.</p>`;
        }
    }

    gerenciarGerador() {
        const input = document.getElementById('valor-cobrar');
        input.oninput = () => {
            if(!this.account) return alert("Conecte a carteira primeiro!");
            const bnb = (input.value / this.cotacaoBNB).toFixed(6);
            document.getElementById('bnb-preview').innerText = `≈ ${bnb} BNB`;
            if(input.value > 0) {
                const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.account}:${bnb}`;
                document.getElementById('qr-gerado').src = qrLink;
                document.getElementById('qr-area').style.display = 'block';
            }
        };
    }

    iniciarScanner() {
        this.scanner = new Html5Qrcode("reader-interno");
        this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
            const partes = txt.split(':');
            this.destinoAtual = partes[0];
            const bnbFixo = partes[1];

            document.getElementById('reader-interno').style.display = 'none';
            document.getElementById('area-valor').style.display = 'block';
            document.getElementById('info-dest').innerText = "DESTINO: " + this.destinoAtual;
            
            const input = document.getElementById('input-brl');
            if(bnbFixo) {
                input.value = (bnbFixo * this.cotacaoBNB).toFixed(2);
                input.readOnly = true;
                document.getElementById('label-bnb-calc').innerText = `≈ ${bnbFixo} BNB (VALOR FIXO)`;
            }

            document.getElementById('btn-finalizar').onclick = () => {
                const finalBNB = bnbFixo || (input.value / this.cotacaoBNB);
                this.executar(finalBNB);
            };
        }).catch(() => alert("Erro na câmera"));
    }

    async executar(valor) {
        try {
            const tx = await this.signer.sendTransaction({
                to: this.destinoAtual,
                value: ethers.parseEther(parseFloat(valor).toFixed(18))
            });
            alert("Pagamento enviado!");
            this.fecharFolha();
        } catch (e) { alert("Erro na transação."); }
    }

    fecharFolha() {
        if (this.scanner) { this.scanner.stop().catch(()=>{}); }
        document.getElementById('side-panel').classList.remove('active');
    }

    async conectar() {
        if (!window.ethereum) return alert("Abra na sua carteira!");
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
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        document.getElementById('close-panel').onclick = () => this.fecharFolha();
    }
}
const App = new NitrogenDAO();
