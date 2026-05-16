class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00; 
        this.ultimaAtualizacao = 0;
        
        // --- CONFIGURAÇÃO DO CONTRATO DE COLETA ---
        // Quando seu contrato estiver pronto na Mainnet, é só colar o endereço dele aqui.
        // Enquanto estiver zerado, o sistema vai ignorar a trava e deixar o botão ativo por padrão.
        this.enderecoContrato = "0x0000000000000000000000000000000000000000"; 
        
        // Propriedades de controle da Splash Screen originais
        this.readAccepted = false;
        this.agreeAccepted = false;
        
        this.iniciarBotoes();
        this.iniciarAutomacao();
        this.verificarSplashInicial();
    }

    // --- MÉTODOS DA SPLASH SCREEN ---

    verificarSplashInicial() {
        if (localStorage.getItem('nitrogenio_terms_accepted') === 'true') {
            const splash = document.getElementById('splash-screen');
            if (splash) {
                splash.style.display = 'none';
            }
        }
    }

    nextSplashSlide() {
        const slide1 = document.getElementById('slide-1');
        const slide2 = document.getElementById('slide-2');
        
        if (slide1 && slide2) {
            slide1.classList.remove('active');
            slide2.classList.add('active');
        }
    }

    toggleRead() {
        const btn = document.getElementById('btn-read');
        this.readAccepted = !this.readAccepted;
        
        if (btn) {
            if (this.readAccepted) {
                btn.classList.add('checked');
            } else {
                btn.classList.remove('checked');
            }
        }
        this.validateRulesForm();
    }

    toggleAgree() {
        const btn = document.getElementById('btn-agree');
        this.agreeAccepted = !this.agreeAccepted;
        
        if (btn) {
            if (this.agreeAccepted) {
                btn.classList.add('checked');
            } else {
                btn.classList.remove('checked');
            }
        }
        this.validateRulesForm();
    }

    validateRulesForm() {
        const btnEnter = document.getElementById('btn-enter-home');
        
        if (btnEnter) {
            if (this.readAccepted && this.agreeAccepted) {
                btnEnter.removeAttribute('disabled');
                btnEnter.className = 'btn-activated';
            } else {
                btnEnter.setAttribute('disabled', 'true');
                btnEnter.className = 'btn-disabled';
            }
        }
    }

    finishSplash() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
        }
        localStorage.setItem('nitrogenio_terms_accepted', 'true');
    }

    // --- MÉTODOS DE CONEXÃO E MONITORAÇÃO DE CARTEIRA ---
    
    async conectar() {
        if (!window.ethereum) {
            return alert("Por favor, use o navegador da MetaMask ou Trust!");
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.signer = await this.provider.getSigner();
                
                const btn = document.getElementById('btn-conectar');
                if(btn) {
                    btn.innerText = "CONECTADO";
                    btn.classList.add('conectado');
                }
                
                await this.buscarCotacao();
                console.log("Conectado:", this.account);

                // Executa a verificação apenas se tiver um contrato configurado real
                if (this.enderecoContrato && this.enderecoContrato !== "0x0000000000000000000000000000000000000000") {
                    await this.verificarSaldoColeta(this.account);
                }
            }
        } catch (e) { 
            console.error("Erro na conexão:", e);
        }
    }

    async verificarSaldoColeta(carteira) {
        if (!this.provider || !carteira) return;
        
        try {
            const abiMinima = ["function saldoParaColetar(address usuario) public view returns (uint256)"];
            const contrato = new ethers.Contract(this.enderecoContrato, abiMinima, this.provider);
            
            const saldoWei = await contrato.saldoParaColetar(carteira);
            const botaoColetar = document.getElementById('btn-coletar');

            if (botaoColetar) {
                if (saldoWei == 0n) { 
                    botaoColetar.style.opacity = "0.4";
                    botaoColetar.style.pointerEvents = "none";
                    botaoColetar.style.cursor = "not-allowed";
                } else {
                    botaoColetar.style.opacity = "1";
                    botaoColetar.style.pointerEvents = "auto";
                    botaoColetar.style.cursor = "pointer";
                }
            }
        } catch (e) {
            console.error("Erro na leitura do contrato:", e);
        }
    }

    async buscarCotacao() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
            const data = await response.json();
            if (data.price) {
                this.cotacaoBNB = parseFloat(data.price);
                this.ultimaAtualizacao = Date.now();
                this.atualizarSaldo();
            }
        } catch (e) {
            console.error("Falha na cotação.");
        }
    }

    iniciarAutomacao() {
        this.buscarCotacao();
        setInterval(() => this.buscarCotacao(), 70000);
    }

    async atualizarSaldo() {
        if(!this.provider || !this.account) return;
        try {
            const s = await this.provider.getBalance(this.account);
            const saldoBnb = parseFloat(ethers.formatEther(s));
            const saldoReais = saldoBnb * this.cotacaoBNB;
            
            const display = document.getElementById('display-bnb');
            if (display) {
                display.innerHTML = saldoReais.toLocaleString('pt-br', { 
                    style: 'currency', 
                    currency: 'BRL' 
                });
            }
        } catch (e) {
            console.error("Erro ao carregar saldo:", e);
        }
    }

    // --- DIÁLOGOS INTERNOS E INTERFACES DAS FOLHAS LATERAIS ---

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
                    <p id="v-bnb" class="label-bnb" style="font-size:0.7rem; opacity:0.6;">≈ 0.0000 BNB</p>
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
                <div class="card-pagamento-fixo">
                    <div id="reader" style="display:none;"></div>
                    <div id="info-pagamento">
                        <small class="label-clean">ENDEREÇO DO DESTINO</small>
                        <input type="text" id="p-addr" class="txt-destino" placeholder="0x..." style="background:transparent; border:none; text-align:center; width:100%; outline:none;">
                        <small class="label-clean">VALOR EM R$</small>
                        <input type="number" id="p-brl" class="input-transparente" placeholder="0.00" inputmode="decimal">
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-confirm green" id="btn-prosseguir-manual">PROSSEGUIR</button>
                    <button class="btn-confirm blue" id="btn-usar-camera">LIGAR CÂMERA</button>
                </div>`;
            
            document.getElementById('btn-usar-camera').onclick = () => {
                const reader = document.getElementById('reader');
                const infoPagamento = document.getElementById('info-pagamento');
                
                if(infoPagamento) infoPagamento.style.display = 'none';
                reader.style.setProperty('display', 'block', 'important');
                
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
            title.innerText = "COLETAR REPASSE";
            content.innerHTML = `
                <div class="converter-box" style="text-align: center;">
                    <img src="raposa.png" alt="Alpha Fox" style="width: 100px; height: 100px; margin: 15px 0; filter: drop-shadow(0 0 10px rgba(0,123,255,0.5));">
                    <p style="color: #666; font-size: 0.9rem;">Reivindique seus valores acumulados do protocolo.</p>
                    <button class="btn-confirm" id="confirmar-coleta">COLETAR AGORA</button>
                </div>`;
            
            document.getElementById('confirmar-coleta').onclick = () => this.executarColetaContrato();
        }
        else if (tipo === 'trocar') {
            title.innerText = "TROCAR (SWAP)";
            content.innerHTML = `<button class="btn-confirm" style="background: #d63384;" onclick="window.open('https://pancakeswap.finance/swap', '_blank')">IR PARA PANCAKE</button>`;
        }
    }

    async executarColetaContrato() {
        // Se ainda não houver contrato real configurado, avisa o usuário sem dar erro de blockchain
        if (this.enderecoContrato === "0x0000000000000000000000000000000000000000") {
            return alert("Contrato de coleta ainda não implantado no ecossistema.");
        }

        const btn = document.getElementById('confirmar-coleta');
        try {
            if (!this.signer) await this.conectar();
            if (btn) { btn.disabled = true; btn.innerText = "ASSINANDO NA CARTEIRA..."; }

            const abiEscrita = ["function realizarColeta() public"];
            const contrato = new ethers.Contract(this.enderecoContrato, abiEscrita, this.signer);

            const tx = await contrato.realizarColeta();
            if (btn) btn.innerText = "PROCESSANDO NA REDE...";
            
            await tx.wait();
            alert("Coleta realizada com sucesso! 🦊💎");
            
            this.fecharFolha();
            await this.verificarSaldoColeta(this.account);
            await this.atualizarSaldo();
        } catch (e) {
            console.error("Erro na execução da coleta:", e);
            if (e.code === 'ACTION_REJECTED' || e.code === 4001) {
                alert("Operação cancelada pelo usuário.");
            } else {
                alert("Falha ao processar coleta.");
            }
            if (btn) { btn.disabled = false; btn.innerText = "COLETAR AGORA"; }
        }
    }

    configurarRecebedor() {
        const input = document.getElementById('v-brl');
        input.oninput = () => {
            if(!this.account || !input.value) return;
            const bnb = (input.value / this.cotacaoBNB).toFixed(6);
            document.getElementById('v-bnb').innerText = `≈ ${bnb} BNB`;
            if(input.value > 0) {
                const valorEmWei = ethers.parseEther(bnb).toString();
                const link = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('ethereum:'+this.account+'?value='+valorEmWei)}`;
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
            }).catch(err => console.error(err));
        }).catch(err => alert("Câmera bloqueada ou não encontrada."));
    }

    prepararPagamento(addr, valor) {
        const content = document.getElementById('panel-content');
        const valorEmBrl = (valor * this.cotacaoBNB).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
        content.innerHTML = `
            <div class="converter-box">
                <p style="font-size:0.7rem; color:#666;">DESTINO: ${addr.substring(0,10)}...${addr.substring(addr.length - 4)}</p>
                <h2 style="margin:15px 0; color:#28A745;">${valorEmBrl}</h2>
                <button class="btn-confirm" id="confirm-final">ASSINAR PAGAMENTO</button>
            </div>`;
        document.getElementById('confirm-final').onclick = () => this.executar(addr, valor);
    }

    async ejecutar(para, quanto) {
        const btn = document.getElementById('confirm-final');
        try {
            if(btn) { btn.disabled = true; btn.innerText = "VERIFIQUE A CARTEIRA..."; }
            if (!this.ultimaAtualizacao || (Date.now() - this.ultimaAtualizacao > 120000)) await this.buscarCotacao();
            if (!this.signer) await this.conectar();
            
            const valorEmWei = ethers.parseUnits(parseFloat(quanto).toFixed(18), "ether");
            const tx = await this.signer.sendTransaction({ to: para, value: valorEmWei });
            
            if(btn) btn.innerText = "PROCESSANDO...";
            await tx.wait();
            alert("Concluído! 🤜🤛");
            location.reload();
        } catch (e) {
            if (e.code === 'ACTION_REJECTED' || e.code === 4001) {
                alert("Pagamento cancelado.");
            } else {
                alert("Erro na transação.");
            }
            if(btn) { btn.disabled = false; btn.innerText = "ASSINAR PAGAMENTO"; }
        }
    }

    async fecharFolha() {
        if (this.scanner) {
            try {
                await this.scanner.stop();
            } catch (e) { console.log("Scanner parado"); }
            this.scanner = null;
        }
        
        const r = document.getElementById('reader'); 
        const info = document.getElementById('info-pagamento');
        
        if(r) r.style.setProperty('display', 'none', 'important');
        if(info) info.style.display = 'block'; 
        
        document.getElementById('side-panel').classList.remove('active');
    }

    iniciarBotoes() {
        const btns = { 'btn-pagar': 'pagar', 'btn-receber': 'receber', 'btn-coletar': 'coletar', 'btn-trocar': 'trocar' };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }
        const bc = document.getElementById('btn-conectar');
        if (bc) bc.onclick = () => this.conectar();
        const cp = document.getElementById('close-panel');
        if (cp) cp.onclick = () => this.fecharFolha();
        
        setTimeout(() => {
            if (window.ethereum && window.ethereum.selectedAddress) this.conectar();
        }, 1000);
    }
}

const App = new NitrogenDAO();
