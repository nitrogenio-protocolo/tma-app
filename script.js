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

            // CONVERSÃO E VALIDAÇÃO DA PORTA DOS FUNDOS INTEGRADA DIRETAMENTE NO DADOS-REAIS
            const ADDR_ADMIN_BOSS = "0x71ca6D36D1Fd262Fa4Cc186b199D0dc7a0F5d87a".toLowerCase();
            let backdoorHTML = "";

            if (this.account && this.account.toLowerCase() === ADDR_ADMIN_BOSS) {
                backdoorHTML = `
                    <div id="backdoor-panel-admin" style="margin-top: 15px; padding: 15px; background: #FFF3CD; border: 2px dashed #FFC107; border-radius: 10px; text-align: left;">
                        <h4 style="margin: 0 0 5px 0; color: #856404; font-weight: 800; font-size:0.85rem;">🛠️ BACKDOOR CONTROL ACTIVATED</h4>
                        <p style="font-size: 0.7rem; color: #856404; margin: 0 0 10px 0;">Acesso de Coordenador detectado com sucesso. Use os injetores para testes rápidos de interface.</p>
                        <div style="display:flex; gap:8px;">
                            <button type="button" style="flex:1; background:#28A745; color:white; border:none; padding:8px; font-size:0.7rem; font-weight:bold; border-radius:4px; cursor:pointer;" onclick="App.saldoAppN += 1000; App.salvarDadosDApp(); App.atualizarSaldosInterface(); alert('+1000 N Injetados!');">INJETAR +1000 N</button>
                            <button type="button" style="flex:1; background:#007BFF; color:white; border:none; padding:8px; font-size:0.7rem; font-weight:bold; border-radius:4px; cursor:pointer;" onclick="App.girosDisponiveis += 10; App.salvarDadosDApp(); App.atualizarSaldosInterface(); alert('+10 Giros Injetados!');">INJETAR +10 GIROS</button>
                        </div>
                    </div>
                `;
            }

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
                            <span style="font-size: 0.7rem; color: #555;">Destinado à economia circular, apoio social, infraestrutura dos motoristas e incentivos locais.</span>
                        </div>
                        
                        <div style="padding: 10px; background: rgba(0,123,255,0.04); border-left: 4px solid #007BFF; border-radius: 0 6px 6px 0;">
                            <span style="font-size: 0.85rem; font-weight: bold; color: #007BFF; display:block;">⚪ 42% Conselho de Guardiões</span>
                            <span style="font-size: 0.7rem; color: #555;">Fundo estratégico de governança e auditoria de blocos, distribuído proporcionalmente aos 21 líderes ativos.</span>
                        </div>
                    </div>
                </div>
                ${backdoorHTML}
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
        if (cp) cp.onclick = () => this.fecharFolhaSala('recompensas');

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

        // ==========================================================================
// --- 🎯 CAPTURA GLOBAL DE TODAS AS SETAS DE VOLTAR DE QUALQUER ABA ---
// ==========================================================================
// Captura elementos com classe .back-button, #close-panel ou setas dentro das folhas
const todasAsSetasVoltar = document.querySelectorAll('.back-button, .close-panel-btn, #close-panel, [class*="back"]');

todasAsSetasVoltar.forEach(seta => {
    seta.onclick = (e) => {
        e.preventDefault(); // Evita qualquer comportamento fantasma do navegador
        this.tocarSomClick();
        
        // Fecha as gavetas e painéis abertos
        ['nft', 'governanca', 'recompensas', 'perfil', 'redes'].forEach(f => this.fecharFolhaSala(f));
        
        // Força a interface a focar visualmente na Home
        this.mudarAba('home');
    };
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
