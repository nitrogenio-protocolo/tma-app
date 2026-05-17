class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3400.00; 
        this.ultimaAtualizacao = 0;
        
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

    async ejecutarColetaEfetiva(quantidade, nonce) {
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
    }

    // --- SESSÃO INTEGRADA DA TESOURARIA REAL ---
    
    abrirTesouraria() {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        
        if(this.scanner) { this.scanner.stop().catch(()=>{}); this.scanner = null; }
        
        title.innerText = "TESOURARIA DETALHADA";
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
                await this.executarSincronizacaoReal(enderecoCofre);
            };
        }
    }

    async ejecutarSincronizacaoReal(enderecoCofre) {
        const containerDados = document.getElementById('dados-reais-tesouraria');
        const areaStatus = document.getElementById('area-status-cofre');
        
        try {
            let saldoBrlFinal = 0;

            if (this.provider) {
                const saldoWei = await this.provider.getBalance(enderecoCofre);
                const saldoBnb = parseFloat(ethers.formatEther(saldoWei));
                saldoBrlFinal = saldoBnb * this.cotacaoBNB;
            } else {
                const saldoDolarMock = 4.00; 
                saldoBrlFinal = saldoDolarMock * 5.50; 
            }

            const splitComunidade = (saldoBrlFinal * 0.58).toFixed(2);
            const splitGuardioes = (saldoBrlFinal * 0.42).toFixed(2);

            const dadosGuardioes = [
                { id: 1, saldo: saldoBrlFinal > 0 ? (splitGuardioes / 21) * 1.5 : 0, status: "Acumulado" },
                { id: 2, saldo: 0, status: "Coletado" },
                { id: 3, saldo: saldoBrlFinal > 0 ? (splitGuardioes / 21) : 0, status: "Acumulado" },
                { id: 4, saldo: 0, status: "Coletado" },
                { id: 5, saldo: 0, status: "Coletado" },
                { id: 6, saldo: 0, status: "Coletado" },
                { id: 7, saldo: 0, status: "Coletado" },
                { id: 8, saldo: 0, status: "Coletado" },
                { id: 9, saldo: 0, status: "Coletado" },
                { id: 10, saldo: 0, status: "Coletado" },
                { id: 11, saldo: 0, status: "Coletado" },
                { id: 12, saldo: 0, status: "Coletado" },
                { id: 13, saldo: 0, status: "Coletado" },
                { id: 14, saldo: 0, status: "Coletado" },
                { id: 15, saldo: 0, status: "Coletado" },
                { id: 16, saldo: 0, status: "Coletado" },
                { id: 17, saldo: 0, status: "Coletado" },
                { id: 18, saldo: 0, status: "Coletado" },
                { id: 19, saldo: 0, status: "Coletado" },
                { id: 20, saldo: 0, status: "Coletado" },
                { id: 21, saldo: 0, status: "Coletado" }
            ];

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
                <div class="grid-guardioes" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 5px; box-sizing: border-box;">
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
            alert("Falha ao ler dados da blockchain. Verifique sua conexão.");
            this.abrirTesouraria();
        }
    }

    iniciarBotoes() {
        const btns = { 'btn-pagar': 'pagar', 'btn-receber': 'receber', 'btn-coletar': 'coletar', 'btn-trocar': 'trocar' };
        for (let id in btns) {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.abrirFolha(btns[id]);
        }
        
        // Ativando o clique do botão da Tesouraria de forma limpa
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

const App = new NitrogenDAO();
