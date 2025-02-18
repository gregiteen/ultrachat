import React, { useState, useEffect } from 'react';

interface Quote {
  text: string;
  author: string;
}

const quotes: Quote[] = [
  {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay"
  },
  {
    text: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Everything should be made as simple as possible, but no simpler.",
    author: "Albert Einstein"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "Knowledge is power.",
    author: "Francis Bacon"
  },
  {
    text: "The only source of knowledge is experience.",
    author: "Albert Einstein"
  },
  {
    text: "The journey of a thousand miles begins with one step.",
    author: "Lao Tzu"
  },
  {
    text: "Stay hungry, stay foolish.",
    author: "Steve Jobs"
  }
];

export function QuoteSpinner() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    // Change quote every 5 seconds
    const interval = setInterval(() => {
      setFadeIn(false); // Start fade out
      setTimeout(() => {
        setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
        setFadeIn(true); // Start fade in
      }, 500); // Wait for fade out to complete
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full" />
        </div>
      </div>

      {/* Quote */}
      <div 
        className={`max-w-md text-center transition-opacity duration-500 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-lg font-medium text-gray-700 mb-2">
          "{currentQuote.text}"
        </p>
        <p className="text-sm text-gray-500">
          — {currentQuote.author}
        </p>
      </div>

      {/* Search Status */}
      <div className="text-sm text-gray-500 animate-pulse">
        Searching across multiple sources...
      </div>
    </div>
  );
}