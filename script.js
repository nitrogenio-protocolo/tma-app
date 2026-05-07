
class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00;
        this.iniciarBotoes();
    }

    async conectar() {
        if (!window.ethereum) return alert("Abra no navegador da sua Carteira!");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            document.getElementById('btn-conectar').innerText = this.account.substring(0,6)+"...";
            this.atualizarSaldo();
        } catch (e) {
            console.error("Erro ao conectar:", e);
        }
    }

    async atualizarSaldo() {
        if(!this.provider || !this.account) return;
        try {
            const s = await this.provider.getBalance(this.account);
            document.getElementById('display-bnb').innerHTML = `${ethers.formatEther(s).substring(0,6)} <span>BNB</span>`;
        } catch (e) {
            console.error("Erro ao carregar saldo:", e);
        }
    }


    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        content.innerHTML = ""; 
        panel.classList.add('active');

        if (tipo === 'receber') {
            title.innerText = "GERAR COBRANÇA";
            content.innerHTML = `
                <div class="converter-box">
                    <small>VALOR (R$)</small>
                    <input type="number" id="v-brl" class="input-brl" placeholder="0,00" inputmode="decimal">
                    <p id="v-bnb" class="label-bnb">≈ 0.0000 BNB</p>
                </div>
                <div id="qr-area" style="display:none; margin-top:20px;">
                    <img id="img-qr" style="width:200px; border:10px solid white; border-radius:10px;">
                    <p style="color:#007BFF; font-weight:bold; margin-top:10px; font-size:0.8rem;">APRESENTE O CÓDIGO</p>
                </div>`;
            this.configurarRecebedor();
        } 
        else if (tipo === 'pagar') {
            title.innerText = "PAGAMENTO";
            content.innerHTML = `
                <div class="converter-box" style="position: relative; min-height: 320px;">
                    <div id="reader" style="display:none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 99; background: #000; border-radius: 15px; overflow: hidden;"></div>
                    <small>ENDEREÇO DO DESTINO</small>
                    <input type="text" id="p-addr" class="input-brl" placeholder="0x..." style="font-size: 0.8rem; margin-bottom: 15px;">
                    <small>VALOR EM R$</small>
                    <input type="number" id="p-brl" class="input-brl" placeholder="0.00" inputmode="decimal">
                    <div style="margin-top:25px; display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn-confirm" id="btn-prosseguir-manual" style="background:#28A745;">PROSSEGUIR</button>
                        <button class="btn-confirm" id="btn-usar-camera" style="background:#007BFF; font-size: 0.8rem;">OU LIGAR CÂMERA</button>
                    </div>
                </div>`;
            document.getElementById('btn-usar-camera').onclick = () => {
                document.getElementById('reader').style.display = 'block';
                this.iniciarScanner(); 
            };
            document.getElementById('btn-prosseguir-manual').onclick = () => {
                const addr = document.getElementById('p-addr').value;
                const valorBrl = document.getElementById('p-brl').value; 
                if(addr.length > 20 && valorBrl > 0) {
                    const valorBnb = (parseFloat(valorBrl) / this.cotacaoBNB).toFixed(18);
                    this.prepararPagamento(addr, valorBnb); 
                } else { alert("Insira um endereço e valor válidos."); }
            };
        }
                else if (tipo === 'coletar') {
            title.innerText = "COLETAR TOKEN N";
            content.innerHTML = `
                <div class="converter-box" style="text-align: center;">
                    <img src="raposa.png" alt="Alpha Fox" style="width: 100px; height: 100px; margin: 15px 0; filter: drop-shadow(0 0 10px rgba(0,123,255,0.5));">
                    
                    <p style="color: #666; font-size: 0.9rem; padding: 0 10px;">
                        Como detentor do <strong>NFT ALPHA</strong>, você tem o direito exclusivo de coletar sua participação em <strong>Tokens N</strong>.
                    </p>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                        <small style="color: #007BFF; font-weight: bold;">DISPONÍVEL PARA COLETA</small>
                        <h2 style="color: #333; margin: 5px 0;">0.00 <span style="font-size: 1rem;">N</span></h2>
                    </div>

                    <button class="btn-confirm" id="confirmar-coleta" style="background: #007BFF;">COLETAR AGORA</button>
                    <p style="font-size: 0.7rem; color: #999; margin-top: 10px;">As taxas de rede (Gas) serão pagas em BNB.</p>
                </div>`;
            
            document.getElementById('confirmar-coleta').onclick = () => {
                alert("Conectando ao contrato para reivindicar Tokens N...");
            };
        }
        else if (tipo === 'trocar') {
            title.innerText = "TROCAR (SWAP)";
            content.innerHTML = `
                <div class="converter-box">
                    <div style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong style="color: #856404;">⚠️ AVISO</strong>
                        <p style="font-size: 0.8rem; color: #856404;">Você será levado para a PancakeSwap oficial.</p>
                    </div>
                    <button class="btn-confirm" style="background: #d63384;" id="ir-pancake">IR PARA PANCAKE</button>
                    <button class="btn-confirm" style="background: #6c757d; margin-top: 10px;" onclick="App.fecharFolha()">VOLTAR</button>
                </div>`;
            document.getElementById('ir-pancake').onclick = () => window.open("https://pancakeswap.finance/swap", "_blank");
        }
    }


    configurarRecebedor() {
        const input = document.getElementById('v-brl');
        input.oninput = () => {
            if(!this.account) return;
            const bnb = (input.value / this.cotacaoBNB).toFixed(6);
            document.getElementById('v-bnb').innerText = `≈ ${bnb} BNB`;
            if(input.value > 0) {
                const valorEmWei = ethers.parseEther(bnb).toString();
                const dadosPagamento = `ethereum:${this.account}?value=${valorEmWei}`;
                const link = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dadosPagamento)}`;
                document.getElementById('img-qr').src = link;
                document.getElementById('qr-area').style.display = 'block';
            }
        };
    }

    iniciarScanner() {
        this.scanner = new Html5Qrcode("reader");
        this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
            this.scanner.stop().then(() => {
                this.scanner = null;
                document.getElementById('reader').style.display = 'none';
                let addr = txt.includes(':') ? txt.split(':')[1].split('?')[0] : txt;
                let valor = txt.includes('value=') ? txt.split('value=')[1] : "0";
                if (valor.length > 10) valor = ethers.formatEther(valor);
                this.prepararPagamento(addr, valor);
            });
        }).catch(err => console.error("Scanner Error:", err));
    }

    prepararPagamento(addr, valor) {
        const content = document.getElementById('panel-content');
        content.innerHTML = `
            <div class="converter-box">
                <p style="font-size:0.7rem; color:#666;">DESTINO: ${addr.substring(0,20)}...</p>
                <h2 style="margin:15px 0;">R$ ${(valor * this.cotacaoBNB).toFixed(2)}</h2>
                <p class="label-bnb" style="color:#28A745;">≈ ${valor} BNB</p>
                <button class="btn-confirm" id="confirm-final">CONFIRMAR E ASSINAR</button>
            </div>`;
        document.getElementById('confirm-final').onclick = () => this.executar(addr, valor);
    }


    async executar(para, quanto) {
        try {
            if (!this.signer) await this.conectar();
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x38') return alert("⚠️ Mude para a rede BNB Chain!");
            
            const valorEmWei = ethers.parseUnits(parseFloat(quanto).toFixed(18), "ether");
            const tx = await this.signer.sendTransaction({
                to: para,
                value: valorEmWei,
                gasLimit: 21000 
            });
            alert("Enviado! Aguarde a confirmação...");
            await tx.wait();
            alert("Pagamento Concluído! 🤜🤛");
            location.reload();
        } catch (e) {
            alert("Operação cancelada ou erro de saldo.");
        }
    }

    fecharFolha() {
        if (this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        const panel = document.getElementById('side-panel');
        if (panel) panel.classList.remove('active');
        setTimeout(() => { document.getElementById('panel-content').innerHTML = ""; }, 300);
    }

    iniciarBotoes() {
        const btns = {
            'btn-pagar': 'pagar', 'btn-receber': 'receber', 
            'btn-coletar': 'coletar', 'btn-trocar': 'trocar'
        };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }
        const bc = document.getElementById('btn-conectar');
        if (bc) bc.onclick = () => this.conectar();
        const cp = document.getElementById('close-panel');
        if (cp) cp.onclick = () => this.fecharFolha();
    }
}

const App = new NitrogenDAO();
