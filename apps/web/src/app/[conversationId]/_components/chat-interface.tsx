'use client'
// @ts-nocheck

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useChat } from '@ai-sdk/react';
import { useParams } from 'next/navigation';
import { Send, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useConversations } from '@/hooks/use-conversations';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from './markdown-renderer';
import { useMessages } from '@/hooks/use-messages';
import { api } from '@/trpc/client';
import type { LLM } from '@repo/database/src/schema';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db.model';

interface Props {
  llms: LLM[];
}

const extractBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

export default function ChatInterface({ llms }: Props) {
  const { conversationId } = useParams();
  const apiKey = useLiveQuery(() => db.apiKeyOpenRouter.toArray());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const { messages: messageData, invalidateMessageQuery } = useMessages(conversationId as string);
  const { updateConversation } = useConversations();
  const [selectedLLM, setSelectedLLM] = useState<LLM | null>(llms.length > 0 ? llms[0] : null);
  const { mutateAsync: getAnswer } = api.ai.generateText.useMutation();
  const { mutateAsync: getImage, isPending: isPendingImage } = api.ai.generateImage.useMutation();
  const { mutateAsync: editImage } = api.ai.editImage.useMutation();

  const { messages, input, handleInputChange, handleSubmit, setInput, setMessages, isLoading } = useChat({
    initialMessages: messageData.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      images: msg.images,
    })),
    body: {
      provider: selectedLLM?.provider || 'openai',
      stream: true,
      apiKey: apiKey?.[0]?.key || '',
      conversationId,
      llmId: selectedLLM?.id,
      model: selectedLLM?.slug || 'gpt-3.5-turbo',
    },
    onFinish: async () => {
      invalidateMessageQuery();
    }
  })
    ;


  const handleSendMessage = async (e:
    React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (selectedLLM?.capacity?.some(c => c === 'text')) {
      handleSubmit();
      setInput('');
    } else if (selectedLLM?.capacity?.some((c) => c === 'image')) {
      if (
        uploadedImages.length > 0
      ) {
        handleEditSubmit(e);
        setInput('');
        return;
      } else {



        const image = await getImage({
          messages: [
            ...messages,
            {
              role: 'user',
              content: input,
            }],
          conversationId: conversationId as string,
          n: 1,
        })

        if (image) {

          invalidateMessageQuery();

          setMessages((prev) => {
            console.log(prev);
            return [
              ...(prev || []),
              {
                id: Date.now().toString(),
                role: 'user',
                content: input,
              },
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: '',
                images: [image],
              },
            ];
          });

          setInput('');
        }
      }

    }

    if (messages.length === 0) {
      const data = await getAnswer({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        system: 'Generate title with less than 5 words base on the user message',
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
      });
      updateConversation({
        id: conversationId as string,
        title: data,
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedImages.length === 0 || !input.trim()) {
      const errorMsg = 'Please upload at least one image and provide editing instructions';
    }

    // Process images to extract base64 data
    const processedImages = [...uploadedImages];
    processedImages.forEach((image, index) => {
      processedImages[index] = extractBase64(image);
    });

    const data = await editImage({
      imageFiles: processedImages,
      conversationId: conversationId as string,
      messages: [
        ...messages,
        {
          role: 'user',
          content: input,
        }
      ],
    });

    if (!data) {
      throw new Error(`API error: ${data}`);
    }
    setMessages(prev => {
      return [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'user',
          content: input,
        },
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
          images: [data],
        },
      ];
    });
    setInput('');
    setUploadedImages([]);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-2">  {/* Added pb-2 to create some space at the bottom */}
        <div className="space-y-6">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'flex items-start gap-4 text-sm',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-4 py-2 whitespace-pre-wrap',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : ''
                )}
              >
                <>
                  {
                    message.parts.map(part => {
                      switch (part.type) {
                        case 'text':
                          return <MarkdownRenderer key={`${message.id}-${part.text}`} content={part.text} className="prose prose-sm dark:prose-invert max-w-none" />;
                      }
                    })
                  }
                  {console.log(message)}
                  {
                    message?.images?.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={img}
                        className="rounded-lg"
                      />
                    ))
                  }

                </>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-2 sm:p-4 w-full sticky bottom-0 bg-background z-10">  {/* Reduced padding on small screens */}
        <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 mb-2 sm:mb-0">
                {selectedLLM ? (
                  <>
                    <span className="truncate max-w-[100px]">{selectedLLM.name}</span>
                    <Badge variant="secondary" className="ml-1 whitespace-nowrap">{selectedLLM.provider}</Badge>
                  </>
                ) : (
                  <span>Select LLM</span>
                )}
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {llms.map((llm) => (
                <DropdownMenuItem key={llm.id} onClick={() => setSelectedLLM(llm)}>
                  <div className="flex items-center gap-2">
                    <span>{llm.name}</span>
                    <Badge variant="secondary">{llm.provider}</Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex w-full gap-2 items-center">
            <Textarea
              value={input}
              placeholder={`Message ${selectedLLM?.name || 'AI'}...`}
              onChange={handleInputChange}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            />
            <Button type="submit" size="icon" className="flex-shrink-0">
              {
                isLoading || isPendingImage ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <Send className="h-4 w-4" />
                )
              }
            </Button>
          </div>
          {
            selectedLLM?.capacity?.some((c) => c === 'image') && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload images to edit
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
                  />
                </div>

                {uploadedImages.length > 0 && (
                  <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Uploaded image ${index + 1}`}
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>

            )
          }

        </form>
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
