import { test as base } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { createProjectViaDb, createSurveyWithQuestions } from './helpers/db-factories';
import { E2E_PASSWORD } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

export { expect } from '@playwright/test';

interface TestUser {
  email: string;
  userId: string;
  signIn: (page: import('@playwright/test').Page) => Promise<void>;
}

interface TestProject extends TestUser {
  projectId: string;
}

interface TestSurvey extends TestProject {
  surveyId: string;
}

export const test = base.extend<{
  testUser: TestUser;
  authenticatedPage: TestUser;
  testProject: TestProject;
  testSurvey: TestSurvey;
}>({
  testUser: async ({}, run, testInfo) => {
    const email = scopedEmail(`e2e-${testInfo.testId}`, testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);

    await run({ email, userId, signIn: makeApiSignIn(email, E2E_PASSWORD) });
    await deleteUserByEmail(email).catch(() => {});
  },

  authenticatedPage: async ({ page }, run, testInfo) => {
    const email = scopedEmail(`e2e-${testInfo.testId}`, testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);

    await signIn(page);
    await run({ email, userId, signIn });
    await deleteUserByEmail(email).catch(() => {});
  },

  testProject: async ({ page }, run, testInfo) => {
    const email = scopedEmail(`e2e-${testInfo.testId}`, testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Test Project');

    await signIn(page);
    await run({ email, userId, signIn, projectId });
    await deleteUserByEmail(email).catch(() => {});
  },

  testSurvey: async ({ page }, run, testInfo) => {
    const email = scopedEmail(`e2e-${testInfo.testId}`, testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Test Project');
    const { surveyId } = await createSurveyWithQuestions(userId, { projectId }, 1);

    await signIn(page);
    await run({ email, userId, signIn, projectId, surveyId });
    await deleteUserByEmail(email).catch(() => {});
  },
});
