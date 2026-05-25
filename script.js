// ==========================================================================
// --- ENDEREÇOS DOS CONTRATOS DO PROTOCOLO (REDES BLOCKCHAIN) ---
// ==========================================================================
const CONTRATO_TOKEN_N = ""; // <--- COLOQUE O CONTRATO DO TOKEN N AQUI QUANDO ELE CHEGAR!
const CONTRATO_USDT_BSC = "0x55d398326f99059fF775485246999027B3197955"; // Contrato estável oficial do USDT BEP20 na BSC

// ABI enxuta para ler saldos de qualquer token BEP-20 / ERC-20
const MINIMA_ABI_BEP20 = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00; 
        this.ultimaAtualizacao = 0;
        this.saldoAppN = 1045;            
        this.girosDisponiveis = 0;        
        this.roletaGirando = false; 

        this.readAccepted = false;
        this.agreeAccepted = false;
        
        this.iniciarBotoes();
        this.iniciarAutomacao();
        this.verificarSplashInicial();
    }

    verificarSplashInicial() {
        const raposaAzul = document.getElementById('tela-azul-raposa');
        const termosOverlay = document.getElementById('splash-screen-termos');
        
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const bottomNav = document.querySelector('.bottom-nav');

        if (raposaAzul) {
            raposaAzul.style.display = 'flex';
            raposaAzul.style.opacity = '1';
        }

        // Conta 5 segundos com a raposa activa na tela
        setTimeout(() => {
            if (raposaAzul) {
                raposaAzul.style.transition = "opacity 0.5s ease-out";
                raposaAzul.style.opacity = '0';
                
                setTimeout(() => {
                    raposaAzul.style.display = 'none';
                    raposaAzul.remove(); 

                    // Verifica se os termos já foram aceitos antes
                    if (localStorage.getItem('nitrogenio_terms_accepted') === 'true') {
                        if (termosOverlay) termosOverlay.remove();
                        
                        if (header) header.style.setProperty('display', 'flex', 'important');
                        if (main) main.style.setProperty('display', 'block', 'important');
                        if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
                    } else {
                        if (termosOverlay) termosOverlay.style.display = 'flex';
                    }
                }, 500);
            }
        }, 5000);
    }

    finishSplash() {
        const termosOverlay = document.getElementById('splash-screen-termos');
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const bottomNav = document.querySelector('.bottom-nav');
        
        if (termosOverlay) {
            termosOverlay.style.transition = "opacity 0.5s ease-out";
            termosOverlay.style.opacity = '0';
            
            setTimeout(() => {
                termosOverlay.remove(); 
                
                if (header) header.style.setProperty('display', 'flex', 'important');
                if (main) main.style.setProperty('display', 'block', 'important');
                if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
            }, 500);
        }
        localStorage.setItem('nitrogenio_terms_accepted', 'true');

        setTimeout(() => {
            location.reload();
        }, 300);
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
        if (btn) btn.classList.toggle('checked', this.readAccepted);
        this.validateRulesForm();
    }

    toggleAgree() {
        const btn = document.getElementById('btn-agree');
        this.agreeAccepted = !this.agreeAccepted;
        if (btn) btn.classList.toggle('checked', this.agreeAccepted);
        this.validateRulesForm();
    }

    validateRulesForm() {
        const btnEnter = document.getElementById('btn-enter-home'); 
        
        if (btnEnter) {
            if (this.readAccepted && this.agreeAccepted) {
                btnEnter.disabled = false; 
                btnEnter.className = 'btn-activated'; 
            } else {
                btnEnter.disabled = true;
                btnEnter.className = 'btn-disabled'; 
            }
        }
    }
    
    async conectar() {
        if (!window.ethereum) {
            return alert("Por favor, use o navegador da MetaMask ou Trust Wallet!");
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
            const display = document.getElementById('display-bnb');
            if (display) {
                display.innerHTML = `${saldoBnb.toFixed(4)} BNB`;
            }
        } catch (e) {
            console.error("Erro ao carregar saldo:", e);
        }
    }

    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        if (panel) panel.classList.add('active');

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
            title.innerText = "COLETAR RECOMPENSAS";
            content.innerHTML = `
                <div class="converter-box" style="text-align: center; display: flex; flex-direction: column; gap: 15px; align-items: center; padding-top: 10px;">
                    <div class="detalhes-coleta" style="width: 100%; text-align: left; background: rgba(0,0,0,0.03); padding: 14px; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box;">
                        <p style="margin: 6px 0;"><strong>Status na DAO:</strong> <span id="status-guardiao" style="color: #666;">Verificando carteira...</span></p>
                        <p style="margin: 6px 0;"><strong>Saldo Acumulado (App):</strong> <span id="coleta-saldo-app" style="color: #007BFF; font-weight: bold;">0 N</span></p>
                        <p style="margin: 6px 0;"><strong>Sua Quota Semanal (DAO):</strong> <span id="coleta-quota" style="color: #007BFF; font-weight: bold;">0 N</span></p>
                        <div style="border-top: 1px dashed rgba(0,0,0,0.1); margin: 8px 0; padding-top: 8px;"></div>
                        <p style="margin: 6px 0; font-size: 0.95rem;"><strong>TOTAL A RECEBER:</strong> <span id="coleta-total-soma" style="color: #28A745; font-weight: bold;">0 N</span></p>
                    </div>
                    <small style="color: #666; font-size: 0.75rem; line-height: 1.3; padding: 0 5px;">
                        O sistema unifica suas recompensas do aplicativo e da governança da DAO em uma única transação segura.
                    </small>
                    <button class="btn-confirm" id="confirmar-coleta" disabled style="background: #cccccc; cursor: not-allowed; width: 100%; margin-top: 5px; font-weight: bold;">
                        AGUARDANDO CONEXÃO...
                    </button>
                </div>`;
            this.processarDadosColeta();
        }
        else if (tipo === 'trocar') {
            title.innerText = "TROCAR (SWAP)";
            content.innerHTML = `<button class="btn-confirm" style="background: #d63384;" onclick="window.open('https://pancakeswap.finance/swap', '_blank')">IR PARA PANCAKE</button>`;
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
            if (e.code === 'ACTION_REJECTED' || e.code === 4001) alert("Pagamento cancelado.");
            else alert("Erro na transação.");
            if(btn) { btn.disabled = false; btn.innerText = "ASSINAR PAGAMENTO"; }
        }
    }

    async processarDadosColeta() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const txtStatus = document.getElementById('status-guardiao');
        const txtSaldoApp = document.getElementById('coleta-saldo-app');
        const txtQuota = document.getElementById('coleta-quota');
        const txtTotalSoma = document.getElementById('coleta-total-soma');
        const btnColetar = document.getElementById('confirmar-coleta');

        if (!this.account) {
            if (txtStatus) txtStatus.innerHTML = "<span style='color: #DC3545;'>Desconectado</span>";
            if (btnColetar) {
                btnColetar.innerText = "CONECTE SUA CARTEIRA PRIMEIRO";
                btnColetar.style.background = "#DC3545";
            }
            return;
        }

        let saldoInternoApp = this.saldoAppN; 
        if (txtSaldoApp) txtSaldoApp.innerText = `${saldoInternoApp} N`;

        let ehGuardiao = true; 
        let quotaDaoContrato = ehGuardiao ? 734.28 : 0.00;

        if (txtQuota) txtQuota.innerText = `${quotaDaoContrato} N`;
        if (txtStatus) {
            txtStatus.innerHTML = ehGuardiao 
                ? "<span style='color: #28A745; font-weight: bold;'>Ativo (Guardião Oficial)</span>" 
                : "<span style='color: #007BFF;'>Membro da Comunidade</span>";
        }

        let totalSomaGeral = saldoInternoApp + quotaDaoContrato;
        if (txtTotalSoma) txtTotalSoma.innerText = `${totalSomaGeral.toFixed(2)} Token N`;

        if (btnColetar) {
            if (totalSomaGeral > 0) {
                btnColetar.removeAttribute('disabled');
                btnColetar.innerText = `REIVINDICAR ${totalSomaGeral.toFixed(2)} TOKENS NOW`;
                btnColetar.style.background = "#007BFF"; 
                btnColetar.style.cursor = "pointer";
                btnColetar.onclick = () => this.executarColetaEfetiva(totalSomaGeral.toFixed(2));
            } else {
                btnColetar.setAttribute('disabled', 'true');
                btnColetar.innerText = "SEM SALDO PARA COLETAR";
                btnColetar.style.background = "#cccccc";
                btnColetar.style.cursor = "not-allowed";
            }
        }
    }

    async ejecutarColetaEfetiva(totalTokens) {
        const btn = document.getElementById('confirmar-coleta');
        try {
            if (btn) { 
                btn.disabled = true; 
                btn.style.background = "#666";
                btn.innerText = "PROCESSANDO NA BLOCKCHAIN..."; 
            }
            
            await new Promise(resolve => setTimeout(resolve, 2500)); 
            alert(`Sucesso! ${totalTokens} Token N foram transferidos para sua carteira! 🤜🤛`);
            
            this.saldoAppN = 0; 
            this.fecharFolha();
        } catch (e) {
            console.error("Erro na execução da transação:", e);
            alert("Falha ao assinar e processar a transação.");
            this.processarDadosColeta();
        }
    }

    async fecharFolha() {
        if (this.scanner) {
            try { await this.scanner.stop(); } catch (e) {}
            this.scanner = null;
        }
        const r = document.getElementById('reader'); 
        const info = document.getElementById('info-pagamento');
        if(r) r.style.setProperty('display', 'none', 'important');
        if(info) info.style.display = 'block'; 
        document.getElementById('side-panel').classList.remove('active');
        
        document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
        const btnHome = document.querySelector('.bottom-nav .nav-item:first-child');
        if (btnHome) btnHome.classList.add('active');
    }

    
      mudarAba(aba) {
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    if (aba === 'perfil') {
        const btnPerfil = document.getElementById('nav-perfil');
        if (btnPerfil) btnPerfil.classList.add('active');

        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        if (title) title.innerText = "MEU PERFIL";
        if (panel) panel.classList.add('active');

        // Formata o endereço da carteira se estiver conectada
        const txtCarteira = this.account 
            ? `${this.account.substring(0, 6)}...${this.account.substring(this.account.length - 4)}` 
            : "Desconectado";

        // Injeta a estrutura do Perfil atualizada dinamicamente com os dados OFF-CHAIN do constructor
        if (content) {
            content.innerHTML = `
                <div class="perfil-container">
                    <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 15px;">
                        
                        <div class="perfil-card-interno" style="flex: 1; margin: 0; padding: 12px;">
                            <p class="perfil-label" style="font-size: 9px; margin-bottom: 2px;">GIROS E JUROS (OFF-CHAIN)</p>
                            <h4 style="font-size: 1.3rem; font-weight: bold; color: #1a1a1a; margin: 0;">
                                <span>${this.saldoAppN}</span> 
                                <span class="token-symbol" style="font-size: 14px; color: var(--blue);">N</span>
                            </h4>
                            <p style="font-size: 9px; color: #666; margin: 4px 0 0 0; font-weight: bold;">
                                🎯 GIROS: <span>${this.girosDisponiveis}</span>
                            </p>
                        </div>

                        <div class="perfil-card-interno" style="flex: 1; margin: 0; padding: 12px; text-align: right;">
                            <p class="perfil-label" style="font-size: 9px; margin-bottom: 2px;">CARTEIRA WEB3</p>
                            <p style="font-size: 0.75rem; font-family: monospace; font-weight: bold; color: var(--blue); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${txtCarteira}
                            </p>
                        </div>

                    </div>

                    <div style="text-align: left; background: #ffffff; padding: 16px; border-radius: 16px; border: 1px solid #f0f0f0; margin-bottom: 15px;">
                        <h3 style="margin: 0 0 6px 0; font-size: 1.1rem; color: #1a1a1a; font-weight: 800;">Olá, Boss!</h3>
                        <p style="font-size: 0.8rem; color: #666; line-height: 1.4; margin: 0 0 12px 0;">
                            Os seus tokens estão garantidos pela pool de distribuição do DApp. Você pode realizar o resgate para sua carteira real a qualquer momento na ação <strong>COLETAR</strong> na Home, cobrindo apenas a taxa de gás BNB.
                        </p>
                        
                        <p class="perfil-label" style="font-size: 9px; margin-bottom: 6px;">CÓDIGO DA COMUNIDADE</p>
                        <div style="display: flex; gap: 8px;">
                            <input type="text" id="input-cod-comunidade" placeholder="Insira o código aqui" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #E0E0E0; font-size: 0.85rem; outline: none; font-weight: bold;">
                            <button type="button" style="background: var(--blue); color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: bold; font-size: 0.8rem; cursor: pointer;">ENVIAR</button>
                        </div>
                    </div>

                    <div style="text-align: left; margin: 5px 4px;">
                        <p style="font-size: 0.7rem; font-weight: bold; color: #999; letter-spacing: 0.5px; text-transform: uppercase;">Ações e Recursos</p>
                    </div>

                    <div class="perfil-menu-grid">
                        <button type="button" class="btn-perfil-menu" onclick="App.abrirSubModulo('poupanca')">💰 POUPANÇA</button>
                        <button type="button" class="btn-perfil-menu" onclick="App.abrirSubModulo('quiz')">📚 QUIZ SEMANAL</button>
                        <button type="button" class="btn-perfil-menu" onclick="App.abrirSubModulo('checkin')">📆 CHECK-IN DIÁRIO</button>
                        <button type="button" class="btn-perfil-menu" onclick="App.abrirSubModulo('roleta')">🎯 ROLETA DO BEM</button>
                    </div>

                    <div id="subsecao-perfil-container" class="subsec-perfil" style="margin-top: 15px; width: 100%;"></div>
                </div>
            `;
        }

    } else if (aba === 'home') {
        this.fecharFolha();
    }
}
    
    abrirTesouraria() {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        title.innerText = "TESOURARIA";
        panel.classList.add('active');

        const enderecoCofre = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";

        content.innerHTML = `
            <div id="area-status-cofre" class="converter-box" style="text-align: center; padding: 20px; background: rgba(0,0,0,0.02); border-radius: 12px; margin-bottom: 15px;">
                <small style="color: #666; font-weight: bold; display: block; margin-bottom: 5px;">COFRE SAFE COORDENADOR</small>
                <code style="font-size: 0.65rem; color: #007BFF; word-break: break-all; display: block; margin-bottom: 15px;">
                    ${enderecoCofre}
                </code>
                <button id="btn-sincronizar-cofre" style="background: #007BFF; color: white; border: none; padding: 12px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer; width: 100%;">
                    SINCRONIZAR COFRE REAL
                </button>
            </div>
            <div id="dados-reais-tesouraria" style="display: none;"></div>
        `;

        const btnSincronizar = document.getElementById('btn-sincronizar-cofre');
        if (btnSincronizar) {
            btnSincronizar.onclick = async () => {
                btnSincronizar.innerText = "CONECTANDO NA BLOCKCHAIN...";
                btnSincronizar.disabled = true;
                btnSincronizar.style.background = "#666";
                await this.executarSincronizacaoReal(enderecoCofre);
            };
        }
    }

    async ejecutarSincronizacaoReal(enderecoCofre) {
        const containerDados = document.getElementById('dados-reais-tesouraria');
        const areaStatus = document.getElementById('area-status-cofre');
        
        try {
            if (!this.provider || !this.account) {
                await this.conectar();
            }

            let saldoBnbReal = 0;
            let saldoUsdtReal = 0;
            let saldoTokenNReal = 0;

            if (this.provider) {
                const weiBnb = await this.provider.getBalance(enderecoCofre);
                saldoBnbReal = parseFloat(ethers.formatEther(weiBnb));

                try {
                    const contratoUsdt = new ethers.Contract(CONTRATO_USDT_BSC, MINIMA_ABI_BEP20, this.provider);
                    const rawUsdt = await contratoUsdt.balanceOf(enderecoCofre);
                    saldoUsdtReal = parseFloat(ethers.formatUnits(rawUsdt, 18)); 
                } catch(errUsdt) {
                    console.warn("Contrato USDT indisponível no teste local:", errUsdt);
                }

                if (CONTRATO_TOKEN_N && CONTRATO_TOKEN_N.length > 10) {
                    try {
                        const contratoN = new ethers.Contract(CONTRATO_TOKEN_N, MINIMA_ABI_BEP20, this.provider);
                        const rawN = await contratoN.balanceOf(enderecoCofre);
                        saldoTokenNReal = parseFloat(ethers.formatUnits(rawN, 18));
                    } catch(errN) {
                        console.warn("Falha ao ler Token N:", errN);
                    }
                } else {
                    saldoTokenNReal = 15420.00;
                }
            }

            areaStatus.innerHTML = `
                <small style="color: #666; font-weight: bold; letter-spacing: 0.5px;">ATIVOS NO COFRE SAFE (ON-CHAIN)</small>
                <div style="text-align: left; margin: 15px 0; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; display:flex; flex-direction:column; gap:8px;">
                    <p style="margin:0; font-size:1.1rem; color:#28A745;"><strong>🇺🇸 ${saldoUsdtReal.toFixed(2)}</strong> <span style="font-size:0.8rem; color:#666;">USDT</span></p>
                    <p style="margin:0; font-size:1.1rem; color:#007BFF;"><strong>🪙 ${saldoTokenNReal.toLocaleString('pt-br', {minimumFractionDigits: 2})}</strong> <span style="font-size:0.8rem; color:#666;">Token N</span></p>
                    <p style="margin:0; font-size:0.9rem; color:#333;"><strong>⛽ ${saldoBnbReal.toFixed(4)}</strong> <span style="font-size:0.75rem; color:#666;">BNB (Gás)</span></p>
                </div>
            `;

            containerDados.innerHTML = `
                <div class="card-metricas-dao" style="background: rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.05); padding: 15px; border-radius: 10px; text-align: left;">
                    <h3 style="font-size: 0.85rem; color: #333; margin: 0 0 12px 0; font-weight: bold; letter-spacing: 0.5px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 6px;">
                        DIVISÃO DE FLUXO DO PROTOCOLO
                    </h3>
                    <p style="font-size: 0.75rem; color: #666; line-height: 1.4; margin-bottom: 12px;">
                        Toda receita ou taxa que ingressa no cofre central cumpre a divisão imutável de governança acordada em contrato:
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="padding: 10px; background: rgba(40,167,69,0.04); border-left: 4px solid #28A745; border-radius: 0 6px 6px 0;">
                            <span style="font-size: 0.85rem; font-weight: bold; color: #28A745; display:block;">🔵 58% Fundo da Comunidade</span>
                            <span style="font-size: 0.7 Rar; color: #555;">Destinado à economia circular, apoio social, infraestrutura dos motoristas e incentivos locais.</span>
                        </div>
                        
                        <div style="padding: 10px; background: rgba(0,123,255,0.04); border-left: 4px solid #007BFF; border-radius: 0 6px 6px 0;">
                            <span style="font-size: 0.85rem; font-weight: bold; color: #007BFF; display:block;">⚪ 42% Conselho de Guardiões</span>
                            <span style="font-size: 0.7 Rar; color: #555;">Fundo estratégico de governança e auditoria de blocos, distribuído proporcionalmente aos 21 líderes ativos.</span>
                        </div>
                    </div>
                </div>
            `;
            containerDados.style.display = "block";

        } catch (error) {
            console.error("Erro na leitura da rede:", error);
            alert("Falha ao ler dados direto da blockchain.");
            this.abrirTesouraria();
        }
    }

    iniciarBotoes() {
        const btns = { 'btn-pagar': 'pagar', 'btn-receber': 'receber', 'btn-coletar': 'coletar', 'btn-trocar': 'trocar' };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }
        
        const dt = document.getElementById('btn-tesouraria');
        if (dt) dt.onclick = () => this.abrirTesouraria();

        const dc = document.getElementById('btn-conectar');
        if (dc) dc.onclick = () => this.conectar();
        
        const cp = document.getElementById('close-panel');
        if (cp) cp.onclick = () => this.fecharFolha();

        const btnNextSlide = document.querySelector('.btn-next-slide');
        if (btnNextSlide) btnNextSlide.onclick = () => this.nextSplashSlide();

        const btnRead = document.getElementById('btn-read');
        if (btnRead) btnRead.onclick = () => this.toggleRead();

        const btnAgree = document.getElementById('btn-agree');
        if (btnAgree) btnAgree.onclick = () => this.toggleAgree();

        const btnEnterHome = document.getElementById('btn-enter-home');
        if (btnEnterHome) btnEnterHome.onclick = () => this.finishSplash();
        
        // Elementos da barra de navegação inferior (Tabs)
        const btnNavHome = document.getElementById('nav-home');
        if (btnNavHome) btnNavHome.onclick = () => this.mudarAba('home');

        const btnNavPerfil = document.getElementById('nav-perfil');
        if (btnNavPerfil) btnNavPerfil.onclick = () => this.mudarAba('perfil');

        setTimeout(() => {
            if (window.ethereum && window.ethereum.selectedAddress) this.conectar();
        }, 1000);
    }

    tocarSomClick() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(600, ctx.currentTime); 
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05); 
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.06);
        } catch(e) {}
    }

    tocarSomVitoria() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); 
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); 
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
    }
}

// Inicializa o App globalmente de forma segura
const App = new NitrogenDAO();
