
/* Efeito de Apagar/Aparecer (Fade) */
.folha-fade {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #ffffff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    opacity: 0; visibility: hidden;
    transition: opacity 0.6s ease, visibility 0.6s;
    z-index: 10;
}
.folha-fade.visivel { opacity: 1; visibility: visible; }

/* Botões e Caixas Estilo Clean */
.btn-proximo {
    background: #0056b3; color: white;
    border: none; padding: 15px 40px;
    border-radius: 8px; margin-top: 20px;
    font-weight: bold; cursor: pointer;
}
.btn-proximo:disabled { background: #cccccc; cursor: not-allowed; }

/* Overlay do Mint (A meia-folha) */
.mint-overlay {
    position: fixed;
    bottom: -100%; left: 0; width: 100%;
    height: 50%; background: #f4f7f6;
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    z-index: 100; border-radius: 25px 25px 0 0;
    box-shadow: 0 -5px 15px rgba(0,0,0,0.1);
}
.mint-overlay.metade { bottom: 0; height: 50%; }
.mint-overlay.cheia { bottom: 0; height: 100%; border-radius: 0; }
