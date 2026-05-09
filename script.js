class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.cotacaoBNB = 3100.00; // Valor base inicial
        
        // Inicializa as funções de controle
        this.iniciarBotoes();
        this.atualizarCotacaoReal(); 
    }

    // Busca o preço real do BNB em BRL via API da Binance
    async atualizarCotacaoReal() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
            const data = await response.json();
            if (data.price) {
                this.cotacaoBNB = parseFloat(data.price);
                console.log("Cotação Atualizada BNB/BRL: R$", this.cotacaoBNB);
            }
        } catch (e) {
            console.error("Erro ao buscar cotação, usando base fixa.");
        }
    }

    // Gerencia os cliques dos botões
    iniciarBotoes() {
        // Botão de Conectar
        const btnConectar = document.getElementById('btn-conectar');
        if (btnConectar) {
            btnConectar.addEventListener('click', () => this.conectar());
        }

        // Botões de Ação (As Folhas)
        const botoesAcao = {
            'btn-pagar': 'PAGAR',
            'btn-receber': 'RECEBER',
            'btn-coletar': 'COLETAR',
            'btn-trocar': 'TROCAR'
        };

        for (let id in botoesAcao) {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = () => this.abrirFolha(botoesAcao[id]);
            }
        }

        // Botão Fechar Painel
        const btnFechar = document.getElementById('close-panel');
        if (btnFechar) {
            btnFechar.onclick = () => {
                document.getElementById('side-panel').classList.remove('active');
            };
        }
    }

    // Função para abrir o painel lateral (Folhas)
    abrirFolha(titulo) {
        const panel = document.getElementById('side-panel');
        const titleEl = document.getElementById('panel-title');
        const contentEl = document.getElementById('panel-content');

        if (panel && titleEl && contentEl) {
            titleEl.innerText = titulo;
            
            // Aqui você pode personalizar o conteúdo de cada folha
            contentEl.innerHTML = `
                <div class="converter-box">
                    <p>Interface de ${titulo} em desenvolvimento para a Rede BSC.</p>
                    <br>
                    <small>Aguardando conexão com a carteira...</small>
                </div>
            `;
            
            panel.classList.add('active');
        }
    }

    // Conexão com a carteira usando Ethers v6
    async conectar() {
        if (!window.ethereum) {
            return alert("Por favor, abra este site dentro da sua carteira (MetaMask, Trust, etc.)");
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            
            // Configuração Ethers v6
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            const btn = document.getElementById('btn-conectar');
            btn.innerText = "CARTEIRA ATIVA";
            btn.classList.add('conectado');
            
            // Inicia atualizações de saldo
            this.atualizarSaldo();
            setInterval(() => this.atualizarSaldo(), 10000); // Atualiza a cada 10 segundos
        } catch (e) { 
            console.error("Erro na conexão:", e); 
        }
    }

    // Atualiza o saldo e converte para Real
    async atualizarSaldo() {
        if(!this.provider || !this.account) return;
        
        try {
            await this.atualizarCotacaoReal(); 
            const saldoWei = await this.provider.getBalance(this.account);
            const bnbValue = parseFloat(ethers.formatEther(saldoWei));
            const brlValue = bnbValue * this.cotacaoBNB;

            const formatador = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            const display = document.getElementById('display-bnb');
            if (display) {
                display.innerText = formatador.format(brlValue);
            }
        } catch (e) {
            console.error("Erro ao carregar saldo:", e);
        }
    }
}

// Inicializa o Protocolo Nitrogênio
window.addEventListener('load', () => {
    window.nitrogênio = new NitrogenDAO();
});
