import { expect, test } from './fixtures';
import { ROUTES, url } from './helpers/routes';
import { sel } from './helpers/selectors';

function notesUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}?tab=notes`);
}

function noteMoreBtn(noteRow: import('@playwright/test').Locator) {
  return noteRow.getByRole('button').last();
}

test('create note and verify save', async ({ page, testProject: { projectId } }) => {
  await page.goto(notesUrl(projectId));
  await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 15_000 });

  const editor = page.locator('[contenteditable="true"]');

  await expect(editor).toBeVisible({ timeout: 10_000 });
  await editor.click();
  await page.keyboard.type('E2E test note content', { delay: 30 });
  await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10_000 });
});

test('pin and unpin note', async ({ page, testProject: { projectId } }) => {
  await page.goto(notesUrl(projectId));
  await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 10_000 });

  const tabPanel = page.getByRole('tabpanel');
  const noteRow = tabPanel.getByRole('button', { name: /Untitled/ });

  await expect(noteRow).toBeVisible({ timeout: 5_000 });
  await noteMoreBtn(noteRow).click();
  await page.getByRole('menuitem', { name: /^pin$/i }).click();
  await expect(tabPanel.getByText(/pinned/i)).toBeVisible({ timeout: 5_000 });

  const pinnedNote = tabPanel.getByRole('button', { name: /Untitled/ });

  await noteMoreBtn(pinnedNote).click();
  await page.getByRole('menuitem', { name: /unpin/i }).click();
});

test('create folder, move note, delete folder', async ({ page, testProject: { projectId } }) => {
  await page.goto(notesUrl(projectId));
  await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 10_000 });

  const tabPanel = page.getByRole('tabpanel');

  await page.getByRole('button', { name: /new folder/i }).click();

  const folderInput = page.getByPlaceholder(/folder name/i);

  await expect(folderInput).toBeVisible({ timeout: 5_000 });
  await folderInput.fill('E2E Folder');
  await folderInput.press('Enter');
  await expect(tabPanel.getByText('E2E Folder')).toBeVisible({ timeout: 5_000 });

  const noteRow = tabPanel.getByRole('button', { name: /Untitled/ });

  await noteMoreBtn(noteRow).click();
  await page.getByRole('menuitem', { name: /move to folder/i }).click();
  await page.getByRole('menuitem', { name: 'E2E Folder' }).click();

  const folderBtn = tabPanel.getByRole('button', { name: /E2E Folder/ });

  await folderBtn.hover();
  await folderBtn.locator('xpath=following-sibling::button[1]').click();
  await page.getByRole('menuitem', { name: /delete folder/i }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: /confirm/i }).click();
  await expect(tabPanel.getByText('E2E Folder')).not.toBeVisible({ timeout: 5_000 });
});

test('delete note, verify in trash, restore', async ({ page, testProject: { projectId } }) => {
  await page.goto(notesUrl(projectId));
  await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[contenteditable="true"]')).toBeVisible({ timeout: 10_000 });

  const tabPanel = page.getByRole('tabpanel');

  const noteRow = tabPanel.getByRole('button', { name: /Untitled/ });

  await noteMoreBtn(noteRow).click();
  await page.getByRole('menuitem', { name: /move to trash/i }).click();
  await tabPanel.getByRole('button', { name: /trash/i }).click();

  const trashedNote = tabPanel.getByRole('button', { name: /Untitled/ });

  await expect(trashedNote).toBeVisible({ timeout: 10_000 });
  await noteMoreBtn(trashedNote).click();
  await page.getByRole('menuitem', { name: /restore/i }).click();
});
