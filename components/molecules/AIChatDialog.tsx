'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SendHorizontal, SparkleIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { GlowButton } from '@/components/atoms/GlowButton';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ... existing imports ...

const QUICK_QUESTIONS = [
  '¿Cómo puedo crear una nueva factura?',
  '¿Cómo agrego un nuevo cliente?',
  '¿Cómo puedo generar un reporte de ventas?',
  '¿Cómo edito una factura existente?',
  '¿Cómo administro mi catálogo de productos?',
  '¿Cómo configuro los datos de mi empresa?',
  '¿Cómo puedo exportar mis facturas?',
  '¿Cómo funciona el cálculo de impuestos?',
  '¿Cómo personalizo el formato de mi factura?',
  '¿Cómo puedo ver el historial de facturas?',
];

// ... rest of existing code ...

export function AIChatDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [randomQuestions, setRandomQuestions] = useState<string[]>([]);

  // Function to get random questions
  const getRandomQuestions = () => {
    const shuffled = [...QUICK_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  // Update random questions when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRandomQuestions(getRandomQuestions());
      setMessages([]); // Clear chat when dialog opens
      setInput(''); // Clear input field
    }
  }, [isOpen]);

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    handleSubmit(question);
  };

  const handleSubmit = async (userInput: string | React.FormEvent) => {
    if (typeof userInput !== 'string') {
      const event = userInput;
      event.preventDefault();
      userInput = input;
    }
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedResponse = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let reading = true;
      while (reading) {
        const { done, value } = await reader.read();
        if (done) {
          reading = false;
          break;
        }

        const text = decoder.decode(value);
        streamedResponse += text;

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: streamedResponse },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch AI response:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu solicitud.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <GlowButton>
          <SparkleIcon className="h-4 w-4" />
          Consultar AI
        </GlowButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asistente AI</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="grid grid-cols-2 gap-2">
              {randomQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="default"
                  className="h-auto whitespace-normal text-left"
                  onClick={() => handleQuickQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
          <ScrollArea className="h-[400px] pr-4">
            <div className="flex flex-col gap-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                      ? 'bg-drosera text-white'
                      : 'bg-muted'
                      }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="text-muted-foreground">Pensando</div>
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-drosera [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-drosera [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-drosera" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hazme una pregunta..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
