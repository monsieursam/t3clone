'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Loader, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/use-conversations';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import Link from 'next/link';

export function ConversationList() {
  const router = useRouter();
  const pathname = usePathname();

  const { createConversation, isCreating, conversations } = useConversations();

  const handleSubmit = async () => {
    const conversation = await createConversation({ title: 'New Conversation' });

    if (conversation && 'id' in conversation) {
      router.push(`/${conversation.id}`)
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <form action={handleSubmit}>
          <Button
            className="w-full"
            variant="outline"
          >
            {
              isCreating ?
                <Loader className="mr-2 h-4 w-4 animate-spin" /> : <div className='flex items-center'>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Conversation
                </div>
            }
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <ul className="space-y-2">
          {conversations?.map((conversation) => (
            <SidebarMenuButton
              asChild
              key={conversation.id}
              className={pathname === `/${conversation.id}` ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
            >
              <Link href={`/${conversation.id}`} className="flex items-center gap-2">
                {conversation.title}
              </Link>
            </SidebarMenuButton>
          ))}
        </ul>
      </div>
    </div>
  );
}
