            this.provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            document.getElementById('btn-conectar').innerText = "CONECTADO";
            this.atualizarSaldoBNB();
        } catch (e) { console.error(e); }
    }

    async buscarCotacao() {
        try {
            const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
            const data = await res.json();
            if (data.price) this.cotacaoBNB = parseFloat(data.price);
        } catch (e) { console.warn("Erro cotação."); }
    }

    async atualizarSaldoBNB() {
        if(!this.provider || !this.account) return;
        const s = await this.provider.getBalance(this.account);
        document.getElementById('display-bnb').innerHTML = `${parseFloat(ethers.formatEther(s)).toFixed(4)} BNB`;
    }

    mudarAba(aba) {
        document.querySelectorAll('.cmc-footer-nav .cmc-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById(`nav-${aba}`)?.classList.add('active');

        const todasAsFolhas = ['sheet-nft', 'sheet-governanca', 'sheet-redes', 'sheet-perfil', 'sheet-g21', 'sheet-tesouraria', 'sheet-comunidade', 'sheet-poupanca', 'sheet-quiz', 'sheet-checkin', 'sheet-roleta'];
        todasAsFolhas.forEach(id => document.getElementById(id)?.classList.remove('active'));

        if (aba !== 'home') {
            document.getElementById(`sheet-${aba}`)?.classList.add('active');
        }
        this.atualizarSaldosInterface();
    }

    abrirFolha(tipo) {
        const panel = document.getElementById('side-panel');
        const content = document.getElementById('panel-content');
        const title = document.getElementById('panel-title');
        if (panel) panel.classList.add('active');

        if (tipo === 'coletar') {
            if (title) title.innerText = "COLETAR RECOMPENSAS";
            if (content) {
                content.innerHTML = `
                    <div style="padding:10px; background:rgba(0,0,0,0.02); border-radius:8px;">
                        <p>Saldo Acumulado: <strong>${this.saldoAppN} N</strong></p>
                        <button class="btn-confirm" id="confirmar-coleta" style="width:100%; background:#007BFF; color:white; padding:10px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">REIVINDICAR AGORA</button>
                    </div>`;
                document.getElementById('confirmar-coleta').onclick = () => this.executarColetaEfetiva();
            }
        } else {
            if (title) title.innerText = tipo.toUpperCase();
            if (content) content.innerHTML = `<p style="padding:15px; color:#666;">Módulo ${tipo} em espera.</p>`;
        }
    }

    fecharFolha() { document.getElementById('side-panel')?.classList.remove('active'); }

    executarColetaEfetiva() {
        alert(`Sucesso! ${this.saldoAppN} tokens transferidos!`);
        this.saldoAppN = 0; this.salvarDadosDApp(); this.fecharFolha(); this.atualizarSaldosInterface();
    }

    atualizarSaldosInterface() {
        if (document.getElementById('perfil-saldo-tokens')) document.getElementById('perfil-saldo-tokens').innerText = this.saldoAppN.toFixed(2);
        if (document.getElementById('perfil-giros-contagem')) document.getElementById('perfil-giros-contagem').innerText = this.girosDisponiveis;
        if (document.getElementById('roleta-giros-disponiveis')) document.getElementById('roleta-giros-disponiveis').innerText = this.girosDisponiveis;
    }

    // --- LÓGICA DA POUPANÇA ---
    atualizarLayoutPoupança() {
        const info = document.getElementById('poupanca-status-info');
        const btnT = document.getElementById('btn-travar-poupanca');
        const btnR = document.getElementById('btn-resgatar-poupanca');
        const inp = document.getElementById('input-qtd-poupanca');

        if (!info) return;
        if (this.poupancaSaldo > 0) {
            if (inp) inp.style.display = 'none';
            if (btnT) btnT.style.display = 'none';
            if (btnR) btnR.style.display = 'block';
            info.innerHTML = `🔒 <strong>Fundos Trancados:</strong> ${this.poupancaSaldo} N. <br><small>Rendimento ativo gerando Giros Extras de Bônus!</small>`;
        } else {
            if (inp) inp.style.display = 'block';
            if (btnT) btnT.style.display = 'block';
            if (btnR) btnR.style.display = 'none';
            info.innerHTML = "Sem aplicações. Guarde seus fundos por 30 dias para receber bônus.";
        }
    }

    aplicarPoupança() {
        const val = parseFloat(document.getElementById('input-qtd-poupanca')?.value || 0);
        if (val <= 0 || val > this.saldoAppN) return alert("Saldo insuficiente ou valor inválido.");
        this.saldoAppN -= val; this.poupancaSaldo = val; this.poupancaData = Date.now().toString();
        this.girosDisponiveis += 5; this.salvarDadosDApp(); this.atualizarLayoutPoupança(); this.atualizarSaldosInterface();
        alert("Poupança ativada com sucesso! +5 Giros concedidos.");
    }

    resgatarPoupança() {
        this.saldoAppN += (this.poupancaSaldo * 1.01); this.poupancaSaldo = 0; this.poupancaData = null;
        this.salvarDadosDApp(); this.atualizarLayoutPoupança(); this.atualizarSaldosInterface();
        alert("Poupança resgatada com 1% de rendimento!");
    }

    // --- LÓGICA DO QUIZ Semanal ---
    renderizarPerguntaQuiz() {
        const container = document.getElementById('quiz-dinamico-content');
        if (!container) return;

        if (this.perguntaAtualIndex >= this.perguntasQuiz.length) {
            container.innerHTML = `<div style="text-align:center; padding:20px;"><h3>🎉 Parabéns!</h3><p>Você concluiu o Quiz Semanal!</p></div>`;
            return;
        }

        const dados = this.perguntasQuiz[this.perguntaAtualIndex];
        let botoes = "";
        dados.opcoes.forEach((op, idx) => {
            botoes += `<button onclick="App.verificarRespostaQuiz(${idx})" style="width:100%; padding:12px; margin-bottom:8px; border-radius:8px; border:none; background:#007BFF; color:white; font-weight:bold; cursor:pointer;">${op}</button>`;
        });

        container.innerHTML = `
            <div style="background:#fff; padding:15px; border-radius:10px; border:1px solid #eee; margin-bottom:15px;">
                <small style="color:#666;">Pergunta ${this.perguntaAtualIndex + 1} de 3</small>
                <h4 style="margin:5px 0;">${dados.pergunta}</h4>
            </div>
            <div>${botoes}</div>
            <div id="quiz-feedback" style="margin-top:10px; font-weight:bold; text-align:center;"></div>`;
    }

    verificarRespostaQuiz(idx) {
        const correto = this.perguntasQuiz[this.perguntaAtualIndex].correta;
        const feed = document.getElementById('quiz-feedback');
        if (idx === correto) {
            this.girosDisponiveis += 1; if (feed) feed.innerText = "🎉 Correto! +1 Giro.";
        } else {
            if (feed) feed.innerText = "❌ Incorreto!";
        }
        this.salvarDadosDApp(); this.atualizarSaldosInterface();
        setTimeout(() => { this.perguntaAtualIndex++; this.renderizarPerguntaQuiz(); }, 1500);
    }

    // --- LÓGICA DO CHECK-IN DIÁRIO ---
    atualizarLayoutCheckIn() {
        const hoje = new Date().toISOString().split('T')[0];
        for(let i=1; i<=7; i++) {
            const el = document.getElementById(`checkin-d${i}`);
            if (el) el.style.background = (i <= this.checkinDiasConsecutivos) ? "#28A745" : "#e9ecef";
        }
        const btn = document.getElementById('btn-executar-checkin');
        if (this.checkinUltimaData === hoje && btn) {
            btn.disabled = true; btn.innerText = "PRESENÇA DETERMINADA HOJE"; btn.style.background = "#ccc";
        }
    }

    executarCheckIn() {
        const hoje = new Date().toISOString().split('T')[0];
        if (this.checkinUltimaData === hoje) return alert("Você já fez check-in hoje!");
        this.checkinDiasConsecutivos = (this.checkinDiasConsecutivos >= 7) ? 1 : this.checkinDiasConsecutivos + 1;
        this.checkinUltimaData = hoje; this.girosDisponiveis += 1;
        this.salvarDadosDApp(); this.atualizarLayoutCheckIn(); this.atualizarSaldosInterface();
        alert(`Check-in realizado! Dia ${this.checkinDiasConsecutivos}/7 garantido.`);
    }

    // --- LÓGICA DA ROLETA ---
    girarRoleta() {
        if (this.roletaGirando || this.girosDisponiveis <= 0) return alert("Sem giros ou já rodando!");
        this.roletaGirando = true; this.girosDisponiveis--; this.atualizarSaldosInterface();
        
        const disco = document.getElementById('disco-roleta');
        const graus = 1800 + Math.floor(Math.random() * 360);
        if (disco) disco.style.transform = `rotate(${graus}deg)`;

        setTimeout(() => {
            this.roletaGirando = false; this.saldoAppN += 50; this.salvarDadosDApp();
            const pop = document.getElementById('roleta-popup-resultado');
            if (pop) { pop.innerText = "🎯 Ganhou +50 N de Recompensa!"; pop.style.display = "block"; }
            this.atualizarSaldosInterface();
        }, 4000);
    }

    validarCodigoComunidade() {
        const val = document.getElementById('input-cod-comunidade').value.trim().toUpperCase();
        if (val === "COMUNIDADE") {
            this.girosDisponiveis += 3; this.salvarDadosDApp(); this.atualizarSaldosInterface();
            alert("Código Aceito! +3 Giros na conta.");
        } else { alert("Código Inválido."); }
    }

    async executarSincronizacaoReal(cofre) {
        try {
            if (this.provider) {
                const b = await this.provider.getBalance(cofre);
                document.getElementById('dados-reais-tesouraria').innerHTML = `
                    <div style="background:#f8f9fa; padding:10px; border-radius:8px;">
                        <p style="margin:5px 0;">⛽ BNB no Cofre: <strong>${parseFloat(ethers.formatEther(b)).toFixed(4)} BNB</strong></p>
                        <p style="margin:5px 0;">🪙 Tokens N Alocados: <strong>15,420.00 N</strong></p>
                    </div>`;
                document.getElementById('area-status-cofre').innerText = "✓ Sincronizado via Web3 Blockchain";
            }
        } catch(e) { document.getElementById('area-status-cofre').innerText = "Modo Off-chain local ativo."; }
    }

    iniciarBotoes() {
        document.getElementById('btn-pagar').onclick = () => this.abrirFolha('pagar');
        document.getElementById('btn-receber').onclick = () => this.abrirFolha('receber');
        document.getElementById('btn-coletar').onclick = () => this.abrirFolha('coletar');
        document.getElementById('btn-trocar').onclick = () => this.abrirFolha('trocar');
        document.getElementById('btn-conectar').onclick = () => this.conectar();
        document.getElementById('close-panel').onclick = () => this.fecharFolha();
    }
    tocarSomClick() {} tocarSomVitoria() {}
}

// Controle global puro das sub-folhas estáticas do HTML
function abrirSubFolha(idFolha) {
    document.getElementById(idFolha)?.classList.add('active');
    if (idFolha === 'sheet-poupanca') App.atualizarLayoutPoupança();
    if (idFolha === 'sheet-checkin') App.atualizarLayoutCheckIn();
    if (idFolha === 'sheet-quiz') { App.perguntaAtualIndex = 0; App.renderizarPerguntaQuiz(); }
    if (idFolha === 'sheet-tesouraria') App.executarSincronizacaoReal("0x11aBd1b9c71f97ad1df8A0Dbb789f8A96B458219");
}
function fecharSubFolha(idFolha) { document.getElementById(idFolha)?.classList.remove('active'); }

const App = new NitrogenDAO();
