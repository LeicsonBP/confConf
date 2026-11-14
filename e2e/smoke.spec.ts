import { test, expect } from "@playwright/test";

test("home oferece os dois acessos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "confConf" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Área do Administrador/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Área do Participante/i })).toBeVisible();
});

test("área do participante exige login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
});

test("painel do administrador exige login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/entrar/);
});

test("convite inválido mostra mensagem amigável", async ({ page }) => {
  await page.goto("/convite/token-que-nao-existe");
  await expect(page.getByText(/convite/i).first()).toBeVisible();
  await expect(
    page.getByText(/não encontramos|não está disponível|inválido|expirado/i).first(),
  ).toBeVisible();
});

test("recuperação de senha e de usuário", async ({ page }) => {
  await page.goto("/recuperar");
  await expect(page.getByRole("heading", { name: /Esqueci minha senha/i })).toBeVisible();

  await page.goto("/recuperar/usuario");
  await expect(page.getByRole("heading", { name: /Esqueci meu usuário/i })).toBeVisible();
  await expect(page.getByLabel("Data de nascimento")).toBeVisible();
});

test("política de privacidade acessível", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: /Privacidade e dados/i })).toBeVisible();
});

test("link pular para o conteúdo aparece com teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
});
