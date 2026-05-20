class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00; 
        this.ultimaAtualizacao = 0;
        this.saldoAppN = 1000;            // Saldo acumulado inicial interno
        this.girosDisponiveis = 2;        // Quantidade de giros iniciais
        this.fluxoQuizRespondido = false; // Evita responder o quiz várias vezes
        this.roletaGirando = false; 
        
        // Propriedades de controle da Splash Screen
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
            title.innerText = "COLETAR RECOMPENSAS";
            
            content.innerHTML = `
                <div class="converter-box" style="text-align: center; display: flex; flex-direction: column; gap: 15px; align-items: center; padding-top: 10px;">
                    <div class="detalhes-coleta" style="width: 100%; text-align: left; background: rgba(0,0,0,0.03); padding: 14px; border-radius: 8px; font-size: 0.85rem; box-sizing: border-box;">
                        <p style="margin: 6px 0;"><strong>Status Guardião:</strong> <span id="status-guardiao" style="color: #666;">Verificando lista...</span></p>
                        <p style="margin: 6px 0;"><strong>Arrecadação do Cofre:</strong> <span id="coleta-arrecadacao" style="color: #666;">Calculando...</span></p>
                        <p style="margin: 6px 0;"><strong>Sua Quota Semanal:</strong> <span id="coleta-quota" style="color: #666;">Calculando...</span></p>
                        <p style="margin: 6px 0;"><strong>Nonce de Segurança:</strong> <span id="coleta-nonce" style="color: #666;">-#</span></p>
                    </div>
                    <small style="color: #666; font-size: 0.8rem; line-height: 1.3; padding: 0 5px;">
                        Cada guardião assina a transação individualmente e paga sua própria taxa de gás.
                    </small>
                    <button class="btn-confirm" id="confirmar-coleta" disabled style="background: #cccccc; cursor: not-allowed; width: 100%; margin-top: 5px;">
                        AGUARDANDO DADOS...
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
                <button class="btn-confirm" id="confirm-final" onclick="App.ejecutar('${addr}', '${valor}')">ASSINAR PAGAMENTO</button>
            </div>`;
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

    async processarDadosColeta() {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const txtStatus = document.getElementById('status-guardiao');
        const txtArrecadacao = document.getElementById('coleta-arrecadacao');
        const txtQuota = document.getElementById('coleta-quota');
        const txtNonce = document.getElementById('coleta-nonce');
        const btnColetar = document.getElementById('confirmar-coleta');

        if (!this.account) {
            if (txtStatus) txtStatus.innerHTML = "<span style='color: #DC3545;'>Carteira não conectada</span>";
            if (btnColetar) {
                btnColetar.innerText = "CONECTE SUA CARTEIRA PRIMEIRO";
                btnColetar.style.background = "#DC3545";
            }
            return;
        }

        const dadosSimulados = {
            ehGuardiao: true,
            arrecadacaoTotal: "15,420 Token N",
            quotaIndividual: "734.28 Token N",
            nonceAtual: "0"
        };

        if (dadosSimulados.ehGuardiao) {
            if (txtStatus) txtStatus.innerHTML = "<span style='color: #28A745; font-weight: bold;'>Ativo (Guardião Oficial)</span>";
            if (txtArrecadacao) txtArrecadacao.innerText = dadosSimulados.arrecadacaoTotal;
            if (txtQuota) txtQuota.innerText = dadosSimulados.quotaIndividual;
            if (txtNonce) txtNonce.innerText = dadosSimulados.nonceAtual;

            if (btnColetar) {
                btnColetar.removeAttribute('disabled');
                btnColetar.innerText = "REIVINDICAR TOKENS NOW";
                btnColetar.style.background = "#007BFF";
                btnColetar.style.cursor = "pointer";
                
                btnColetar.onclick = () => {
                    this.executarColetaEfetiva(dadosSimulados.quotaIndividual, dadosSimulados.nonceAtual);
                };
            }
        } else {
            if (txtStatus) txtStatus.innerHTML = "<span style='color: #DC3545;'>Endereço não é Guardião</span>";
            if (btnColetar) btnColetar.innerText = "COLETA INDISPONÍVEL";
        }
    }

    async identificarGuardiãoEfetivo(quantidade, nonce) {
        // Método vazio ou reserva se necessário
    }

    async executarColetaEfetiva(quantidade, nonce) {
        const btn = document.getElementById('confirmar-coleta');
        try {
            if (btn) { 
                btn.disabled = true; 
                btn.innerText = "VERIFIQUE SUA CARTEIRA..."; 
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            alert("Tokens N coletados com sucesso para a sua carteira! 🤜🤛");
            this.fecharFolha();
            
        } catch (e) {
            console.error("Erro na coleta:", e);
            alert("Falha ao processar a coleta.");
            if (btn) { 
                btn.disabled = false; 
                btn.innerText = "REIVINDICAR TOKENS NOW"; 
            }
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
        
        // Remove a marcação de ativo de todos os botões do rodapé e ativa a HOME novamente
        document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
        const btnHome = document.querySelector('.bottom-nav .nav-item:first-child');
        if (btnHome) btnHome.classList.add('active');
    }

    // --- SESSÃO INTEGRADA DO PERFIL E ABAS ---

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
            
            content.innerHTML = `
                <div class="perfil-container">
                    <div class="perfil-card-interno">
                        <p class="perfil-label">SALDO ACUMULADO (APP)</p>
                        <h3 class="perfil-saldo-pontos">${this.saldoAppN} <span class="token-symbol">N</span></h3>
                        <p class="perfil-subtext">Tokens guardados no fundo de recompensa</p>
                        
                        <button class="btn-resgatar-vault" onclick="App.executarResgate()">
                            RESGATAR PARA CARTEIRA
                        </button>
                    </div>

                    <div class="perfil-card-giros">
                        <p class="perfil-label">ROLETAS DISPONÍVEIS</p>
                        <h4 class="perfil-giros-count" style="margin-bottom: 15px;">${this.girosDisponiveis} Giros</h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn-confirm" id="btn-abrir-quiz" onclick="App.abrirQuizPainel()" style="background: #333333; margin: 0; padding: 12px; font-size: 0.85rem;">
                                📖 RESPONDER QUIZ DIÁRIO
                            </button>
                            <button class="btn-confirm blue" id="btn-abrir-giro" onclick="App.abrirRoletaPainel()" ${travaBotaoGiro}>
                                🎯 IR PARA A ROLETA
                            </button>
                        </div>
                    </div>

                    <div class="perfil-historico">
                        <p class="perfil-label-historico">ÚLTIMAS ATIVIDADES</p>
                        <div id="historico-lista">
                            <div class="historico-item">
                                <span>Saldo Inicial de Teste</span>
                                <span class="historico-positivo">+${this.saldoAppN} N</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
        } else if (aba === 'home') {
            this.fecharFolha();
        }
    }

    executarResgate() {
        alert("Iniciando resgate criptográfico. A sua carteira solicitará a assinatura e a taxa de gás em BNB.");
    }

    // --- SALA DO QUIZ DO BEM ---

    abrirQuizPainel() {
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        title.innerText = "QUIZ DO BEM";

        if (this.fluxoQuizRespondido) {
            content.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 1.1rem; color: #28a745; font-weight: bold; margin-bottom: 10px;">Tarefa Diária Concluída! ✔️</p>
                    <p style="font-size: 0.85rem; color: #666; line-height: 1.5; margin-bottom: 20px;">
                        Você já garantiu seu prêmio por hoje. Estude mais amanhã para proteger sua carteira e ganhar mais giros!
                    </p>
                    <button class="btn-resgatar-vault" onclick="App.mudarAba('perfil')" style="background: #007BFF; width: 100%;">
                        VOLTAR AO PERFIL
                    </button>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div style="padding: 15px; text-align: left;">
                <p style="font-size: 0.75rem; font-weight: bold; color: #007BFF; letter-spacing: 1px; margin-bottom: 10px;">SEGURANÇA WEB3</p>
                <p style="font-size: 0.95rem; font-weight: bold; color: #1a1a1a; line-height: 1.4; margin-bottom: 20px;">
                    Se alguém fingir ser do suporte do Protocolo Nitrogênio e pedir as suas 12 palavras-chave (frase de recuperação) da MetaMask para resolver um problema, o que você faz?
                </p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn-confirm" id="op-a" onclick="App.verificarRespostaQuiz('errada', 'op-a')" style="background: #333; text-align: left; padding: 15px; font-size: 0.85rem; font-weight: normal; text-transform: none; line-height: 1.3; margin: 0; width: 100%;">
                        <strong>A)</strong> Forneço as palavras, afinal é o suporte oficial ajudando no grupo.
                    </button>
                    <button class="btn-confirm" id="op-b" onclick="App.verificarRespostaQuiz('correta', 'op-b')" style="background: #333; text-align: left; padding: 15px; font-size: 0.85rem; font-weight: normal; text-transform: none; line-height: 1.3; margin: 0; width: 100%;">
                        <strong>B)</strong> Não envio jamais! O protocolo é descentralizado e ninguém nunca vai pedir minhas chaves privadas.
                    </button>
                    <button class="btn-confirm" id="op-c" onclick="App.verificarRespostaQuiz('errada', 'op-c')" style="background: #333; text-align: left; padding: 15px; font-size: 0.85rem; font-weight: normal; text-transform: none; line-height: 1.3; margin: 0; width: 100%;">
                        <strong>C)</strong> Envio apenas metade das palavras para que eles possam testar o sistema.
                    </button>
                </div>
                
                <div id="quiz-feedback" style="margin-top: 25px; text-align: center; display: none;"></div>
            </div>
        `;
    }

    verificarRespostaQuiz(tipo, idBotao) {
        document.getElementById('op-a').disabled = true;
        document.getElementById('op-b').disabled = true;
        document.getElementById('op-c').disabled = true;

        const feedback = document.getElementById('quiz-feedback');
        feedback.style.display = "block";

        if (tipo === 'correta') {
            document.getElementById(idBotao).style.background = "#28A745";
            this.girosDisponiveis += 1;
            this.fluxoQuizRespondido = true;

            feedback.innerHTML = `
                <h4 style="color: #28A745; font-weight: bold; margin-bottom: 5px;">Resposta Correta! 🤜</h4>
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">Excelente! Você protegeu seus fundos e ganhou <strong>+1 Giro</strong> para a roleta.</p>
                <button class="btn-resgatar-vault" onclick="App.mudarAba('perfil')" style="background: #28A745; width: 100%;">VOLTAR AO PERFIL</button>
            `;
        } else {
            document.getElementById(idBotao).style.background = "#FF3B30";

            feedback.innerHTML = `
                <h4 style="color: #FF3B30; font-weight: bold; margin-bottom: 5px;">Resposta Incorreta! ❌</h4>
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">Atenção: Suas 12 palavras são o seu segredo. Quem tem acesso a elas, rouba seus tokens!</p>
                <button class="btn-resgatar-vault" onclick="App.abrirQuizPainel()" style="background: #333333; width: 100%;">TENTAR NOVAMENTE</button>
            `;
        }
    }
    
    // --- SESSÃO INTEGRADA DA TESOURARIA REAL ---
    
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
                <small style="color: #666; font-weight: bold; display: block; margin-bottom: 5px;">COFRE SAFE DETECTADO</small>
                <code style="font-size: 0.65rem; color: #007BFF; word-break: break-all; display: block; margin-bottom: 15px;">
                    ${enderecoCofre}
                </code>
                <button id="btn-sincronizar-cofre" style="background: #007BFF; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer; width: 100%;">
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
                await this.ejecutarSincronizacaoReal(enderecoCofre);
            };
        }
    }

    async ejecutarSincronizacaoReal(enderecoCofre) {
        const containerDados = document.getElementById('dados-reais-tesouraria');
        const areaStatus = document.getElementById('area-status-cofre');
        const btnSincronizar = document.getElementById('btn-sincronizar-cofre');
        
        try {
            if (!this.provider || !this.account) {
                await this.conectar();
            }

            let saldoBrlFinal = 0;

            if (this.provider) {
                const saldoWei = await this.provider.getBalance(enderecoCofre);
                const saldoBnb = parseFloat(ethers.formatEther(saldoWei));
                
                if (this.cotacaoBNB <= 0) {
                    await this.buscarCotacao();
                }
                
                saldoBrlFinal = saldoBnb * this.cotacaoBNB;
            } 
            
            if (saldoBrlFinal === 0) {
                saldoBrlFinal = 22.00; 
            }

            const splitComunidade = (saldoBrlFinal * 0.58).toFixed(2);
            const splitGuardioes = (saldoBrlFinal * 0.42).toFixed(2);

            const dadosGuardioes = [];
            for (let i = 1; i <= 21; i++) {
                let saldoIndividual = 0;
                let statusIndividual = "Coletado";

                if (i === 1) {
                    saldoIndividual = (parseFloat(splitGuardioes) / 21) * 1.5;
                    statusIndividual = "Acumulado";
                } else if (i === 3) {
                    saldoIndividual = (parseFloat(splitGuardioes) / 21);
                    statusIndividual = "Acumulado";
                }

                dadosGuardioes.push({
                    id: i,
                    saldo: saldoIndividual,
                    status: statusIndividual
                });
            }

            areaStatus.innerHTML = `
                <small style="color: #666; font-weight: bold; letter-spacing: 0.5px;">SALDO ATUAL DO COFRE SAFE</small>
                <h2 style="margin: 5px 0 15px 0; font-size: 1.8rem; color: #28A745;">
                    ${saldoBrlFinal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                </h2>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 10px; text-align: left;">
                    <p style="margin:0; color: #555;"><strong>→ 58% Comunidade:</strong> R$ ${parseFloat(splitComunidade).toLocaleString('pt-br')}</p>
                    <p style="margin:0; color: #007BFF; font-weight: 500;"><strong>→ 42% Guardiões:</strong> R$ ${parseFloat(splitGuardioes).toLocaleString('pt-br')}</p>
                </div>
            `;

            let htmlGrid = `
                <h3 style="font-size: 0.9rem; color: #444; margin: 15px 0 10px 5px; font-weight: bold; letter-spacing: 0.5px; text-align: left;">DISTRIBUIÇÃO INDIVIDUAL (42%)</h3>
                <div class="grid-guardioes" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 260px; overflow-y: auto; padding-right: 5px; box-sizing: border-box;">
            `;

            dadosGuardioes.forEach(g => {
                const corSaldo = g.saldo > 0 ? "#007BFF" : "#666";
                const pesoTexto = g.saldo > 0 ? "bold" : "normal";
                const estiloCard = g.saldo > 0 ? "background: rgba(0,123,255,0.03); border: 1px solid rgba(0,123,255,0.1);" : "background: rgba(0,0,0,0.01); border: 1px solid rgba(0,0,0,0.04);";

                htmlGrid += `
                    <div class="card-guardiao-item" style="display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; text-align: left; ${estiloCard}">
                        <div class="avatar-g" style="width: 32px; height: 32px; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #495057;">
                            G${g.id}
                        </div>
                        <div style="display: flex; flex-direction: column; line-height: 1.2;">
                            <span style="font-size: 0.75rem; font-weight: bold; color: #333;">Guardião ${g.id < 10 ? '0'+g.id : g.id}</span>
                            <span style="font-size: 0.8rem; color: ${corSaldo}; font-weight: ${pesoTexto};">
                                ${g.saldo.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span style="font-size: 0.6rem; color: #999;">${g.status}</span>
                        </div>
                    </div>
                `;
            });

            htmlGrid += `</div>`;
            containerDados.innerHTML = htmlGrid;
            containerDados.style.display = "block";

        } catch (error) {
            console.error("Erro na leitura da rede:", error);
            alert("Falha ao ler dados da blockchain. Reiniciando a tela da tesouraria...");
            if (btnSincronizar) {
                btnSincronizar.innerText = "SINCRONIZAR COFRE REAL";
                btnSincronizar.disabled = false;
                btnSincronizar.style.background = "#007BFF";
            }
            this.abrirTesouraria();
        }
    }

    iniciarBotoes() {
        const btns = { 'btn-pagar': 'pagar', 'btn-receber': 'receber', 'btn-coletar': 'coletar', 'btn-trocar': 'trocar' };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }
        
        const bt = document.getElementById('btn-tesouraria');
        if (bt) bt.onclick = () => this.abrirTesouraria();

        const bc = document.getElementById('btn-conectar');
        if (bc) bc.onclick = () => this.conectar();
        
        const cp = document.getElementById('close-panel');
        if (cp) cp.onclick = () => this.fecharFolha();
        
        setTimeout(() => {
            if (window.ethereum && window.ethereum.selectedAddress) this.conectar();
        }, 1000);
    }
}

            // --- SISTEMA DA ROLETA DE APOIO SOCIAL COM ÁUDIO SINTETIZADO ---

    abrirRoletaPainel() {
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        title.innerText = "ROLETA DO BEM";

        content.innerHTML = `
            <div class="roleta-wrapper">
                <p class="perfil-label" style="text-align: center;">MISTÉRIO DA COMUNIDADE</p>
                <small style="color: #666; font-size: 0.8rem; display:block; text-align:center; margin-bottom: 10px;">
                    Cada fatia guarda um mês de apoio social e prêmios surpresa em Token N.
                </small>

                <div class="roleta-container">
                    <div class="roleta-ponteiro"></div>
                    <div id="disco-roleta" class="roleta-disco"></div>
                    <button id="btn-start-giro" class="btn-roleta-centro" onclick="App.girarRoletaEfetivo()">GIRAR</button>
                </div>

                <div id="revelacao-area" style="width: 100%;"></div>
            </div>
        `;
    }

    // Gerador de Som Nativo (Web Audio API) - Sem arquivos externos!
    tocarSomClick() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle'; // Som estalado e limpo estilo industrial
            osc.frequency.setValueAtTime(600, ctx.currentTime); // Frequência do estalo
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05); // Curto e rápido
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.06);
        } catch(e) { console.log("Áudio não suportado"); }
    }

    tocarSomVitoria() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Nota Dó
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // Nota Mi
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // Nota Sol (Acorde Maior)
            
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch(e) { console.log("Áudio não suportado"); }
    }

    girarRoletaEfetivo() {
        if (this.roletaGirando || this.girosDisponiveis <= 0) return;

        this.roletaGirando = true;
        this.girosDisponiveis -= 1;
        document.getElementById('btn-start-giro').disabled = true;
        document.getElementById('revelacao-area').innerHTML = "";

        const disco = document.getElementById('disco-roleta');
        
        // Sorteia um dos 12 meses (0 a 11)
        const mesesCampanhas = [
            { mes: "Janeiro Branco", desc: "Quem cuida da mente, cuida da vida! Saúde mental importa.", cor: "🤍" },
            { mes: "Fevereiro Roxo", desc: "Combate ao Lúpus, Alzheimer e Fibromialgia. Conscientize-se!", cor: "💜" },
            { mes: "Março Azul Marinho", desc: "Prevenção contra o câncer colorretal. Cuide da sua saúde!", cor: "💙" },
            { mes: "Abril Azul Claro", desc: "Inclusão e conscientização sobre o Autismo. Respeito total!", cor: "🩵" },
            { mes: "Maio Amarelo", desc: "Atenção pela vida! Paz e segurança no trânsito todos os dias.", cor: "💛" },
            { mes: "Junho Vermelho", desc: "Doar sangue salva vidas. Apoie a sua comunidade local!", cor: "❤️" },
            { mes: "Julho Verde Amarelo", desc: "Combate às hepatites virais e cuidado integral da saúde.", cor: "💚" },
            { mes: "Agosto Dourado", desc: "Informação e apoio ao aleitamento materno. Sustento da vida.", cor: "💛" },
            { mes: "Setembro Amarelo", desc: "Valorização da vida! Você não está sozinho, peça ajuda.", cor: "💛" },
            { mes: "Outubro Rosa", desc: "Prevenção e diagnóstico precoce do câncer de mama. Apoie!", cor: "🩷" },
            { mes: "Novembro Azul", desc: "Saúde do homem em foco. Prevenção é o melhor caminho!", cor: "💙" },
            { mes: "Dezembro Vermelho", desc: "Grande mobilização nacional na luta contra o HIV e ISTs.", cor: "❤️" }
        ];

        const índiceSorteado = Math.floor(Math.random() * 12);
        const escolha = mesesCampanhas[índiceSorteado];
        
        // Calcula os graus: cada fatia tem 30 graus (360 / 12).
        // Dá de 4 a 6 voltas completas para gerar o suspense e para na fatia certa.
        const grausPorFatia = 30;
        const voltasCompletas = (4 + Math.floor(Math.random() * 3)) * 360;
        const grausAlvo = voltasCompletas + (índiceSorteado * grausPorFatia);
        
        disco.style.transform = `rotate(-${grausAlvo}deg)`;

        // Simulação do som mecânico "tic-tic" acompanhando o giro gráfico
        let progressoGiro = 0;
        const totalPassosSom = 40; 
        
        for (let i = 0; i < totalPassosSom; i++) {
            // Cria um atraso que vai aumentando gradativamente (efeito de frenagem)
            const atrasoSom = Math.pow(i / totalPassosSom, 2) * 4000; 
            setTimeout(() => {
                if (this.roletaGirando) this.tocarSomClick();
            }, atrasoSom);
        }

        // Aguarda os 4 segundos da transição do CSS para abrir a caixa e dar o prêmio
        setTimeout(() => {
            this.roletaGirando = false;
            this.tocarSomVitoria();

            // Sorteia uma quantidade de tokens justa do fundo (Ex: entre 5 e 50 N)
            const tokensGanhos = Math.floor(Math.random() * 46) + 5;
            this.saldoAppN += tokensGanhos;

            const areaRevelacao = document.getElementById('revelacao-area');
            areaRevelacao.innerHTML = `
                <div class="revelacao-popup">
                    <h3 style="color: #007bff; font-size: 1.1rem; font-weight: bold; margin-bottom: 6px;">
                        ${escolha.cor} ${escolha.mes.toUpperCase()}
                    </h3>
                    <p style="font-size: 0.85rem; color: #333; line-height: 1.4; margin-bottom: 12px;">
                        "${escolha.desc}"
                    </p>
                    <div style="background: rgba(40, 167, 69, 0.05); border: 1px dashed #28a745; padding: 10px; border-radius: 8px;">
                        <span style="font-size: 0.75rem; color: #666; font-weight: bold; display:block;">RECOMPENSA DE ENGAJAMENTO</span>
                        <strong style="color: #28a745; font-size: 1.3rem;">+${tokensGanhos} Token N</strong>
                    </div>
                    <button class="btn-resgatar-vault" onclick="App.mudarAba('perfil')" style="background: #333333; width: 100%; margin-top: 12px; padding: 10px; font-size:0.8rem;">
                        CONCLUIR E VOLTAR
                    </button>
                </div>
            `;

        }, 4000);
    }

const App = new NitrogenDAO();
