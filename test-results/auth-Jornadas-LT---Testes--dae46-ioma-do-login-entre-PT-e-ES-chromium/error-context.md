# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Jornadas LT - Testes E2E de Autenticação, Eventos e Responsividade >> Deve alternar o idioma do login entre PT e ES
- Location: tests\auth.spec.ts:4:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Jornadas LT - Testes E2E de Autenticação, Eventos e Responsividade", () => {
  4   |   test("Deve alternar o idioma do login entre PT e ES", async ({ page }) => {
  5   |     await page.goto("/");
  6   |     
  7   |     // Verifica que o texto de identificação está visível em um dos idiomas
  8   |     const textPT = page.locator("text=IDENTIFICAÇÃO");
  9   |     const textES = page.locator("text=IDENTIFICACIÓN");
  10  |     
  11  |     const isPT = await textPT.isVisible();
  12  |     const isES = await textES.isVisible();
  13  |     
> 14  |     expect(isPT || isES).toBeTruthy();
      |                          ^ Error: expect(received).toBeTruthy()
  15  |   });
  16  | 
  17  |   test("Fluxo Integrado: Admin cria evento -> Facilitador loga no mobile -> Admin remove evento", async ({ page }) => {
  18  |     const randomSuffix = Math.floor(Math.random() * 1000000);
  19  |     const EVENTO_NOME = `E2E Evento ${randomSuffix}`;
  20  |     const FACILITADOR_USER = `fac_e2e_${randomSuffix}`;
  21  |     const FACILITADOR_PASS = "SenhaSegura123!";
  22  | 
  23  |     // 1. Admin loga no Desktop
  24  |     await page.goto("/");
  25  |     
  26  |     const userInput = page.locator('input[placeholder*="grupo"]').first();
  27  |     const passInput = page.locator('input[type="password"]');
  28  |     const loginBtn = page.locator('button', { hasText: "ENTRAR" });
  29  | 
  30  |     await userInput.fill("ADMIN");
  31  |     await passInput.fill("admin123");
  32  |     await loginBtn.click();
  33  | 
  34  |     // Valida que acessou o dashboard do Administrador
  35  |     await expect(page.locator('text=/PAINEL ADMINISTRATIVO|PANEL DE CONTROL DEL ADMINISTRADOR/')).toBeVisible({ timeout: 15000 });
  36  | 
  37  |     // 2. Admin cria um novo evento de teste
  38  |     const eventNameInput = page.locator('input[placeholder*="Jornada"]');
  39  |     const facUserInput = page.locator('input[placeholder*="fac_jornada"]');
  40  |     const facPassInput = page.locator('input[placeholder="••••••••"]');
  41  |     const createBtn = page.locator('button[type="submit"]');
  42  | 
  43  |     await eventNameInput.fill(EVENTO_NOME);
  44  |     await facUserInput.fill(FACILITADOR_USER);
  45  |     await facPassInput.fill(FACILITADOR_PASS);
  46  |     await createBtn.click();
  47  | 
  48  |     // Aguarda a confirmação visual da criação
  49  |     await expect(page.locator(`text=${EVENTO_NOME}`)).toBeVisible({ timeout: 10000 });
  50  | 
  51  |     // Logout do Admin
  52  |     await page.locator('button', { hasText: "SAIR" }).click();
  53  |     await expect(userInput).toBeVisible();
  54  | 
  55  |     // 3. Novo Facilitador loga no Mobile
  56  |     // Redimensionar para tamanho móvel (ex: iPhone 12)
  57  |     await page.setViewportSize({ width: 390, height: 844 });
  58  |     await page.goto("/"); // Recarrega na tela de login
  59  | 
  60  |     await userInput.fill(FACILITADOR_USER);
  61  |     await passInput.fill(FACILITADOR_PASS);
  62  |     await loginBtn.click();
  63  | 
  64  |     // Deve carregar o gerenciador de sessões do Facilitador
  65  |     await expect(page.locator('text=/PAINEL DO FACILITADOR|PANEL DEL FACILITADOR/')).toBeVisible({ timeout: 15000 });
  66  | 
  67  |     // Cria e entra em uma sessão para visualizar o Header
  68  |     const sessionInput = page.locator('input[placeholder*="sessão"], input[placeholder*="sesión"]').first();
  69  |     await sessionInput.fill("Sessão Teste Mobile");
  70  |     const createSessionBtn = page.locator('button', { hasText: /CRIAR SESSÃO|CREAR SESIÓN/ });
  71  |     await createSessionBtn.click();
  72  | 
  73  |     // 4. Teste de Responsividade do Header do Facilitador (Mobile)
  74  |     const burgerBtn = page.locator("button.mobile-only");
  75  |     await expect(burgerBtn).toBeVisible({ timeout: 10000 });
  76  | 
  77  |     // O menu de navegação do desktop deve estar oculto
  78  |     const desktopNav = page.locator("nav.header-nav");
  79  |     await expect(desktopNav).toBeHidden();
  80  | 
  81  |     // Abre o menu hambúrguer móvel e clica em logout
  82  |     await burgerBtn.click();
  83  |     const logoutBtnMobile = page.locator(".header-menu-dropdown button", { hasText: /SAIR|SALIR/ }).first();
  84  |     await expect(logoutBtnMobile).toBeVisible();
  85  |     await logoutBtnMobile.click();
  86  | 
  87  |     // 5. Limpeza: Admin entra novamente no Desktop e exclui o evento de teste
  88  |     await page.setViewportSize({ width: 1280, height: 800 }); // Volta para Desktop
  89  |     await page.goto("/");
  90  | 
  91  |     await userInput.fill("ADMIN");
  92  |     await passInput.fill("admin123");
  93  |     await loginBtn.click();
  94  | 
  95  |     // Espera os eventos carregarem
  96  |     await expect(page.locator(`text=${EVENTO_NOME}`)).toBeVisible({ timeout: 15000 });
  97  | 
  98  |     // Escuta e aceita automaticamente a caixa de diálogo de confirmação (confirm) do navegador
  99  |     page.on("dialog", async dialog => {
  100 |       await dialog.accept();
  101 |     });
  102 | 
  103 |     // Localiza a lixeira específica do card do nosso evento de teste e clica
  104 |     const cardLixeira = page.locator(`xpath=//h3[contains(., "${EVENTO_NOME}")]/ancestor::div[contains(., "🗑️")][1]//button[contains(., "🗑️")]`);
  105 |     await cardLixeira.click();
  106 | 
  107 |     // Valida que o evento de teste foi removido com sucesso
  108 |     await expect(page.locator(`text=${EVENTO_NOME}`)).toBeHidden({ timeout: 10000 });
  109 | 
  110 |     // Logout final
  111 |     await page.locator('button', { hasText: "SAIR" }).click();
  112 |   });
  113 | });
  114 | 
```