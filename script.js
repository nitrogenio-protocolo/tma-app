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
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.account = accounts[0];
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        document.getElementById('btn-conectar').innerText = this.account.substring(0,6)+"...";
        this.atualizarSaldo();
    }

    async atualizarSaldo() {
        if(!this.provider || !this.account) return;
        const s = await this.provider.getBalance(this.account);
        document.getElementById('display-bnb').innerHTML = `${ethers.formatEther(s).substring(0,6)} <span>BNB</span>`;
    }

    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        // Mata o scanner se ele já estiver rodando antes de abrir outra tela
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
                    <img id="img-qr" style="width:200px; border:10px solid white; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <p style="color:#007BFF; font-weight:bold; margin-top:10px; font-size:0.8rem;">APRESENTE O CÓDIGO</p>
                </div>`;
            this.configurarRecebedor();
        } 
        else if (tipo === 'pagar') {
            title.innerText = "PAGAMENTO";
            content.innerHTML = `
                <div class="converter-box">
                    <small>ENDEREÇO DO DESTINO</small>
                    <input type="text" id="p-addr" class="input-brl" placeholder="0x..." style="font-size: 0.8rem; margin-bottom: 15px;">
                    
                    <small>VALOR EM R$</small>
                    <input type="number" id="p-valor" class="input-brl" placeholder="0.00" inputmode="decimal">
                    
                    <div style="margin-top:25px; display: flex; flex-direction: column; gap: 10px;">
                        <button class="btn-confirm" id="btn-prosseguir-manual" style="background:#28A745;">PROSSEGUIR</button>
                        <button class="btn-confirm" id="btn-usar-camera" style="background:#007BFF; font-size: 0.8rem;">OU LIGAR CÂMERA</button>
                    </div>

                    <div id="reader" style="width:100%; border-radius:15px; overflow:hidden; background:#000; margin-top:20px; display:none;"></div>
                </div>`;

            // AÇÃO: Se clicar em ligar câmera, aí sim ativa o hardware
            document.getElementById('btn-usar-camera').onclick = () => {
                document.getElementById('reader').style.display = 'block';
                this.iniciarScanner(); 
            };

            // AÇÃO: Se preencher manual e clicar em prosseguir
            document.getElementById('btn-prosseguir-manual').onclick = () => {
                const addr = document.getElementById('p-addr').value;
                const valorBrl = document.getElementById('p-brl').value; // Referência ao ID do input de Reais
if(addr.length > 20 && valorBrl > 0) {
    // Aqui fazemos a conversão: Real dividido pelo preço do BNB
    const valorBnb = (valorBrl / this.cotacaoBNB).toFixed(18);
    
    // Agora enviamos o valor já convertido para a função de pagamento
    this.prepararPagamento(addr, valorBnb); 
                } else {
                    alert("Por favor, insira um endereço válido e o valor.");
                }
            };
        }
            else {
            title.innerText = tipo.toUpperCase();
            content.innerHTML = `<p style="margin-top:50px; color:#AAA;">Módulo ${tipo} em manutenção.</p>`;
        }
    }

    configurarRecebedor() {
        const input = document.getElementById('v-brl');
        input.oninput = () => {
            if(!this.account) { alert("Conecte a carteira primeiro!"); return; }
            const bnb = (input.value / this.cotacaoBNB).toFixed(6);
            document.getElementById('v-bnb').innerText = `≈ ${bnb} BNB`;
            if(input.value > 0) {
                const link = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${this.account}:${bnb}`;
                document.getElementById('img-qr').src = link;
                document.getElementById('qr-area').style.display = 'block';
            }
        };
    }

    iniciarScanner() {
        this.scanner = new Html5Qrcode("reader");
        this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
            const [addr, valor] = txt.split(':');
            // IMPORTANTE: Para o scanner antes de processar o pagamento
            this.scanner.stop().then(() => { 
                this.scanner = null;
                this.prepararPagamento(addr, valor); 
            });
        }).catch(() => alert("Câmera não disponível"));
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
            // Tapa o "furo" da carteira dormindo
            if (!this.signer) await this.conectar();
            
            // Força a chamada do popup
            const tx = await this.signer.sendTransaction({
                to: para,
                value: ethers.parseUnits(parseFloat(quanto).toFixed(18), "ether")
            });
            
            alert("Transação enviada! Aguardando rede...");
            await tx.wait();
            alert("Sucesso!");
            location.reload(); // Limpa tudo e atualiza saldo
        } catch (e) {
            alert("Erro: " + (e.reason || "Verifique seu saldo e conexão"));
        }
    }

    fecharFolha() {
        // 1. Se o scanner estiver ligado, desliga ele primeiro
        if (this.scanner) {
            this.scanner.stop().then(() => {
                this.scanner = null; // Limpa a memória
                console.log("Câmera encerrada com sucesso.");
            }).catch(e => console.log("Câmera já estava desligada."));
        }

        // 2. Remove a classe active para esconder o painel lateral
        const panel = document.getElementById('side-panel');
        if (panel) {
            panel.classList.remove('active');
        }

        // 3. Limpa o conteúdo para a próxima vez abrir "neutro"
        setTimeout(() => {
            document.getElementById('panel-content').innerHTML = "";
        }, 300); // Espera a animação de fechar terminar
    }

    iniciarBotoes() {
        document.getElementById('btn-pagar').onclick = () => this.abrirFolha('pagar');
        document.getElementById('btn-receber').onclick = () => this.abrirFolha('receber');
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        document.getElementById('close-panel').onclick = () => this.fecharFolha();
    }
}
const App = new NitrogenDAO();
