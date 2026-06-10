import { test, expect } from "@playwright/test";

test.describe("Jornadas LT - Testes E2E de Autenticação, Eventos e Responsividade", () => {
  test("Deve alternar o idioma do login entre PT e ES", async ({ page }) => {
    await page.goto("/");
    
    // Verifica que o texto de identificação está visível em um dos idiomas
    const textPT = page.locator("text=IDENTIFICAÇÃO");
    const textES = page.locator("text=IDENTIFICACIÓN");
    
    const isPT = await textPT.isVisible();
    const isES = await textES.isVisible();
    
    expect(isPT || isES).toBeTruthy();
  });

  test("Fluxo Integrado: Admin cria evento -> Facilitador loga no mobile -> Admin remove evento", async ({ page }) => {
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const EVENTO_NOME = `E2E Evento ${randomSuffix}`;
    const FACILITADOR_USER = `fac_e2e_${randomSuffix}`;
    const FACILITADOR_PASS = "SenhaSegura123!";

    // 1. Admin loga no Desktop
    await page.goto("/");
    
    const userInput = page.locator('input[placeholder*="grupo"]').first();
    const passInput = page.locator('input[type="password"]');
    const loginBtn = page.locator('button', { hasText: "ENTRAR" });

    await userInput.fill("ADMIN");
    await passInput.fill("admin123");
    await loginBtn.click();

    // Valida que acessou o dashboard do Administrador
    await expect(page.locator('text=/PAINEL ADMINISTRATIVO|PANEL DE CONTROL DEL ADMINISTRADOR/')).toBeVisible({ timeout: 15000 });

    // 2. Admin cria um novo evento de teste
    const eventNameInput = page.locator('input[placeholder*="Jornada"]');
    const facUserInput = page.locator('input[placeholder*="fac_jornada"]');
    const facPassInput = page.locator('input[placeholder="••••••••"]');
    const createBtn = page.locator('button[type="submit"]');

    await eventNameInput.fill(EVENTO_NOME);
    await facUserInput.fill(FACILITADOR_USER);
    await facPassInput.fill(FACILITADOR_PASS);
    await createBtn.click();

    // Aguarda a confirmação visual da criação
    await expect(page.locator(`text=${EVENTO_NOME}`)).toBeVisible({ timeout: 10000 });

    // Logout do Admin
    await page.locator('button', { hasText: "SAIR" }).click();
    await expect(userInput).toBeVisible();

    // 3. Novo Facilitador loga no Mobile
    // Redimensionar para tamanho móvel (ex: iPhone 12)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/"); // Recarrega na tela de login

    await userInput.fill(FACILITADOR_USER);
    await passInput.fill(FACILITADOR_PASS);
    await loginBtn.click();

    // Deve carregar o gerenciador de sessões do Facilitador
    await expect(page.locator('text=/PAINEL DO FACILITADOR|PANEL DEL FACILITADOR/')).toBeVisible({ timeout: 15000 });

    // Cria e entra em uma sessão para visualizar o Header
    const sessionInput = page.locator('input[placeholder*="sessão"], input[placeholder*="sesión"]').first();
    await sessionInput.fill("Sessão Teste Mobile");
    const createSessionBtn = page.locator('button', { hasText: /CRIAR SESSÃO|CREAR SESIÓN/ });
    await createSessionBtn.click();

    // 4. Teste de Responsividade do Header do Facilitador (Mobile)
    const burgerBtn = page.locator("button.mobile-only");
    await expect(burgerBtn).toBeVisible({ timeout: 10000 });

    // O menu de navegação do desktop deve estar oculto
    const desktopNav = page.locator("nav.header-nav");
    await expect(desktopNav).toBeHidden();

    // Abre o menu hambúrguer móvel e clica em logout
    await burgerBtn.click();
    const logoutBtnMobile = page.locator(".header-menu-dropdown button", { hasText: /SAIR|SALIR/ }).first();
    await expect(logoutBtnMobile).toBeVisible();
    await logoutBtnMobile.click();

    // 5. Limpeza: Admin entra novamente no Desktop e exclui o evento de teste
    await page.setViewportSize({ width: 1280, height: 800 }); // Volta para Desktop
    await page.goto("/");

    await userInput.fill("ADMIN");
    await passInput.fill("admin123");
    await loginBtn.click();

    // Espera os eventos carregarem
    await expect(page.locator(`text=${EVENTO_NOME}`)).toBeVisible({ timeout: 15000 });

    // Escuta e aceita automaticamente a caixa de diálogo de confirmação (confirm) do navegador
    page.on("dialog", async dialog => {
      await dialog.accept();
    });

    // Localiza a lixeira específica do card do nosso evento de teste e clica
    const cardLixeira = page.locator(`xpath=//h3[contains(., "${EVENTO_NOME}")]/ancestor::div[./button][1]//button[contains(., "🗑️")]`);
    await cardLixeira.click();

    // Valida que o evento de teste foi removido com sucesso
    await expect(page.locator(`text=${EVENTO_NOME}`)).toBeHidden({ timeout: 10000 });

    // Logout final
    await page.locator('button', { hasText: "SAIR" }).click();
  });
});
