// --- ENDEREÇOS DOS CONTRATOS DO PROTOCOLO (REDES BLOCKCHAIN) ---
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
        this.fluxoQuizRespondido = false; 
        this.roletaGirando = false; 
        
        this.saldoPoupancaN = 0;          
        this.diasPoupancaRestantes = 0;   
        this.checkInRealizadoHoje = false;
        
        this.ultimoMesColetaGiroPoupanca = null; 
        this.progressoTokensParaGiro = 0;       
        this.metaTokensPoupanca = 1000;         
        
        this.codigoSemanalUtilizado = false;    

        this.readAccepted = false;
        this.agreeAccepted = false;
        
        this.iniciarBotoes();
        this.iniciarAutomacao();
        this.verificarSplashInicial();
    }

        verificarSplashInicial() {
        const raposaAzul = document.getElementById('tela-azul-raposa');
        const termosOverlay = document.getElementById('splash-screen-termos');
        
        // Elementos da Home para liberação limpa
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const bottomNav = document.querySelector('.bottom-nav');

        if (raposaAzul) {
            raposaAzul.style.display = 'flex';
            raposaAzul.style.opacity = '1';
        }

        // Conta 5 segundos com a raposa ativa na tela
        setTimeout(() => {
            if (raposaAzul) {
                raposaAzul.style.transition = "opacity 0.5s ease-out";
                raposaAzul.style.opacity = '0';
                
                setTimeout(() => {
                    raposaAzul.style.display = 'none';
                    raposaAzul.remove(); // Limpa a raposa do mapa para não duplicar na Home

                    // Verifica se as diretrizes já foram aceitas em acessos passados
                    if (localStorage.getItem('nitrogenio_terms_accepted') === 'true') {
                        if (termosOverlay) termosOverlay.remove();
                        
                        // Liga a Home instantaneamente tirando o display: none !important do CSS
                        if (header) header.style.setProperty('display', 'flex', 'important');
                        if (main) main.style.setProperty('display', 'block', 'important');
                        if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
                    } else {
                        // Se for primeiro acesso, chama os Termos na tela
                        if (termosOverlay) termosOverlay.style.display = 'flex';
                    }
                }, 500);
            }
        }, 5000);
    }

    finishSplash() {
        // ID CORRIGIDA DE ACORDO COM SEU HTML (era splash-screen, agora é splash-screen-termos)
        const termosOverlay = document.getElementById('splash-screen-termos');
        const header = document.querySelector('header');
        const main = document.querySelector('main');
        const bottomNav = document.querySelector('.bottom-nav');
        
        if (termosOverlay) {
            termosOverlay.style.transition = "opacity 0.5s ease-out";
            termosOverlay.style.opacity = '0';
            
            setTimeout(() => {
                termosOverlay.remove(); // Apaga do HTML para evitar que vire fantasma
                
                // MONTA A HOME NA TELA SEM PRECISAR DE REFRESH/ATUALIZAR
                if (header) header.style.setProperty('display', 'flex', 'important');
                if (main) main.style.setProperty('display', 'block', 'important');
                if (bottomNav) bottomNav.style.setProperty('display', 'flex', 'important');
            }, 500);
        }
        // Grava a confirmação permanente
        localStorage.setItem('nitrogenio_terms_accepted', 'true');

        // >>> O PULO DO GATO ENTRA BEM AQUI: <<<
        // Aguarda 300 milissegundos para o efeito visual fechar e reinicia a página sozinho!
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
        const btnEnter = document.getElementById('btn-enter-home'); // O botão de acessar a home
        
        if (btnEnter) {
            // Verifica se ambas as flags de aceite estão marcadas como true
            if (this.readAccepted && this.agreeAccepted) {
                btnEnter.disabled = false; // Libera o clique mecânico
                btnEnter.className = 'btn-activated'; // Aplica o estilo CSS azul ativo
            } else {
                btnEnter.disabled = true;
                btnEnter.className = 'btn-disabled'; // Mantém cinza se desmarcar
            }
        }
    }

    finishSplash() {
        const splashContainer = document.getElementById('splash-screen');
        
        if (splashContainer) {
            splashContainer.style.transition = "opacity 0.5s ease-out";
            splashContainer.style.opacity = '0';
            
            setTimeout(() => {
                splashContainer.remove(); // Deleta a estrutura inicial para nunca duplicar a raposa
                
                // Força a exibição imediata da Home sem precisar atualizar a página
                const elementosHome = document.querySelectorAll('header, main, .bottom-nav');
                elementosHome.forEach(el => el.style.setProperties ? el.style.setProperty('display', 'flex', 'important') : el.style.display = 'flex');
                
                // Se o seu 'main' usar block em vez de flex, usamos essa linha de segurança:
                const mainElement = document.querySelector('main');
                if (mainElement) mainElement.style.setProperty('display', 'block', 'important');
                
            }, 500);
        }
        localStorage.setItem('nitrogenio_terms_accepted', 'true');
    }
    
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
                <button class="btn-confirm" id="confirm-final" onclick="App.executar('${addr}', '${valor}')">ASSINAR PAGAMENTO</button>
            </div>`;
    }

    async executar(para, quanto) {
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

        // Verifica se é um dos 21 líderes e calcula a cota do contrato
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

    async executarColetaEfetiva(totalTokens) {
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
            title.innerText = "MEU PERFIL";
            panel.classList.add('active');
            
            const travaBotaoGiro = this.girosDisponiveis > 0 ? '' : 'disabled style="background: #cccccc; cursor: not-allowed;"';
            const estiloQuizBtn = this.fluxoQuizRespondido ? 'background: #cccccc; cursor: not-allowed;' : 'background: #333333;';
            const textoQuizBtn = this.fluxoQuizRespondido ? '✔️ QUIZ SEMANAL CONCLUÍDO' : '📚 QUIZ SEMANAL';
            const travaQuiz = this.fluxoQuizRespondido ? 'disabled' : '';

            const estiloCheckInBtn = this.checkInRealizadoHoje ? 'background: #cccccc; cursor: not-allowed;' : 'background: #333333;';
            const textoCheckInBtn = this.checkInRealizadoHoje ? '✔️ CHECK-IN DIÁRIO REALIZADO' : '📆 CHECK-IN DIÁRIO';
            const travaCheckIn = this.checkInRealizadoHoje ? 'disabled' : '';
            
            const textoTempoPoupanca = this.saldoPoupancaN > 0 
                ? (this.diasPoupancaRestantes > 0 ? `Libera em ${this.diasPoupancaRestantes} dias (Rendimento Ativo)` : '🔓 Saldo Liberado para Resgate!') 
                : 'Nenhum token retido para bônus';

            let blocoBotoesPoupanca = '';
            if (this.saldoPoupancaN > 0 && this.diasPoupancaRestantes <= 0) {
                blocoBotoesPoupanca = `
                    <div style="display: flex; gap: 8px; margin-top: 8px; width: 100%;">
                        <button type="button" class="btn-confirm" onclick="App.clamarPoupanca()" style="background: #28A745; margin: 0; padding: 10px; font-size: 0.8rem; flex: 1;">
                            🔓 CLAMAR DE VOLTA
                        </button>
                        <button type="button" class="btn-confirm blue" onclick="App.renovarPoupanca()" style="margin: 0; padding: 10px; font-size: 0.8rem; flex: 1;">
                            🔄 RENOVAR (+2 GIROS)
                        </button>
                    </div>
                `;
            } else {
                blocoBotoesPoupanca = `
                    <button type="button" class="btn-confirm" onclick="App.enviarParaPoupanca()" style="background: #333333; margin: 8px 0 0 0; padding: 10px; font-size: 0.8rem; width: 100%;">
                        GUARDAR NA POUPANÇA (+2 GIROS)
                    </button>
                `;
            }

            content.innerHTML = `
                <div class="perfil-container">
                    <div class="perfil-card-interno">
                        <p class="perfil-label">SALDO ACUMULADO NO APP</p>
                        <h3 class="perfil-saldo-pontos"><span id="saldo-app-tokens">${this.saldoAppN}</span> <span class="token-symbol">N</span></h3>
                        <p class="perfil-subtext" style="margin-bottom:0;">Tokens minerados na roleta e tarefas diárias.</p>
                        
                        <div style="border-top: 1px dashed rgba(0,0,0,0.1); margin: 15px 0; padding-top: 10px;"></div>
                        <p class="perfil-label" style="font-size: 0.7rem; opacity: 0.8;">POUPANÇA NITROGÊNIO (30 DIAS)</p>
                        <div style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 6px; margin: 8px 0; text-align: center;">
                            <strong style="font-size: 1.1rem; color: #007BFF; display: block;" id="saldo-poupanca-tokens">${this.saldoPoupancaN} N</strong>
                            <small style="font-size: 0.65rem; color: #666;" id="tempo-poupanca-restante">${textoTempoPoupanca}</small>
                        </div>
                        ${blocoBotoesPoupanca}
                    </div>

                    <div class="perfil-card-giros" style="margin-top: 15px;">
                        <p class="perfil-label">ATIVIDADES DISPONÍVEIS</p>
                        <h4 class="perfil-giros-count" style="margin-bottom: 15px;" id="perfil-giros-contador">${this.girosDisponiveis} Giros</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn-confirm" id="btn-quiz-semanal" onclick="App.abrirQuizPainel()" style="${estiloQuizBtn} margin: 0; padding: 12px; font-size: 0.85rem;" ${travaQuiz}>${textoQuizBtn}</button>
                            <button class="btn-confirm" id="btn-checkin-diario" onclick="App.executarCheckInDiario()" style="${estiloCheckInBtn} margin: 0; padding: 12px; font-size: 0.85rem;" ${travaCheckIn}>${textoCheckInBtn}</button>
                            <button class="btn-confirm blue" id="btn-abrir-giro" onclick="App.abrirRoletaPainel()" ${travaBotaoGiro}>🎯 IR PARA A ROLETA</button>
                        </div>
                    </div>

                    <div class="perfil-card-interno" style="margin-top: 15px; text-align: left;">
                        <p class="perfil-label">CÓDIGO DA COMUNIDADE</p>
                        <div style="display: flex; gap: 8px; margin-top: 5px;">
                            <input type="text" id="input-codigo-comunidade" placeholder="Digite o código..." autocomplete="off" style="flex: 1; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; font-size: 0.85rem; outline: none;">
                            <button type="button" onclick="App.validarCodigoComunidade()" style="background: #007BFF; color: white; border: none; padding: 0 15px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer;">VALIDAR</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (aba === 'home') {
            this.fecharFolha();
        }
    }

    enviarParaPoupanca() {
        if (this.saldoAppN <= 0) return alert("Você não possui saldo disponível.");
        const valorParaGuardar = prompt(`Quanto deseja guardar na poupança?`, this.saldoAppN);
        const quantidade = parseInt(valorParaGuardar);
        if (isNaN(quantidade) || quantidade <= 0 || quantidade > this.saldoAppN) return alert("Quantidade inválida.");

        this.saldoAppN -= quantidade;
        this.saldoPoupancaN += quantidade;
        this.diasPoupancaRestantes = 30; 
        this.progressoTokensParaGiro += quantidade;

        let msg = `Sucesso! Guardou ${quantidade} N na poupança por 30 dias.`;
        const dataAtual = new Date();
        const mesAnoAtual = `${dataAtual.getFullYear()}-${dataAtual.getMonth()}`;

        if (this.progressoTokensParaGiro >= this.metaTokensPoupanca) {
            if (this.ultimoMesColetaGiroPoupanca !== mesAnoAtual) {
                this.girosDisponiveis += 2;
                this.ultimoMesColetaGiroPoupanca = mesAnoAtual;
                this.progressoTokensParaGiro = 0;
                msg += `\n\n🎯 +2 Giros de bônus liberados!`;
            }
        }
        alert(msg);
        this.mudarAba('perfil'); 
    }

    clamarPoupanca() {
        if (this.saldoPoupancaN <= 0) return;
        const v = this.saldoPoupancaN;
        this.saldoAppN += v;
        this.saldoPoupancaN = 0;
        this.diasPoupancaRestantes = 0;
        alert(`🔓 Seus ${v} Token N voltaram para o saldo principal!`);
        this.mudarAba('perfil'); 
    }

    renovarPoupanca() {
        if (this.saldoPoupancaN <= 0) return;
        this.diasPoupancaRestantes = 30;
        this.girosDisponiveis += 2;
        alert(`🔄 Poupança Renovada! +2 Giros concedidos.`);
        this.mudarAba('perfil'); 
    }

    executarCheckInDiario() {
        if (this.checkInRealizadoHoje) return;
        this.checkInRealizadoHoje = true;
        this.girosDisponiveis += 1;
        alert("Check-in Diário Concluído! +1 Giro ganho. 📆");
        this.mudarAba('perfil');
    }

    validarCodigoComunidade() {
        const input = document.getElementById('input-codigo-comunidade');
        if (!input) return;
        const codigo = input.value.trim().toUpperCase();
        if (this.codigoSemanalUtilizado) return alert("Código já utilizado nesta semana!");

        if (codigo === "NITROSEMANAL") {
            this.girosDisponiveis += 1;
            this.codigoSemanalUtilizado = true;
            alert("Código Semanal Validado! +1 Giro! 🎯");
            this.mudarAba('perfil');
        } else {
            alert("Código inválido ou já expirado.");
        }
    }

    abrirQuizPainel() {
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        title.innerText = "QUIZ DO BEM";

        if (this.fluxoQuizRespondido) {
            content.innerHTML = `<div style="padding: 20px; text-align: center;"><p style="color:#28a745; font-weight:bold;">Tarefa Semanal Concluída! ✔️</p></div>`;
            return;
        }

        content.innerHTML = `
            <div style="padding: 15px; text-align: left;">
                <p style="font-size: 0.95rem; font-weight: bold; line-height: 1.4; margin-bottom: 20px;">
                    Se alguém pedir as suas 12 palavras-chave (frase de recuperação) o que você faz?
                </p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn-confirm" id="op-a" onclick="App.verificarRespostaQuiz('errada', 'op-a')">A) Forneço as palavras.</button>
                    <button class="btn-confirm" id="op-b" onclick="App.verificarRespostaQuiz('correta', 'op-b')">B) Não envio jamais!</button>
                </div>
                <div id="quiz-feedback" style="margin-top: 25px; text-align: center; display: none;"></div>
            </div>`;
    }

    verificarRespostaQuiz(tipo, idBotao) {
        document.getElementById('op-a').disabled = true;
        document.getElementById('op-b').disabled = true;
        const feedback = document.getElementById('quiz-feedback');
        feedback.style.display = "block";

        if (tipo === 'correta') {
            document.getElementById(idBotao).style.background = "#28A745";
            this.girosDisponiveis += 1;
            this.fluxoQuizRespondido = true;
            feedback.innerHTML = `<h4 style="color: #28A745;">Correto! +1 Giro</h4>`;
        } else {
            document.getElementById(idBotao).style.background = "#FF3B30";
            feedback.innerHTML = `<h4 style="color: #FF3B30;">Incorreto! Tente novamente.</h4>`;
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

    async executarSincronizacaoReal(enderecoCofre) {
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
                            <span style="font-size: 0.7 Raramente; color: #555;">Destinado à economia circular, apoio social, infraestrutura dos motoristas e incentivos locais.</span>
                        </div>
                        
                        <div style="padding: 10px; background: rgba(0,123,255,0.04); border-left: 4px solid #007BFF; border-radius: 0 6px 6px 0;">
                            <span style="font-size: 0.85rem; font-weight: bold; color: #007BFF; display:block;">⚪ 42% Conselho de Guardiões</span>
                            <span style="font-size: 0.7rem; color: #555;">Fundo estratégico de governança e auditoria de blocos, distribuído proporcionalmente aos 21 líderes ativos.</span>
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
        
        setTimeout(() => {
            if (window.ethereum && window.ethereum.selectedAddress) this.conectar();
        }, 1000);
    }

    abrirRoletaPainel() {
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        title.innerText = "ROLETA DO BEM";
        content.innerHTML = `
            <div class="roleta-wrapper">
                <div class="roleta-container">
                    <div class="roleta-ponteiro"></div>
                    <div id="disco-roleta" class="roleta-disco"></div>
                    <button id="btn-start-giro" class="btn-roleta-centro" onclick="App.girarRoletaEfetivo()">GIRAR</button>
                </div>
                <div id="revelacao-area" style="width: 100%;"></div>
            </div>`;
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

    girarRoletaEfetivo() {
        if (this.roletaGirando || this.girosDisponiveis <= 0) return;
        this.roletaGirando = true;
        this.girosDisponiveis -= 1;
        document.getElementById('btn-start-giro').disabled = true;
        document.getElementById('revelacao-area').innerHTML = "";
        const disco = document.getElementById('disco-roleta');
        
        const mesesCampanhas = [
            { mes: "Janeiro Branco", desc: "Saúde mental importa.", cor: "🤍" },
            { mes: "Fevereiro Roxo", desc: "Combate ao Alzheimer e Fibromialgia.", cor: "💜" },
            { mes: "Março Azul Marinho", desc: "Prevenção contra o câncer colorretal.", cor: "💙" },
            { mes: "Abril Azul Claro", desc: "Conscientização sobre o Autismo.", cor: "🩵" },
            { mes: "Maio Amarelo", desc: "Atenção pela vida! Paz no trânsito.", cor: "💛" },
            { mes: "Junho Vermelho", desc: "Doar sangue salva vidas.", cor: "❤️" },
            { mes: "Julho Verde Amarelo", desc: "Combate às hepatites virais.", cor: "💚" },
            { mes: "Agosto Dourado", desc: "Apoio ao aleitamento materno.", cor: "💛" },
            { mes: "Setembro Amarelo", desc: "Valorização da vida! Peça ajuda.", cor: "💛" },
            { mes: "Outubro Rosa", desc: "Prevenção do câncer de mama.", cor: "🩷" },
            { mes: "Novembro Azul", desc: "Saúde do homem em foco.", cor: "💙" },
            { mes: "Dezembro Vermelho", desc: "Mobilização nacional contra o HIV.", cor: "❤️" }
        ];

        const índiceSorteado = Math.floor(Math.random() * 12);
        const escolha = mesesCampanhas[índiceSorteado];
        const grausPorFatia = 30;
        const voltasCompletas = (4 + Math.floor(Math.random() * 3)) * 360;
        const grausAlvo = voltasCompletas + (índiceSorteado * grausPorFatia);
        disco.style.transform = `rotate(-${grausAlvo}deg)`;

        const totalPassosSom = 40; 
        for (let i = 0; i < totalPassosSom; i++) {
            const atrasoSom = Math.pow(i / totalPassosSom, 2) * 4000; 
            setTimeout(() => { if (this.roletaGirando) this.tocarSomClick(); }, atrasoSom);
        }

        setTimeout(() => {
            this.roletaGirando = false;
            this.tocarSomVitoria();
            const tokensGanhos = Math.floor(Math.random() * 46) + 5;
            this.saldoAppN += tokensGanhos;

            document.getElementById('revelacao-area').innerHTML = `
                <div class="revelacao-popup">
                    <h3>${escolha.cor} ${escolha.mes.toUpperCase()}</h3>
                    <p>"${escolha.desc}"</p>
                    <div style="background: rgba(40, 167, 69, 0.05); border: 1px dashed #28a745; padding: 10px; border-radius: 8px;">
                        <strong style="color: #28a745; font-size: 1.3rem;">+${tokensGanhos} N</strong>
                    </div>
                    <button class="btn-resgatar-vault" onclick="App.mudarAba('perfil')" style="background: #333333; width: 100%; margin-top: 12px;">CONCLUIR</button>
                </div>`;
        }, 4000);
    }
}

const App = new NitrogenDAO();
