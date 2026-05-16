class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00; 
        this.ultimaAtualizacao = 0;
        
        // Inicializa todas as configurações do ecossistema
        this.iniciarBotoes();
        this.iniciarAutomacao();
        this.iniciarNavegacaoIntro();
    }

    // ==========================================
    // 1. NAVEGAÇÃO INTERNA E INTRODUÇÃO
    // ==========================================
    iniciarNavegacaoIntro() {
        // Pular a primeira folha automaticamente após 5 segundos
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.irParaFolha2();
            }, 5000);
        });

        // Configura o evento do checkbox se os elementos existirem na tela
        const c1 = document.getElementById('check-whitepaper');
        const c2 = document.getElementById('check-governanca');
        if (c1 && c2) {
            c1.onchange = () => this.validarChecks();
            c2.onchange = () => this.validarChecks();
        }
    }

    irParaFolha2() {
        const f1 = document.getElementById('folha1');
        const f2 = document.getElementById('folha2');
        if(f1 && f2) {
            f1.classList.remove('visivel');
            f2.classList.add('visivel');
        }
    }

    irParaFolha3() {
        const f2 = document.getElementById('folha2');
        const f3 = document.getElementById('folha3');
        if(f2 && f3) {
            f2.classList.remove('visivel');
            f3.classList.add('visivel');
        }
    }

    validarChecks() {
        const c1 = document.getElementById('check-whitepaper');
        const c2 = document.getElementById('check-governanca');
        const btnEntrar = document.getElementById('btn-entrar');
        if(btnEntrar && c1 && c2) {
            btnEntrar.disabled = !(c1.checked && c2.checked);
        }
    }

    acessarHome() {
        const intro = document.getElementById('intro-layer');
        const home = document.getElementById('home-app');
        if(intro && home) {
            intro.style.display = 'none';
            home.style.display = 'block';
        }
    }

    // ==========================================
    // 2. LÓGICA DO MINT E ABAS DE PAGAMENTO
    // ==========================================
    abrirMint() {
        const mint = document.getElementById('folha-mint');
        if(mint) mint.classList.add('metade');
    }

    expandirMint() {
        const mint = document.getElementById('folha-mint');
        const extra = document.getElementById('extra-info');
        if(mint) mint.classList.add('cheia');
        if(extra) extra.style.display = 'block';
    }

    voltarMint() {
        const mint = document.getElementById('folha-mint');
        if(mint) {
            mint.classList.remove('cheia');
            mint.classList.remove('metade');
        }
    }

    abrirQuintaFolha() {
        const pag = document.getElementById('folha-pagamento');
        if(pag) pag.classList.add('metade');
    }

    fecharPagamento() {
        const pag = document.getElementById('folha-pagamento');
        if(pag) pag.classList.remove('metade');
    }

    chamarMetaMask() {
        const btnPagar = document.getElementById('btn-pagar-meta');
        if(btnPagar) {
            btnPagar.innerText = 'AGUARDANDO METAMASK...';
        }
        
        alert("Iniciando conexão com a MetaMask para pagamento em USDT...");
        // Espaço reservado para a integração futura com Ethers.js
    }

    // ==========================================
    // 3. CONEXÃO BLOCKCHAIN & COTAÇÃO
    // ==========================================
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
            }
        } catch (e) { 
            console.error("Erro na conexão:", e);
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

    // ==========================================
    // 4. OPERAÇÕES DO PAINEL LATERAL (SIDE PANEL)
    // ==========================================
    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        // Se já existia um scanner aberto, força a destruição dele antes de avançar
        if(this.scanner) { 
            this.scanner.stop().catch(()=>{}); 
            this.scanner = null; 
        }
        
        if(!content || !panel) return;
        content.innerHTML = ""; 
        panel.classList.add('active');

        if (tipo === 'receber') {
            title.innerText = "GERAR COBRANÇA";
            content.innerHTML = `
                <div class="converter-box">
                    <small>VALOR (R$)</small>
                    <input type="number" id="v-brl" class="input-brl" placeholder="0,00" inputmode="decimal">
                    <p id="v-bnb" class="label-bnb" style="font-size:0.7rem; opacity:0.6; color:#666;">≈ 0.0000 BNB</p>
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
                    <div id="reader" style="display:none; width: 100%; min-height: 250px; background: #000; margin-bottom: 15px;"></div>
                    <div id="info-pagamento">
                        <small class="label-clean">ENDEREÇO DO DESTINO</small>
                        <input type="text" id="p-addr" class="txt-destino" placeholder="0x..." style="background:transparent; border:none; text-align:center; width:100%; outline:none;">
                        <small class="label-clean" style="margin-top:10px;">VALOR EM R$</small>
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
                if(reader) reader.style.setProperty('display', 'block', 'important');
                
                // Damos um delay de 150ms para o HTML renderizar a caixinha preta antes de chamar a câmera
                setTimeout(() => {
                    this.iniciarScanner(); 
                }, 150);
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
                    <p style="color: #666; font-size: 0.9rem;">Reivindique seus Tokens N.</p>
                    <button class="btn-confirm" id="confirmar-coleta">COLETAR AGORA</button>
                </div>`;
        }
        else if (tipo === 'trocar') {
            title.innerText = "TROCAR (SWAP)";
            content.innerHTML = `<button class="btn-confirm" style="background: #d63384;" onclick="window.open('https://pancakeswap.finance/swap', '_blank')">IR PARA PANCAKE</button>`;
        }
    }

    iniciarScanner() {
        if (this.scanner) return;

        // Garante que o elemento HTML existe e limpa resíduos de inicializações anteriores
        const readerEl = document.getElementById('reader');
        if (readerEl) readerEl.innerHTML = "";

        this.scanner = new Html5Qrcode("reader");
        
        // Configuração otimizada para navegadores Web3 integrados (MetaMask / Trust / Brave)
        this.scanner.start(
            { facingMode: "environment" }, 
            { 
                fps: 10, 
                qrbox: (width, height) => {
                    // Torna a caixa de leitura perfeitamente responsiva no ecrã do telemóvel
                    const minEdge = Math.min(width, height);
                    const qrboxSize = Math.floor(minEdge * 0.7);
                    return { width: qrboxSize, height: qrboxSize };
                }
            }, 
            (txt) => {
                // Código detetado com sucesso
                this.scanner.stop().then(() => {
                    this.scanner = null; 
                    if (readerEl) readerEl.style.display = 'none';
                    
                    let addr = txt.includes(':') ? txt.split(':')[1].split('?')[0] : txt;
                    let valor = txt.includes('value=') ? txt.split('value=')[1] : "0";
                    if (valor.length > 10) valor = ethers.formatEther(valor);
                    
                    this.prepararPagamento(addr, valor);
                }).catch(err => console.error("Erro ao parar o scanner:", err));
            },
            (errorMessage) => {
                // Ignora logs repetitivos de procura de foco para não sobrecarregar o processador do telemóvel
            }
        ).catch(err => {
            console.error("Erro crítico na câmara:", err);
            this.scanner = null;
            
            // Mensagem clara orientando o utilizador sobre como resolver o bloqueio no telemóvel
            alert("A câmara não pôde ser iniciada.\n\nPor favor, verifique se concedeu permissão de câmara nas definições do seu navegador ou aplicação MetaMask.");
            this.fecharFolha();
        });
    }

    async fecharFolha() {
        // Desliga a câmera imediatamente ao fechar a folha para liberar o hardware do celular
        if (this.scanner) {
            try { 
                await this.scanner.stop(); 
            } catch (e) { 
                console.log("Scanner já estava parado ou fechado."); 
            }
            this.scanner = null;
        }
        
        const r = document.getElementById('reader');
        const info = document.getElementById('info-pagamento');
        
        if(r) r.style.setProperty('display', 'none', 'important');
        if(info) info.style.display = 'block'; 
        
        document.getElementById('side-panel').classList.remove('active');
    }


    // ==========================================
    // 5. MAPEAMENTO GERAL DE CLIQUES (LISTENERS)
    // ==========================================
    iniciarBotoes() {
        // Botões do Painel Principal (Ações da Web3)
        const btns = { 'btn-pagar': 'pagar', 'btn-receber': 'receber', 'btn-coletar': 'coletar', 'btn-trocar': 'trocar' };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }

        // Botão Conectar Carteira
        const bc = document.getElementById('btn-conectar');
        if (bc) bc.onclick = () => this.conectar();

        // Botão Fechar Painel Lateral
        const cp = document.getElementById('close-panel');
        if (cp) cp.onclick = () => this.fecharFolha();
        
        // Auto-conexão caso já possua endereço ativo autorizado
        setTimeout(() => {
            if (window.ethereum && window.ethereum.selectedAddress) this.conectar();
        }, 1000);
    }
}

// Inicia a aplicação globalmente de forma limpa
const App = new NitrogenDAO();
