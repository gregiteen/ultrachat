type BrowserAction = {
  action: 'launch' | 'click' | 'type' | 'scroll_down' | 'scroll_up' | 'close';
  url?: string;
  coordinate?: string;
  text?: string;
};

export const browser_action = async (action: BrowserAction): Promise<void> => {
  // This function is provided by the system and will be replaced at runtime
  // with the actual browser_action tool implementation
  return Promise.resolve();
};

// Helper functions for common browser actions
export const launchBrowser = async (url: string) => {
  await browser_action({ action: 'launch', url });
};

export const clickElement = async (selector: string) => {
  await browser_action({ action: 'click', coordinate: selector });
};

export const typeText = async (text: string) => {
  await browser_action({ action: 'type', text });
};

export const scrollDown = async () => {
  await browser_action({ action: 'scroll_down' });
};

export const scrollUp = async () => {
  await browser_action({ action: 'scroll_up' });
};

export const closeBrowser = async () => {
  await browser_action({ action: 'close' });
};

// Common selectors for form fields
export const COMMON_SELECTORS = {
  username: [
    'input[type="email"]',
    'input[type="text"]',
    'input[name="username"]',
    'input[name="email"]',
    'input[id*="username"]',
    'input[id*="email"]'
  ],
  password: [
    'input[type="password"]',
    'input[name="password"]',
    'input[id*="password"]'
  ],
  submit: [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:contains("Sign in")',
    'button:contains("Log in")'
  ]
};

// Helper for filling login forms
export const autoFillLoginForm = async (
  url: string,
  username: string,
  password: string
): Promise<void> => {
  try {
    await launchBrowser(url);

    // Try each username selector
    for (const selector of COMMON_SELECTORS.username) {
      try {
        await clickElement(selector);
        await typeText(username);
        break;
      } catch {
        continue;
      }
    }

    // Try each password selector
    for (const selector of COMMON_SELECTORS.password) {
      try {
        await clickElement(selector);
        await typeText(password);
        break;
      } catch {
        continue;
      }
    }

    // Try each submit button selector
    for (const selector of COMMON_SELECTORS.submit) {
      try {
        await clickElement(selector);
        break;
      } catch {
        continue;
      }
    }
  } finally {
    await closeBrowser();
  }
};