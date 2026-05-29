        }
    }

    // --- 🟢 FUNÇÃO NOVA: ADICIONADA PARA FAZER OS BOTÕES DO SEU HTML (G21, TESO...) FUNCIONAREM ---
    abrirSalaInterna(idSala) {
        const container = document.getElementById('conteudo-subsala-governanca');
        if (!container) return;

        // Limpa a tela antes de abrir a nova sala clicada
        container.innerHTML = '';

        if (idSala === 'g21') {
            const template = document.getElementById('sala-g21');
            if (template) container.appendChild(template.content.cloneNode(true));
        } 
        else if (idSala === 'teso') {
            const template = document.getElementById('sala-teso');
            if (template) {
                container.appendChild(template.content.cloneNode(true));
                if (typeof this.atualizarSaldosCofre === 'function') this.atualizarSaldosCofre();
            }
        } 
        else if (idSala === 'comunidade') {
            const template = document.getElementById('sala-comunidade');
            if (template) container.appendChild(template.content.cloneNode(true));
        } 
        else if (idSala === 'recom') {
            const template = document.getElementById('sala-recom');
            if (template) container.appendChild(template.content.cloneNode(true));
        }
    }

    fecharFolhaSala(idFolha) {
        const painelAbas = document.getElementById(`sheet-${idFolha}`);
        if (painelAbas) {
            painelAbas.classList.remove('active');
        }
        
        const painelLateral = document.getElementById('side-panel');
        if (painelLateral) {
            painelLateral.classList.remove('active');
        }
        
        // Remove active de todas as abas e força o foco visual na Home
        document.querySelectorAll('.cmc-footer-nav .cmc-nav-item, .bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
        const btnHome = document.getElementById('nav-home');
        if (btnHome) btnHome.classList.add('active');

        // Reset do conteúdo do painel lateral para evitar retenção de lixo visual
        const content = document.getElementById('panel-content');
        if (content && !painelAbas) content.innerHTML = '';
        
        // Limpa o conteúdo interno da governança ao fechar para não ficar acumulado
        const containerGov = document.getElementById('conteudo-subsala-governanca');
        if (containerGov) containerGov.innerHTML = '';
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

    responderQuiz(opcaoCorreta) {
        if (opcaoCorreta) { 
            this.girosDisponiveis += 1; 
            this.tocarSomVitoria();
            alert("Correto! Ganhou +1 Giro para a Roleta! 🚀");
            this.atualizarSaldosInterface(); 
            this.fecharFolha(); 
        } else {
            alert("Resposta incorreta. Estude mais um pouco e tente novamente!");
        }
    }

    renderizarPerguntaQuiz() {
        const content = document.getElementById('panel-content');
        if (!content) return;

        if (this.perguntaAtualIndex >= this.perguntasQuiz.length) {
            alert("Quiz finalizado! Use seus giros na Roleta do Bem. 🎯");
            this.fecharFolhaSala('recompensas');
            return;
        }

        const dadosQuiz = this.perguntasQuiz[this.perguntaAtualIndex];
        
        let botoesHTML = "";
        dadosQuiz.opcoes.forEach((opcao, index) => {
            botoesHTML += `
                <button 
                    type="button" 
                    id="btn-quiz-opcao-${index}" 
                    style="background: #007BFF; color: white; border: none; padding: 16px; border-radius: 12px; font-weight: bold; font-size: 0.85rem; cursor: pointer; width: 100%; text-align: center; transition: background 0.3s;"
                    onclick="App.verificarRespostaQuiz(${index})"
                >
                    ${opcao}
                </button>
            `;
        });

        content.innerHTML = `
            <div class="quiz-container" style="padding: 10px 0; display: flex; flex-direction: column; gap: 15px;">
                <div style="background: #ffffff; padding: 16px; border-radius: 16px; border: 1px solid #f0f0f0; text-align: left;">
                    <span style="font-size: 0.75rem; color: #666; font-weight: bold;">Pergunta ${this.perguntaAtualIndex + 1} de 3</span>
                    <h3 style="margin: 8px 0 0 0; font-size: 1.05rem; color: #1a1a1a; font-weight: 800; line-height: 1.4;">
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
            inputQtd.style.display = 'none';
            btnTravar.style.display = 'none';
            
            const dataLiberacao = new Date(parseInt(this.poupancaData) + (30 * 24 * 60 * 60 * 1000));
            const hoje = new Date();
            
            if(hoje >= dataLiberacao) {
                txtStatus.innerHTML = `<span style="color:var(--green); font-weight:bold;">✓ Seu prazo de 30 dias encerrou!</span><br>Saldo Trancado: ${this.poupancaSaldo} N.<br>Disponível para resgate imediato com +1% de juros.`;
                btnResgatar.style.display = 'block';
            } else {
                const diasRestantes = Math.ceil((dataLiberacao - hoje) / (1000 * 60 * 60 * 24));
                txtStatus.innerHTML = `<span style="color:orange; font-weight:bold;">🔒 Fundos Trancados na Poupança</span><br>Saldo: ${this.poupancaSaldo} N.<br>Desbloqueio em <strong>${diasRestantes} dias</strong>.`;
                btnResgatar.style.display = 'none';
            }
        } else {
            inputQtd.style.display = 'block';
            btnTravar.style.display = 'block';
            btnResgatar.style.display = 'none';
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
            if(caixa) {
                caixa.classList.remove('concluido', 'atual');
            }
        }
        
        for(let i = 1; i <= this.checkinDiasConsecutivos; i++) {
            const caixa = document.getElementById(`checkin-d${i}`);
            if(caixa) {
                caixa.classList.add('concluido'); 
            }
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
                btn.style.background = "var(--blue)";
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
                caixaPresente.classList.remove('apagado');
                caixaPresente.style.opacity = "1";
                caixaPresente.style.cursor = "pointer";
                caixaPresente.onclick = () => this.resgatarPresenteSurpresa();
            } else {
                caixaPresente.classList.add('apagado');
                caixaPresente.classList.remove('aceso');
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
        const hojeString = hoje.getFullYear() + '-' + 
                           String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(hoje.getDate()).padStart(2, '0');
        
        if (this.checkinUltimaData === hojeString) {
            return alert("Você já garantiu seu giro hoje. Volte amanhã!");
        }
        
        if (isNaN(this.checkinDiasConsecutivos) || this.checkinDiasConsecutivos === null || this.checkinDiasConsecutivos === undefined) {
            this.checkinDiasConsecutivos = 0;
        }
        
        let quebrouSequencia = true;
        if (this.checkinUltimaData) {
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);
            const ontemString = ontem.getFullYear() + '-' + 
                                String(ontem.getMonth() + 1).padStart(2, '0') + '-' + 
                                String(ontem.getDate()).padStart(2, '0');
                                
            if (this.checkinUltimaData === ontemString) {
                quebrouSequencia = false;
            }
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
            alert("🔥 Incrível! Você completou a sequência de 7 dias! A CAIXA SURPRESA FOI DESBLOQUEADA, clique nela abaixo para resgatar seu prêmio especial! 🎉");
        } else {
            this.girosDisponiveis += 1; 
            this.tocarSomClick();
            alert(`Check-in confirmed! +1 Giro adicionado ao seu perfil (Dia ${this.checkinDiasConsecutivos}/7).`);
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
        alert(`🎁 SENSACIONAL, BOSS!\n\nVocê abriu a Caixa Surpresa e faturou mais de +${this.premioSurpresaGiros} GIROS EXTRAS direto na sua conta!\n\nAproveite esse impulso do mês e quebre a banca na Roleta do Bem! 🚀`);
        
        this.salvarDadosDApp();
        this.atualizarLayoutCheckIn();
        this.atualizarSaldosInterface();
    }

    girarRoleta() {
        if(this.roletaGirando) return;
        if(this.girosDisponiveis <= 0) return alert("Você não possui Giros Disponíveis. Conclua tarefas para ganhar mais!");
        
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
