import '@testing-library/jest-dom/vitest';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './__tests__/mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => {
  if (!HTMLFormElement.prototype.requestSubmit) {
    HTMLFormElement.prototype.requestSubmit = function (submitter) {
      if (submitter) {
        const btn = submitter as HTMLButtonElement | HTMLInputElement;
        if (btn.type !== 'submit') {
          throw new TypeError('The specified element is not a submit button');
        }
        if (btn.form !== this) {
          throw new DOMException(
            'The specified element is not owned by this form element',
            'NotFoundError',
          );
        }
      }
      const event = new Event('submit', { bubbles: true, cancelable: true });
      this.dispatchEvent(event);
    };
  }
  server.listen({ onUnhandledRequest: 'error' });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());
