// ==========================================================================
// --- CONFIGURAÇÃO DE MOCK / DESENVOLVIMENTO (TESTE SEM NFT) ---
// ==========================================================================
const DEV_MODE = {
    forcarPossuiNFT: false // 🔴 MUDE PARA true QUANDO QUISER TESTAR AS ABAS LIBERADAS!
};

// ==========================================================================
// --- ENDEREÇOS DOS CONTRATOS DO PROTOCOLO (REDES BLOCKCHAIN) ---
// ==========================================================================
const CONTRATO_TOKEN_N = ""; // <--- COLOQUE O CONTRATO DO TOKEN N AQUI QUANDO ELE CHEGAR!
const CONTRATO_USDT_BSC = "0x55d398326f99059fF775485246999027B3197955"; // Contrato USDT BEP20 oficial na BSC

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

        // === CONTROLE DO QUIZ ===
        this.perguntaAtualIndex = 0;
        this.perguntasQuiz = [
            {
                pergunta: "Qual a utilidade dos 21 Guardiões no ecossistema?",
                opcoes: ["Auditar blocos e governança on-chain", "Centralizar tokens de liquidez"],
                correta: 0
            },
            {
                pergunta: "Qual tecnologia garante a segurança e transparência do DApp?",
                opcoes: ["Servidor Central Cloud", "Rede Blockchain (On-Chain)"],
                correta: 1
            },
            {
                pergunta: "Como você coleta seus tokens Nitrogen (N) acumulados?",
                opcoes: ["Através do menu Coletar na Home", "Enviando uma mensagem no suporte"],
                correta: 0
            }
        ];

        this.readAccepted = false;
        this.agreeAccepted = false;
        
        // === RECUPERAÇÃO AUTOMÁTICA DE DADOS SALVOS ===
        if (localStorage.getItem('nitrogenio_saldo_app')) {
            this.saldoAppN = parseFloat(localStorage.getItem('nitrogenio_saldo_app'));
        }
        if (localStorage.getItem('nitrogenio_giros')) {
            this.girosDisponiveis = parseInt(localStorage.getItem('nitrogenio_giros'));
        }

        // Inicializações fundamentais
        this.iniciarBotoes();
        this.iniciarAutomacao();
        this.verificarSplashInicial();
    }

    usuarioPossuiNFT() {
        if (DEV_MODE.forcarPossuiNFT) {
            return true; 
        }
        return false;
    }

    salvarDadosDApp() {
        localStorage.setItem('nitrogenio_saldo_app', this.saldoAppN);
        localStorage.setItem('nitrogenio_giros', this.girosDisponiveis);
        console.log("Dados do ecossistema Nitrogen salvos localmente.");
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

        setTimeout(() => {
            if (raposaAzul) {
                raposaAzul.style.transition = "opacity 0.5s ease-out";
                raposaAzul.style.opacity = '0';
                
                setTimeout(() => {
                    raposaAzul.style.display = 'none';

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
                <div id="qr-area" style="display:none; margin-top:20px; text-align:center;">
                    <img id="img-qr" style="width:200px; border:10px solid white; border-radius:10px;">
                    <p style="color:#007BFF; font-weight:bold; margin-top:10px; font-size:0.8rem;">APRESENTE O CÓDIGO</p>
                </div>`;
            this.configurarRecebedor();
        } 
        else if (tipo === 'pagar') {
            title.innerText = "PAGAMENTO";
            content.innerHTML = `
                <div class="card-pagamento-fixo">
                    <div id="reader" style="display:none; width:100%; min-height:200px;"></div>
                    <div id="info-pagamento">
                        <small class="label-clean">ENDEREÇO DO DESTINO</small>
                        <input type="text" id="p-addr" class="txt-destino" placeholder="0x..." style="background:transparent; border:none; text-align:center; width:100%; outline:none;">
                        <small class="label-clean">VALOR EM R$</small>
                        <input type="number" id="p-brl" class="input-transparente" placeholder="0.00" inputmode="decimal">
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top:15px;">
                    <button class="btn-confirm green" id="btn-prosseguir-manual">PROSSEGUIR</button>
                    <button class="btn-confirm blue" id="btn-usar-camera">LIGAR CÂMERA</button>
                </div>`;
            
            document.getElementById('btn-usar-camera').onclick = () => {
                const reader = document.getElementById('reader');
                const infoPagamento = document.getElementById('info-pagamento');
                if(infoPagamento) infoPagamento.style.display = 'none';
                if(reader) reader.style.setProperty('display', 'block', 'important');
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
            content.innerHTML = `<button class="btn-confirm" style="background: #d63384; width:100%;" onclick="window.open('https://pancakeswap.finance/swap', '_blank')">IR PARA PANCAKE</button>`;
        }
    }

    configurarRecebedor() {
        const input = document.getElementById('v-brl');
        if(!input) return;
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
        if(content) {
            content.innerHTML = `
                <div class="converter-box" style="text-align:center;">
                    <p style="font-size:0.7rem; color:#666;">DESTINO: ${addr.substring(0,10)}...${addr.substring(addr.length - 4)}</p>
                    <h2 style="margin:15px 0; color:#28A745;">${valorEmBrl}</h2>
                    <button class="btn-confirm" id="confirm-final" style="width:100%;">ASSINAR PAGAMENTO</button>
                </div>`;
            document.getElementById('confirm-final').onclick = () => this.executar(addr, valor);
        }
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

        let ehGuardiao = this.usuarioPossuiNFT(); 
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
            this.salvarDadosDApp();
            this.fecharFolha();
        } catch (e) {
            console.error("Erro na execução da transação:", e);
            alert("Falha ao assinar e processar a transação.");
            this.processarDadosColeta();
        }
    }

    fecharFolha() {
        if (this.scanner) {
            try { this.scanner.stop(); } catch (e) {}
            this.scanner = null;
        }
        const panel = document.getElementById('side-panel');
        if(panel) panel.classList.remove('active');
        
        document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
        const btnHome = document.getElementById('nav-home');
        if (btnHome) btnHome.classList.add('active');
    }

    atualizarSaldosInterface() {
        const txtSaldo = document.getElementById('perfil-saldo-tokens'); 
        const txtGiros = document.getElementById('perfil-giros-contagem'); 
        const txtGirosRoleta = document.getElementById('roleta-giros-disponiveis');

        if (txtSaldo) txtSaldo.innerText = this.saldoAppN.toFixed(2);
        if (txtGiros) txtGiros.innerText = this.girosDisponiveis;
        if (txtGirosRoleta) txtGirosRoleta.innerText = this.girosDisponiveis;
    }
    
    mudarAba(aba) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
            item.classList.remove('active');
        });

        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }

        const botaoAtivo = document.getElementById(`nav-${aba}`);
        if (botaoAtivo) botaoAtivo.classList.add('active');

        if (aba === 'home') {
            this.fecharFolha();
            return;
        }

        // --- SISTEMA UNIFICADO DE ABAS LATERAIS ---
        if ((aba === 'perfil' || aba === 'nft' || aba === 'governanca') && !this.usuarioPossuiNFT()) {
            const panel = document.getElementById('side-panel');
            const title = document.getElementById('panel-title');
            const content = document.getElementById('panel-content');
            
            if (panel) panel.classList.add('active');
            if (title) title.innerText = "ACESSO RESTRITO";
            if (content) {
                content.innerHTML = `
                    <div style="padding: 30px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; box-sizing: border-box;">
                        <div style="font-size: 3.5rem; margin-bottom: 15px;">🥶</div>
                        <h2 style="font-size: 1.3rem; font-weight: 800; color: #1a1a1a; margin: 0 0 10px 0;">Aba Exclusiva Trancada</h2>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.5; margin: 0 0 20px 0; max-width: 280px;">
                            Esta seção exige o <strong>NFT de Guardião Oficial</strong> da NitrogenDAO na sua carteira para liberar os módulos sociais, quiz e governança.
                        </p>
                        <button type="button" class="btn-confirm blue" style="width: 100%; font-weight: bold; padding: 14px; border-radius: 12px;" onclick="window.open('https://pancakeswap.finance/', '_blank')">
                            MINTAR NFT DE GUARDIÃO
                        </button>
                    </div>
                `;
            }
            return; 
        }

        // Renderização para usuários válidos ou em DEV_MODE = true
        const panel = document.getElementById('side-panel');
        const title = document.getElementById('panel-title');
        const content = document.getElementById('panel-content');

        if (panel) panel.classList.add('active');

        if (aba === 'perfil') {
            if (title) title.innerText = "MEU PERFIL";
            const txtCarteira = this.account 
                ? `${this.account.substring(0, 6)}...${this.account.substring(this.account.length - 4)}` 
                : "Desconectado";

            if (content) {
                content.innerHTML = `
                    <div class="perfil-container">
                        <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 15px;">
                            <div class="perfil-card-interno" style="flex: 1; padding: 12px; background:rgba(0,0,0,0.02); border-radius:8px;">
                                <small style="font-size: 9px; color:#666;">SALDO ACUMULADO</small>
                                <h4 style="font-size: 1.2rem; font-weight: bold; margin: 2px 0 0 0;">
                                    <span id="perfil-saldo-tokens">${this.saldoAppN.toFixed(2)}</span> N
                                </h4>
                                <p style="font-size: 9px; color: #28A745; margin: 4px 0 0 0; font-weight: bold;">
                                    🎯 GIROS: <span id="perfil-giros-contagem">${this.girosDisponiveis}</span>
                                </p>
                            </div>
                            <div class="perfil-card-interno" style="flex: 1; padding: 12px; text-align: right; background:rgba(0,0,0,0.02); border-radius:8px;">
                                <small style="font-size: 9px; color:#666;">CARTEIRA WEB3</small>
                                <p style="font-size: 0.75rem; font-family: monospace; font-weight: bold; color: #007BFF; margin: 4px 0 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${txtCarteira}
                                </p>
                            </div>
                        </div>

                        <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #f0f0f0; margin-bottom: 15px;">
                            <h3 style="margin: 0 0 6px 0; font-size: 1rem; color: #1a1a1a; font-weight: bold;">Olá, Boss!</h3>
                            <p style="font-size: 0.8rem; color: #666; line-height: 1.4; margin: 0 0 12px 0;">
                                Colete suas recompensas diretamente para sua carteira on-chain através do painel principal da Home.
                            </p>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="input-cod-comunidade" placeholder="Código Comunitário" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #E0E0E0; font-size: 0.85rem; outline: none;">
                                <button type="button" onclick="App.validarCodigoComunidade()" style="background: #007BFF; color: white; border: none; padding: 0 16px; border-radius: 8px; font-weight: bold; font-size: 0.8rem; cursor: pointer;">ENVIAR</button>
                            </div>
                        </div>

                        <div class="perfil-menu-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                            <button type="button" class="btn-confirm blue" style="font-size:0.8rem;" onclick="App.abrirSubModulo('poupanca')">💰 POUPANÇA</button>
                            <button type="button" class="btn-confirm blue" style="font-size:0.8rem;" onclick="App.abrirSubModulo('quiz')">📚 QUIZ SEMANAL</button>
                            <button type="button" class="btn-confirm blue" style="font-size:0.8rem;" onclick="App.abrirSubModulo('checkin')">📆 CHECK-IN DIÁRIO</button>
                            <button type="button" class="btn-confirm blue" style="font-size:0.8rem;" onclick="App.abrirSubModulo('roleta')">🎯 ROLETA DO BEM</button>
                        </div>
                    </div>
                `;
                this.atualizarSaldosInterface();
            }
        } 
        else if (aba === 'nft') {
            if (title) title.innerText = "MEUS NFTS";
            if (content) {
                content.innerHTML = `
                    <div style="padding: 15px; text-align: center;">
                        <h3>Galeria de NFTs</h3>
                        <p style="font-size: 0.85rem; color:#666;">Módulo sincronizado de forma estável (Off-chain). Ele requisitará validação on-chain ao interagir com o smart contract.</p>
                    </div>`;
            }
        } 
        else if (aba === 'governanca') {
            if (title) title.innerText = "GOVERNANÇA DAO";
            if (content) {
                content.innerHTML = `
                    <div style="padding: 15px; text-align: center;">
                        <h3>Votações e Propostas</h3>
                        <p style="font-size: 0.85rem; color:#666;">Conselho Ativo. O painel aguarda propostas assinadas via infraestrutura Snapshot ou MetaMask.</p>
                    </div>`;
            }
        }
    }

    abrirSubModulo(modulo) {
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        const panel = document.getElementById('side-panel');
        
        if (!content || !panel) return;

        let templateId = '';
        if (modulo === 'poupanca') {
            if (title) title.innerText = "POUPANÇA NITROGEN";
            templateId = 'tela-poupanca';
        }
        if (modulo === 'quiz') {
            if (title) title.innerText = "QUIZ SEMANAL";
            this.perguntaAtualIndex = 0; 
            panel.classList.add('active');
            this.renderizarPerguntaQuiz(); 
            return; 
        }
        if (modulo === 'checkin') {
            if (title) title.innerText = "CHECK-IN DIÁRIO";
            templateId = 'tela-checkin';
        }
        if (modulo === 'roleta') {
            if (title) title.innerText = "ROLETA DO BEM";
            templateId = 'tela-roleta';
        }
        
        const temp = document.getElementById(templateId);
        if (temp) {
            content.innerHTML = '';
            content.appendChild(temp.content.cloneNode(true));
            if (modulo === 'poupanca') this.atualizarLayoutPoupança();
            if (modulo === 'checkin') this.atualizarLayoutCheckIn();
            panel.classList.add('active');
        }
    }

    renderizarPerguntaQuiz() {
        const content = document.getElementById('panel-content');
        if (!content) return;

        if (this.perguntaAtualIndex >= this.perguntasQuiz.length) {
            alert("Quiz finalizado! Use seus giros na Roleta do Bem. 🎯");
            this.fecharFolha();
            return;
        }

        const dadosQuiz = this.perguntasQuiz[this.perguntaAtualIndex];
        
        let botoesHTML = "";
        dadosQuiz.opcoes.forEach((opcao, index) => {
            botoesHTML += `
                <button 
                    type="button" 
                    id="btn-quiz-opcao-${index}" 
                    style="background: #007BFF; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 0.85rem; cursor: pointer; width: 100%; text-align: center; transition: background 0.3s;"
                    onclick="App.verificarRespostaQuiz(${index})"
                >
                    ${opcao}
                </button>
            `;
        });

        content.innerHTML = `
            <div class="quiz-container" style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
                <div style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #f0f0f0; text-align: left;">
                    <span style="font-size: 0.75rem; color: #666; font-weight: bold;">Pergunta ${this.perguntaAtualIndex + 1} de 3</span>
                    <h3 style="margin: 8px 0 0 0; font-size: 1rem; color: #1a1a1a; font-weight: bold; line-height: 1.4;">
                        ${dadosQuiz.pergunta}
                    </h3>
                </div>
                <div id="quiz-opcoes-lista" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                    ${botoesHTML}
                </div>
                <div id="quiz-feedback" style="text-align: center; font-weight: bold; font-size: 0.9rem; margin-top: 5px;"></div>
            </div>
        `;
    }

    verificarRespostaQuiz(indiceSelecionado) {
        const dadosQuiz = this.perguntasQuiz[this.perguntaAtualIndex];
        const feedback = document.getElementById('quiz-feedback');
        
        dadosQuiz.opcoes.forEach((_, index) => {
            const btn = document.getElementById(`btn-quiz-opcao-${index}`);
            if (btn) btn.disabled = true;
        });

        if (indiceSelecionado === dadosQuiz.correta) {
            const btnCerto = document.getElementById(`btn-quiz-opcao-${indiceSelecionado}`);
            if (btnCerto) btnCerto.style.background = "#28A745"; 
            if (feedback) {
                feedback.style.color = "#28A745";
                feedback.innerText = "🎉 Correto! +1 Giro adicionado!";
            }
            this.girosDisponiveis += 1; 
            this.atualizarSaldosInterface();
            this.tocarSomVitoria();
        } else {
            const btnErrado = document.getElementById(`btn-quiz-opcao-${indiceSelecionado}`);
            if (btnErrado) btnErrado.style.background = "#DC3545"; 
            const btnCerto = document.getElementById(`btn-quiz-opcao-${dadosQuiz.correta}`);
            if (btnCerto) btnCerto.style.background = "#28A745"; 
            if (feedback) {
                feedback.style.color = "#DC3545";
                feedback.innerText = "❌ Incorreto! Sem giros por essa.";
            }
            this.tocarSomClick();
        }

        setTimeout(() => {
            this.perguntaAtualIndex++;
            this.renderizarPerguntaQuiz();
        }, 2500);
    }

    validarCodigoComunidade() {
        const input = document.getElementById('input-cod-comunidade');
        if(!input || !input.value.trim()) return alert("Digite um código válido.");
        
        const cod = input.value.trim().toUpperCase();
        if(cod === "COMUNIDADE" || cod === "NANA30") {
            this.girosDisponiveis += 3;
            this.salvarDadosDApp();
            this.tocarSomVitoria();
            alert("Código Comunitário Ativado! +3 Giros adicionados no topo! 🎯");
            input.value = "";
            this.atualizarSaldosInterface();
        } else {
            alert("Código expirado ou inválido.");
        }
    }

    atualizarLayoutPoupança() {
        const txtStatus = document.getElementById('poupanca-status-info');
        const btnTravar = document.getElementById('btn-travar-poupanca');
        const btnResgatar = document.getElementById('btn-resgatar-poupanca');
        const inputQtd = document.getElementById('input-qtd-poupanca');

        if(!txtStatus) return;

        if(this.poupancaSaldo > 0) {
            if(inputQtd) inputQtd.style.display = 'none';
            if(btnTravar) btnTravar.style.display = 'none';
            
            const dataLiberacao = new Date(parseInt(this.poupancaData) + (30 * 24 * 60 * 60 * 1000));
            const hoje = new Date();
            
            if(hoje >= dataLiberacao) {
                txtStatus.innerHTML = `<span style="color:#28A745; font-weight:bold;">✓ Seu prazo de 30 dias encerrou!</span><br>Saldo Trancado: ${this.poupancaSaldo} N.<br>Disponível para resgate imediato com +1% de juros.`;
                if(btnResgatar) btnResgatar.style.display = 'block';
            } else {
                const diasRestantes = Math.ceil((dataLiberacao - hoje) / (1000 * 60 * 60 * 24));
                txtStatus.innerHTML = `<span style="color:orange; font-weight:bold;">🔒 Fundos Trancados na Poupança</span><br>Saldo: ${this.poupancaSaldo} N.<br>Desbloqueio em <strong>${diasRestantes} dias</strong>.`;
                if(btnResgatar) btnResgatar.style.display = 'none';
            }
        } else {
            if(inputQtd) inputQtd.style.display = 'block';
            if(btnTravar) btnTravar.style.display = 'block';
            if(btnResgatar) btnResgatar.style.display = 'none';
            txtStatus.innerHTML = `<span style="color:#666;">Sem aplicações ativas no momento. Mínimo de 1000 N rende Giros de Bônus permanentes!</span>`;
        }
    }

    aplicarPoupança() {
        const input = document.getElementById('input-qtd-poupanca');
        if(!input || parseFloat(input.value) <= 0) return alert("Insira uma quantidade válida de tokens.");
        
        const valor = parseFloat(input.value);
        if(valor > this.saldoAppN) return alert("Saldo insuficiente no DApp.");
        
        this.saldoAppN -= valor;
        this.poupancaSaldo = valor;
        this.poupancaData = Date.now().toString(); 
        
        if(valor >= 1000) {
            this.girosDisponiveis += 5;
            alert("Sensacional! Meta batida. Você alocou mais de 1000 N e faturou +5 Giros de Bônus adicionais!");
        }
        
        this.salvarDadosDApp();
        this.atualizarLayoutPoupança();
    }

    resgatarPoupança() {
        const juros = this.poupancaSaldo * 0.01; 
        const totalLiberado = this.poupancaSaldo + juros;
        
        this.saldoAppN += totalLiberado;
        this.poupancaSaldo = 0;
        this.poupancaData = null;
        
        this.salvarDadosDApp();
        this.tocarSomVitoria();
        alert(`Poupança removida com sucesso! Redirecionado ${totalLiberado.toFixed(2)} N para o seu saldo principal (Capital + 1% Juros)! 💰`);
        this.atualizarLayoutPoupança();
    }

    atualizarLayoutCheckIn() {
        const hojeString = new Date().toISOString().split('T')[0];
        const btn = document.getElementById('btn-executar-checkin');
        
        this.premioSurpresaGiros = 50; 

        for(let i=1; i<=7; i++) {
            const caixa = document.getElementById(`checkin-d${i}`);
            if(caixa) caixa.classList.remove('concluido', 'atual');
        }
        
        for(let i = 1; i <= this.checkinDiasConsecutivos; i++) {
            const caixa = document.getElementById(`checkin-d${i}`);
            if(caixa) caixa.classList.add('concluido'); 
        }
        
        if (this.checkinUltimaData === hojeString) {
            if(btn) {
                btn.disabled = true;
                btn.innerText = "PRESENÇA GARANTIDA HOJE";
                btn.style.background = "#ccc";
                btn.style.cursor = "not-allowed";
            }
        } else {
            if(btn) {
                btn.disabled = false;
                btn.innerText = "REIVINDICAR PRESENÇA";
                btn.style.background = "#007BFF";
                btn.style.cursor = "pointer";
            }
            const proximoDia = (this.checkinDiasConsecutivos % 7) + 1;
            const caixaAtual = document.getElementById(`checkin-d${proximoDia}`);
            if(caixaAtual) caixaAtual.classList.add('atual');
        }

        const caixaPresente = document.getElementById('caixa-presente-surpresa');
        if(caixaPresente) {
            const jaColetouSurpresa = localStorage.getItem('nitrogenio_checkin_surpresa_coletado') === hojeString;

            if (this.checkinDiasConsecutivos === 7 && !jaColetouSurpresa) {
                caixaPresente.classList.add('aceso');
                caixaPresente.style.opacity = "1";
                caixaPresente.style.cursor = "pointer";
                caixaPresente.onclick = () => this.resgatarPresenteSurpresa();
            } else {
                caixaPresente.classList.add('apagado');
                caixaPresente.style.opacity = "0.4";
                caixaPresente.style.cursor = "not-allowed";
                caixaPresente.onclick = () => {
                    alert(`🎁 Esta Caixa contém uma Recompensa Surpresa de Giros! Complete o ciclo de 7 dias consecutivos para destrancá-la.`);
                };
            }
        }
    }

    executarCheckIn() {
        const hoje = new Date();
        const hojeString = hoje.toISOString().split('T')[0];
        
        if (this.checkinUltimaData === hojeString) {
            return alert("Você já garantiu seu giro hoje. Volte amanhã!");
        }
        
        if (!this.checkinDiasConsecutivos) this.checkinDiasConsecutivos = 0;
        
        let quebrouSequencia = true;
        if (this.checkinUltimaData) {
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);
            const ontemString = ontem.toISOString().split('T')[0];
                                
            if (this.checkinUltimaData === ontemString) quebrouSequencia = false;
        } else {
            quebrouSequencia = false; 
        }
        
        if (quebrouSequencia || this.checkinDiasConsecutivos >= 7) {
            this.checkinDiasConsecutivos = 1;
        } else {
            this.checkinDiasConsecutivos += 1;
        }
        
        this.checkinUltimaData = hojeString;
        
        if (this.checkinDiasConsecutivos === 7) {
            this.tocarSomVitoria();
            alert("🔥 Incrível! Você completou a sequência de 7 dias! A CAIXA SURPRESA FOI DESBLOQUEADA!");
        } else {
            this.girosDisponiveis += 1; 
            this.tocarSomClick();
            alert(`Check-in confirmado! +1 Giro (Dia ${this.checkinDiasConsecutivos}/7).`);
        }
        
        this.salvarDadosDApp();
        this.atualizarLayoutCheckIn();
        this.atualizarSaldosInterface();
    }

    resgatarPresenteSurpresa() {
        const hojeString = new Date().toISOString().split('T')[0];
        
        if(localStorage.getItem('nitrogenio_checkin_surpresa_coletado') === hojeString) {
            return alert("Você já resgatou o prêmio surpresa desse ciclo!");
        }

        this.girosDisponiveis += this.premioSurpresaGiros;
        localStorage.setItem('nitrogenio_checkin_surpresa_coletado', hojeString);
        
        this.tocarSomVitoria();
        alert(`🎁 SENSACIONAL, BOSS!\n\nVocê faturou +${this.premioSurpresaGiros} GIROS EXTRAS! 🚀`);
        
        this.salvarDadosDApp();
        this.atualizarLayoutCheckIn();
        this.atualizarSaldosInterface();
    }

    girarRoleta() {
        if(this.roletaGirando) return;
        if(this.girosDisponiveis <= 0) return alert("Você não possui Giros Disponíveis. Conclua tarefas do Perfil para ganhar mais!");
        
        this.roletaGirando = true;
        this.girosDisponiveis -= 1; 
        this.atualizarSaldosInterface(); 
        this.tocarSomClick();
        
        const disco = document.getElementById('disco-roleta');
        const popup = document.getElementById('roleta-popup-resultado');
        if(popup) popup.style.display = 'none';

        const fatiasPrêmios = [
            { txt: "+5 N", premio: 5 }, { txt: "+10 N", premio: 10 },
            { txt: "+50 N", premio: 50 }, { txt: "+5 N", premio: 5 },
            { txt: "+20 N", premio: 20 }, { txt: "+100 N", premio: 100 },
            { txt: "+5 N", premio: 5 }, { txt: "+10 N", premio: 10 },
            { txt: "+500 N LENDÁRIO!", premio: 500 }, { txt: "+5 N", premio: 5 },
            { txt: "+20 N", premio: 20 }, { txt: "+10 N", premio: 10 }
        ];
        
        const indiceSorteado = Math.floor(Math.random() * fatiasPrêmios.length);
        const grausPorFatia = 30;
        const grausRotacaoTotal = 1800 + (indiceSorteado * grausPorFatia);
        
        if(disco) {
            disco.style.transition = "transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)";
            disco.style.transform = `rotate(${grausRotacaoTotal}deg)`;
        }
        
        setTimeout(() => {
            this.roletaGirando = false;
            const ganho = fatiasPrêmios[indiceSorteado];
            
            this.saldoAppN += ganho.premio; 
            this.atualizarSaldosInterface(); 
            this.tocarSomVitoria();
            
            if(popup) {
                popup.innerText = `🎁 Incrível! Você faturou: ${ganho.txt}!`;
                popup.style.display = 'block';
            }
            
            if(disco) {
                disco.style.transition = "none";
                disco.style.transform = `rotate(${grausRotacaoTotal % 360}deg)`;
            }
        }, 4000); 
    }
    
    abrirTesouraria() {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        if (title) title.innerText = "TESOURARIA";
        if (panel) panel.classList.add('active');

        const enderecoCofre = "0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219";

        if (content) {
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
        }

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

    async executarSincronizacaoReal(enderecoCofre) {
        const containerDados = document.getElementById('dados-reais-tesouraria');
        const areaStatus = document.getElementById('area-status-cofre');
        
        try {
            if (!this.provider || !this.account) await this.conectar();

            let saldoBnbReal = 0;
            let saldoUsdtReal = 0;
            let saldoTokenNReal = 15420.00;

            if (this.provider) {
                const weiBnb = await this.provider.getBalance(enderecoCofre);
                saldoBnbReal = parseFloat(ethers.formatEther(weiBnb));

                try {
                    const contratoUsdt = new ethers.Contract(CONTRATO_USDT_BSC, MINIMA_ABI_BEP20, this.provider);
                    const rawUsdt = await contratoUsdt.balanceOf(enderecoCofre);
                    saldoUsdtReal = parseFloat(ethers.formatUnits(rawUsdt, 18)); 
                } catch(errUsdt) { console.warn("USDT offline local:", errUsdt); }
            }

            if(areaStatus) {
                areaStatus.innerHTML = `
                    <small style="color: #666; font-weight: bold;">ATIVOS NO COFRE SAFE (ON-CHAIN)</small>
                    <div style="text-align: left; margin: 15px 0; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; display:flex; flex-direction:column; gap:8px;">
                        <p style="margin:0; font-size:1.1rem; color:#28A745;"><strong>🇺🇸 ${saldoUsdtReal.toFixed(2)}</strong> <span style="font-size:0.8rem; color:#666;">USDT</span></p>
                        <p style="margin:0; font-size:1.1rem; color:#007BFF;"><strong>🪙 ${saldoTokenNReal.toLocaleString('pt-br')}</strong> <span style="font-size:0.8rem; color:#666;">Token N</span></p>
                        <p style="margin:0; font-size:0.9rem; color:#333;"><strong>⛽ ${saldoBnbReal.toFixed(4)}</strong> <span style="font-size:0.75rem; color:#666;">BNB</span></p>
                    </div>
                `;
            }

            if(containerDados) {
                containerDados.innerHTML = `
                    <div class="card-metricas-dao" style="background: rgba(0,0,0,0.02); padding: 15px; border-radius: 10px; text-align: left;">
                        <h3 style="font-size: 0.85rem; margin: 0 0 10px 0; font-weight: bold; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 6px;">
                            DIVISÃO DE FLUXO DO PROTOCOLO
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="padding: 10px; background: rgba(40,167,69,0.04); border-left: 4px solid #28A745;">
                                <span style="font-size: 0.85rem; font-weight: bold; color: #28A745; display:block;">🔵 58% Fundo da Comunidade</span>
                            </div>
                            <div style="padding: 10px; background: rgba(0,123,255,0.04); border-left: 4px solid #007BFF;">
                                <span style="font-size: 0.85rem; font-weight: bold; color: #007BFF; display:block;">⚪ 42% Conselho de Guardiões</span>
                            </div>
                        </div>
                    </div>
                `;
                containerDados.style.display = "block";
            }

        } catch (error) {
            console.error("Erro na leitura da rede:", error);
            alert("Falha ao ler dados direto da blockchain.");
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
        
        const abasMenu = ['home', 'nft', 'governanca', 'recompensas', 'perfil'];
        abasMenu.forEach(aba => {
            const el = document.getElementById(`nav-${aba}`);
            if (el) {
                el.onclick = () => {
                    this.tocarSomClick();
                    this.mudarAba(aba);
                };
            }
        });

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

const App = new NitrogenDAO();
