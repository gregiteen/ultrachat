import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalizationInterface } from '../PersonalizationInterface';
import { AIPersonalizationService } from '../../../lib/ai-personalization';

// Mock the AI service
jest.mock('../../../lib/ai-personalization', () => ({
  AIPersonalizationService: {
    getInstance: jest.fn(() => ({
      detectIntent: jest.fn().mockResolvedValue({
        intent: {
          category: 'basic_info',
          action: 'gather',
          field: 'name',
          confidence: 0.9
        },
        confidence: 0.9,
        extractedInfo: { name: 'John' }
      }),
      generateResponse: jest.fn().mockResolvedValue({
        message: "Nice to meet you, John! I'd love to know more about your interests.",
        type: 'question',
        intent: {
          category: 'interests',
          action: 'gather',
          confidence: 0.9
        },
        extractedInfo: { name: 'John' },
        suggestions: ['Professional interests', 'Hobbies', 'Skills']
      })
    }))
  }
}));

describe('PersonalizationInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both chat and form sections', () => {
    render(<PersonalizationInterface />);
    
    // Check for chat section
    expect(screen.getByPlaceholderText('Type your response...')).toBeInTheDocument();
    
    // Check for form section
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Job Title')).toBeInTheDocument();
  });

  it('synchronizes chat and form data', async () => {
    render(<PersonalizationInterface />);
    
    // Type in chat
    const chatInput = screen.getByPlaceholderText('Type your response...');
    fireEvent.change(chatInput, { target: { value: "I'm John" } });
    fireEvent.submit(chatInput.closest('form')!);

    // Wait for AI response and check if form is updated
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('John');
    });

    // Type in form
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    // Verify chat message about email update
    await waitFor(() => {
      expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    });
  });

  it('handles file uploads', async () => {
    render(<PersonalizationInterface />);
    
    // Click upload button
    fireEvent.click(screen.getByText('📎 Upload Files'));
    
    // Verify file uploader is shown
    expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    
    // Upload a file
    fireEvent.click(screen.getByText('Upload File'));
    
    // Verify confirmation message
    await waitFor(() => {
      expect(screen.getByText(/I'll analyze these files/)).toBeInTheDocument();
    });
  });

  it('shows suggestion buttons from AI responses', async () => {
    render(<PersonalizationInterface />);
    
    // Type in chat
    const chatInput = screen.getByPlaceholderText('Type your response...');
    fireEvent.change(chatInput, { target: { value: "I'm John" } });
    fireEvent.submit(chatInput.closest('form')!);

    // Wait for AI response suggestions
    await waitFor(() => {
      expect(screen.getByText('Professional interests')).toBeInTheDocument();
      expect(screen.getByText('Hobbies')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });

    // Click a suggestion
    fireEvent.click(screen.getByText('Hobbies'));
    const updatedChatInput = screen.getByPlaceholderText('Type your response...') as HTMLInputElement;
    expect(updatedChatInput.value).toBe('Hobbies');
  });

  it('handles form submission', async () => {
    const onComplete = jest.fn();
    render(<PersonalizationInterface onComplete={onComplete} />);
    
    // Fill out form
    fireEvent.change(screen.getByPlaceholderText('Name'), { 
      target: { value: 'John' } 
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), { 
      target: { value: 'john@example.com' } 
    });
    
    // Submit form
    fireEvent.click(screen.getByText('Complete Personalization'));
    
    expect(onComplete).toHaveBeenCalled();
  });

  it('adds and removes interests/expertise tags', () => {
    render(<PersonalizationInterface />);
    
    // Add interest
    const interestInput = screen.getByPlaceholderText('Add interest');
    fireEvent.change(interestInput, { target: { value: 'Programming' } });
    fireEvent.keyPress(interestInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    // Verify interest tag is added
    expect(screen.getByText('Programming')).toBeInTheDocument();
    
    // Remove interest
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('Programming')).not.toBeInTheDocument();
  });
});