import { test, expect } from '@playwright/test';

test.describe('End-to-End Enterprise Recruitment Platform Validation', () => {

  test('1. Admin Flow: Login, View Admin Command, and Create User Account', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('Enterprise Access Portal');

    // Fill Admin Credentials
    await page.locator('input[type="email"]').fill('admin@autergo.com');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.locator('button:has-text("Sign In to Workspace")').click();

    // Verify redirected to Dashboard in Admin Workspace
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Administrator Command & Governance Workspace')).toBeVisible();
    await expect(page.locator('text=Admin Command & Governance Dashboard')).toBeVisible();
    await expect(page.locator('text=System User Accounts')).toBeVisible();

    // Open Create User Modal
    await page.locator('button:has-text("+ Create New User")').click();
    await expect(page.locator('text=Create New User Account')).toBeVisible();

    // Fill new user details
    const testEmail = `e2e_user_${Date.now()}@autergo.com`;
    await page.locator('input[placeholder="e.g. Sarah Jenkins"]').fill('Playwright Test Recruiter');
    await page.locator('input[placeholder="sarah@autergo.com"]').fill(testEmail);
    await page.locator('input[placeholder="Min 8 characters"]').fill('Password@123');
    await page.locator('select').first().selectOption('recruiter');

    // Submit user creation
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('button:has-text("Create Account")').click();

    // Logout
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL('/login');
  });

  test('2. Recruiter Flow: Login, View Drives, Create Drive, and Manage Pipeline', async ({ page }) => {
    await page.goto('/login');

    // Login as Recruiter
    await page.locator('input[type="email"]').fill('recruiter@autergo.com');
    await page.locator('input[type="password"]').fill('Recruiter@123');
    await page.locator('button:has-text("Sign In to Workspace")').click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Recruitment Campaigns Hub')).toBeVisible();
    await expect(page.locator('text=+ Create New Drive')).toBeVisible();

    // Open Create Drive page
    await page.locator('text=+ Create New Drive').click();
    await expect(page).toHaveURL('/drives/create');
    await expect(page.locator('h1')).toHaveText('Create & Publish Recruitment Drive');

    // Fill Drive Details
    const driveTitle = `E2E Automated Drive ${Date.now()}`;
    await page.locator('input[placeholder="e.g. Senior Full Stack Engineer 2026"]').fill(driveTitle);
    await page.locator('input[placeholder="e.g. Frontend Engineer"]').fill('Automation QA Engineer');
    await page.locator('textarea[placeholder="Key requirements and candidate expectations..."]').fill('Expert in Playwright, Next.js and FastAPI testing.');

    // Save and Publish Drive
    await page.locator('button:has-text("Publish Drive & Generate Magic Link")').click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator(`text=${driveTitle}`)).toBeVisible();

    // Enter Drive Candidate Workspace via link
    await page.locator(`a:has-text("Enter Drive Workspace")`).first().click();
    await expect(page).toHaveURL(/\/drives\/.*\/pipeline/);
    await expect(page.locator('text=360 Pipeline')).toBeVisible();
    await expect(page.locator('text=Import Excel Whitelist')).toBeVisible();

    // Verify Cutoff & Delete Drive option in pipeline workspace and return to dashboard
    await expect(page.locator('button:has-text("Cutoff:")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete Drive")')).toBeVisible();
    await page.locator('text=Back to Dashboard').click();

    // Verify Delete Drive button on drive card
    await expect(page.locator('button[title="Delete Recruitment Drive"]').first()).toBeVisible();

    // Logout
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL('/login');
  });

  test('3. Evaluator Flow (L1 Technical Evaluator): Quick-Access Login & L1 Pool', async ({ page }) => {
    await page.goto('/login');

    // Switch to Evaluator tab
    await page.locator('button:has-text("Interviewer Fast Login")').click();
    await expect(page.locator('text=Select or Enter Your Name')).toBeVisible();

    // Select L1 role and type name
    await page.locator('button:has-text("L1 Technical Pool")').click();
    await page.locator('input[placeholder="e.g. David Chen or Dr. Elena Rostova"]').fill('David Chen');
    await page.locator('button:has-text("Quick Access Candidate Pool")').click();

    // Verify redirected to Dashboard in L1 View
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=L1 Technical Interview Pool')).toBeVisible();
    await expect(page.locator('text=Active Role: l1')).toBeVisible();

    // Verify Admin tools and Recruiter campaigns are NOT visible
    await expect(page.locator('text=Admin Command & Governance Dashboard')).toHaveCount(0);
    await expect(page.locator('text=Recruitment Campaigns Hub')).toHaveCount(0);

    // Logout
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL('/login');
  });

  test('4. Evaluator Flow (L2 Panel Reviewer): Quick-Access Login & L2 Pool', async ({ page }) => {
    await page.goto('/login');

    // Switch to Evaluator tab
    await page.locator('button:has-text("Interviewer Fast Login")').click();

    // Select L2 role and type name
    await page.locator('button:has-text("L2 Panel Pool")').click();
    await page.locator('input[placeholder="e.g. David Chen or Dr. Elena Rostova"]').fill('Dr. Elena Rostova');
    await page.locator('button:has-text("Quick Access Candidate Pool")').click();

    // Verify redirected to Dashboard in L2 View
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=L2 Panel / Architecture Interview Pool')).toBeVisible();
    await expect(page.locator('text=Active Role: l2')).toBeVisible();

    // Verify L1 tools and Recruiter campaigns are NOT visible
    await expect(page.locator('text=L1 Technical Interview Pool')).toHaveCount(0);
    await expect(page.locator('text=Recruitment Campaigns Hub')).toHaveCount(0);

    // Logout
    await page.locator('button:has-text("Logout")').click();
    await expect(page).toHaveURL('/login');
  });

  test('5. Candidate Flow: Whitelist Enforcement & Single Attempt Terminal Destruction', async ({ page, request }) => {
    // 1. Recruiter creates drive via API
    const recLogin = await request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'recruiter@autergo.com', password: 'Recruiter@123' }
    });
    const recToken = (await recLogin.json()).access_token;

    const driveRes = await request.post('http://localhost:8000/api/v1/drives', {
      headers: { Authorization: `Bearer ${recToken}` },
      data: {
        title: 'Candidate E2E Test Drive',
        job_title: 'Software Developer',
        job_description: 'E2E testing validation',
        cutoff_percentage: 50.0,
        send_rejection_emails: false,
        duration_minutes: 10.0,
        questions: [{
          id: 'q-mcq-1',
          title: 'What is 2 + 2?',
          question_type: 'single_mcq',
          options: ['3', '4', '5', '6'],
          correct_answer: '4',
          marks: 10.0
        }]
      }
    });
    const driveId = (await driveRes.json()).id;

    // Whitelist Candidate
    const candidateEmail = `testcand_${Date.now()}@autergo.com`;
    await request.post(`http://localhost:8000/api/v1/drives/${driveId}/import-whitelist`, {
      headers: { Authorization: `Bearer ${recToken}` },
      data: {
        candidates: [{
          full_name: 'John Test Candidate',
          email: candidateEmail,
          phone: '+1987654321',
          experience_years: 4.0,
          referral_source: 'Campus'
        }]
      }
    });

    // 2. Candidate navigates to drive apply page
    await page.goto(`/drive/${driveId}/apply`);
    await expect(page.locator('text=Online Technical Assessment')).toBeVisible();

    // Verify non-whitelisted email is blocked
    await page.locator('input[placeholder="you@example.com"]').fill('random_unauthorized@autergo.com');
    await page.locator('button:has-text("Verify Email & Proceed")').click();
    await expect(page.locator('text=Your email is not authorized')).toBeVisible();

    // Verify whitelisted email works and auto-fills
    await page.locator('input[placeholder="you@example.com"]').fill(candidateEmail);
    await page.locator('button:has-text("Verify Email & Proceed")').click();
    await expect(page.locator('text=✓ Whitelist Verified')).toBeVisible();

    // Proceed to Proctoring
    await page.locator('button:has-text("Proceed to Proctoring")').click();
    await expect(page.locator('text=Test Integrity & Proctoring Agreement')).toBeVisible();

    // Agree terms and Launch Test
    await page.locator('button:has-text("I Agree & Start Assessment")').click();

    // Verify Test Interface
    await expect(page).toHaveURL(/\/test\/.*\/take/);
    await expect(page.locator('text=AUTERGO ASSESSMENT')).toBeVisible();
    await expect(page.locator('text=What is 2 + 2?')).toBeVisible();

    // Select correct option
    await page.locator('button:has-text("4")').click();

    // Submit Assessment
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.locator('button:has-text("Submit Assessment")').click();

    // Verify Post-Test Terminal Destruction Countdown
    await expect(page.locator('text=Assessment Submitted')).toBeVisible();
    await expect(page.locator('text=Session Terminated')).toBeVisible();
    await expect(page.locator('text=Closing window in')).toBeVisible();
  });

});
