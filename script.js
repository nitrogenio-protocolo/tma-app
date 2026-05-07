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
                } else {
                    alert("Por favor, insira um endereço válido e o valor em Reais.");
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
            
            // 1. Calcula a fração de BNB baseada nos Reais digitados
            const bnb = (input.value / this.cotacaoBNB).toFixed(6);
            document.getElementById('v-bnb').innerText = `≈ ${bnb} BNB`;
            
            if(input.value > 0) {
                // 2. Cria o link no padrão universal Web3 (ethereum:endereço?value=valor)
                // O valor é convertido para Wei (unidade mínima) para evitar erros de leitura
                const valorEmWei = ethers.parseEther(bnb).toString();
                const dadosPagamento = `ethereum:${this.account}?value=${valorEmWei}`;
                
                // 3. Gera o QR Code com o link formatado corretamente
                const link = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dadosPagamento)}`;
                
                document.getElementById('img-qr').src = link;
                document.getElementById('qr-area').style.display = 'block';
            }
        };
    }

    iniciarScanner() {
    this.scanner = new Html5Qrcode("reader");
    this.scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (txt) => {
        console.log("QR Code lido:", txt);

        // Limpa o scanner e fecha a câmera
        this.scanner.stop().then(() => {
            this.scanner = null;
            document.getElementById('reader').style.display = 'none';

            let addr = "";
            let valor = "0";

            // Lógica para capturar endereço e valor do link ethereum:0x.../transfer?value=...
            if (txt.includes(':')) {
                const partePrincipal = txt.split(':')[1]; // Pega o que vem depois de 'ethereum:'
                if (partePrincipal.includes('?')) {
                    addr = partePrincipal.split('?')[0];
                    const params = new URLSearchParams(partePrincipal.split('?')[1]);
                    valor = params.get('value') || "0";
                } else {
                    addr = partePrincipal;
                }
            } else {
                addr = txt;
            }

            // Se o valor vier em Wei (número muito grande), converte para decimal
            if (valor.length > 10) {
                valor = ethers.formatEther(valor);
            }

            console.log("Processado -> Addr:", addr, "Valor:", valor);
            this.prepararPagamento(addr, valor);
        });
    }).catch(err => console.error("Erro no scanner:", err));
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

    else if (tipo === 'coletar') {
            title.innerText = "COLETAR TAXAS";
            content.innerHTML = `
                <div class="converter-box" style="text-align: center;">
                    <div style="font-size: 3rem; margin: 15px 0;">💎</div>
                    <p style="color: #666; font-size: 0.9rem;">
                        Como detentor do <strong>NFT ALPHA</strong>, você tem o direito exclusivo de coletar o gás acumulado.
                    </p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <small>DISPONÍVEL AGORA</small>
                        <h2 style="color: #007BFF; margin: 5px 0;">0.0000 BNB</h2>
                    </div>
                    <button class="btn-confirm" id="confirmar-coleta">COLETAR GÁS AGORA</button>
                </div>`;
            
            document.getElementById('confirmar-coleta').onclick = () => {
                alert("Chamando contrato para coletar taxas...");
            };
        }

        else if (tipo === 'trocar') {
            title.innerText = "TROCAR (SWAP)";
            content.innerHTML = `
                <div class="converter-box">
                    <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong style="color: #856404;">⚠️ AVISO IMPORTANTE</strong>
                        <p style="font-size: 0.8rem; color: #856404; margin-top: 5px;">
                            Você será levado para a <strong>PancakeSwap</strong> para trocar seus tokens. Verifique sempre o endereço do site para sua segurança.
                        </p>
                    </div>
                    <p style="font-size: 0.9rem; margin-bottom: 25px;">Deseja sair do DApp para realizar a troca na rede BNB Chain?</p>
                    <button class="btn-confirm" style="background: #d63384;" id="ir-pancake">SIM, IR PARA PANCAKE</button>
                    <button class="btn-confirm" style="background: #6c757d; margin-top: 10px;" onclick="App.fecharFolha()">VOLTAR</button>
                </div>`;

            document.getElementById('ir-pancake').onclick = () => {
                window.open("https://pancakeswap.finance/swap", "_blank");
            };
        }
    
    async executar(para, quanto) {
    try {
        if (!this.signer || !this.account) {
            await this.conectar();
        }

        // 1. VERIFICAÇÃO DE REDE USANDO O PADRÃO DO SEU PRINT (0x38)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x38') { 
            alert("⚠️ Mude para a rede BNB Chain!");
            return;
        }

        // 2. PREPARAÇÃO DO VALOR (Garante que o número vire Wei corretamente)
        const valorEmWei = ethers.parseUnits(parseFloat(quanto).toFixed(18), "ether");

        console.log("Enviando para:", para, "Valor:", valorEmWei.toString());

        // 3. CHAMADA DA CARTEIRA
        // Adicionando o gasLimit manual para o popup abrir sem erro no celular
        const tx = await this.signer.sendTransaction({
            to: para,
            value: valorEmWei,
            gasLimit: 21000 
        });

        alert("Transação enviada! Aguarde a rede confirmar...");
        await tx.wait();
        
        alert("Pagamento Concluído! 🤜🤛");
        location.reload();

    } catch (e) {
        console.error("Erro na transação:", e);
        if (e.code === 4001 || e.code === 'ACTION_REJECTED') {
            alert("Pagamento cancelado pelo usuário.");
        } else {
            alert("Erro na Carteira. Verifique se você tem BNB para a taxa!");
        }
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
        const btnPagar = document.getElementById('btn-pagar');
        const btnReceber = document.getElementById('btn-receber');
        if (btnPagar) btnPagar.onclick = () => this.abrirFolha('pagar');
        if (btnReceber) btnReceber.onclick = () => this.abrirFolha('receber');
        const btnColetar = document.getElementById('btn-coletar');
        const btnTrocar = document.getElementById('btn-trocar');
        if (btnColetar) btnColetar.onclick = () => this.abrirFolha('coletar');
        if (btnTrocar) btnTrocar.onclick = () => this.abrirFolha('trocar');
        const btnConectar = document.getElementById('btn-conectar');
        const btnFechar = document.getElementById('close-panel');
        if (btnConectar) btnConectar.onclick = () => this.conectar();
        if (btnFechar) btnFechar.onclick = () => this.fecharFolha();
    }
}
const App = new NitrogenDAO();
