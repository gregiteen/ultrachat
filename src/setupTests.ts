import '@testing-library/jest-dom';

// Mock markdown-related modules
jest.mock('react-markdown', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: function MockMarkdown({ children }: { children: string }) {
      return mockReact.createElement('div', null, children);
    }
  };
});

jest.mock('remark-gfm', () => {
  return {
    __esModule: true,
    default: function mockRemarkGfm() {
      return {};
    }
  };
});

// Mock the FileUploader component since it relies on browser APIs
jest.mock('./components/FileUploader', () => {
  const mockReact = require('react');
  return {
    FileUploader: function MockFileUploader(props: { onChange: (paths: string[]) => void }) {
      return mockReact.createElement('div', 
        { 'data-testid': 'file-uploader' },
        mockReact.createElement('button', {
          onClick: () => props.onChange(['test-file.pdf'])
        }, 'Upload File')
      );
    }
  };
});

// Mock the supabase client
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { 
          user: { id: 'test-user-id' } 
        } 
      }),
    },
    from: jest.fn().mockReturnValue({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ 
            data: null, 
            error: null 
          }),
        }),
      }),
    }),
  },
}));