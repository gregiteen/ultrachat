import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';
import type { Message } from '../../types';

// Mock the store hooks
jest.mock('../../store/chat', () => ({
  useMessageStore: (selector: any) => {
    // Return mock values based on the selector function
    const state = {
      loading: false,
      messages: [],
      sendMessage: jest.fn(),
    };
    return selector(state);
  },
}));

jest.mock('../../store/context', () => ({
  useContextStore: (selector: any) => {
    const state = {
      activeContext: { ai_name: 'Test Assistant' },
    };
    return selector(state);
  },
}));

describe('ChatMessage', () => {
  const mockMessage: Message = {
    id: '123',
    content: 'test content',
    role: 'assistant',
    created_at: new Date().toISOString(), // Add the required created_at property
  };

  it('renders assistant message correctly', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('test content')).toBeInTheDocument();
  });

  it('renders user message correctly', () => {
    const userMessage: Message = {
      ...mockMessage,
      role: 'user',
    };
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('test content')).toBeInTheDocument();
  });

  it('renders thinking state correctly', () => {
    const thinkingMessage: Message = {
      ...mockMessage,
      id: 'thinking',
      content: '',
    };
    render(<ChatMessage message={thinkingMessage} />);
    expect(screen.getByText(/is thinking/)).toBeInTheDocument();
  });

  it('handles copy button click', async () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<ChatMessage message={mockMessage} />);
    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('test content');
  });

  it('renders message versions correctly', () => {
    const messageWithVersions: Message = {
      ...mockMessage,
      versions: [
        {
          id: 'v1',
          message_id: '123',
          content: 'version 1',
          version_number: 1,
          created_at: new Date().toISOString(),
          created_by: 'system',
        },
        {
          id: 'v2',
          message_id: '123',
          content: 'version 2',
          version_number: 2,
          created_at: new Date().toISOString(),
          created_by: 'system',
        },
      ],
    };

    render(<ChatMessage message={messageWithVersions} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });
});