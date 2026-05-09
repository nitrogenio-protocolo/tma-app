class NitrogenDAO {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.scanner = null;
        this.cotacaoBNB = 3100.00; // Valor base inicial
        this.iniciarBotoes();
        this.atualizarCotacaoReal(); // Busca preço real da API
    }

    // Busca o preço real do BNB em BRL via API da Binance
    async atualizarCotacaoReal() {
        try {
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBBRL');
            const data = await response.json();
            this.cotacaoBNB = parseFloat(data.price);
            console.log("Cotação Atualizada BNB/BRL: ", this.cotacaoBNB);
        } catch (e) {
            console.error("Erro ao buscar cotação, usando base fixa.");
        }
    }

    async conectar() {
        if (!window.ethereum) return alert("Abra no navegador da sua Carteira!");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            
            const btn = document.getElementById('btn-conectar');
            btn.innerText = "CARTEIRA ATIVA";
            btn.classList.add('conectado');
            
            // Atualiza o saldo e inicia o loop de oscilação
            this.atualizarSaldo();
            setInterval(() => this.atualizarSaldo(), 5000); // Atualiza a cada 5 segundos
        } catch (e) { 
            console.error(e); 
        }
    }

    async atualizarSaldo() {
        if(!this.provider || !this.account) return;
        try {
            await this.atualizarCotacaoReal(); // Garante que a conversão está em dia
            const s = await this.provider.getBalance(this.account);
            const bnbValue = parseFloat(ethers.formatEther(s));
            const brlValue = bnbValue * this.cotacaoBNB;

            // Formata para Real Brasileiro
            const formatador = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            document.getElementById('display-bnb').innerText = formatador.format(brlValue);
        } catch (e) {
            console.error("Erro ao carregar saldo:", e);
        }
    }

    // ... (Mantenha o restante das funções abrirFolha, etc., sem alterações)
}
