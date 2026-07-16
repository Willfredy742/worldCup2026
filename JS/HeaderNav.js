class HeaderNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="MainHeader">

                <div class="TitleAndLogo">
                    <img class="HeaderLogo" src="../Img/RL_U59_FIFAWorldCupLTE_Logo.webp" alt="Logo oficial de la Copa del Mundo 2026"/>
                    <h1 class="HeaderTitle">FIFA WORLD CUP 2026</h1>
                </div>

            </header>

            <nav class="MainNav">

                <div class="NavItem">
                    <a class="NavLink" href="../index.html">Inicio</a>
                </div>

                <div class="NavItem">
                    <a class="NavLink" href="../HTML/gamesResult.html">Resultados</a>
                </div>

                <div class="NavItem">
                    <a class="NavLink" href="../HTML/Groups.html">Grupos</a>
                </div>

                <div class="NavItem">
                    <a class="NavLink" href="../HTML/eliminationTree.html">Eliminatorias</a>
                </div>

                <div class="NavItem">
                    <a class="NavLink" href="RUTA_HACIA_LA_PAGINA_DE_ESTADISTICAS">Estadisticas</a>
                </div>

            </nav>
        `;
    }
}

customElements.define("header-nav", HeaderNav);
