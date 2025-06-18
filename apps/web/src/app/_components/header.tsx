"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useAuth } from "@clerk/nextjs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ApiKeyOpenRouter } from "@/database/db.model";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ModalApiKeyProps {
  apiKey: ApiKeyOpenRouter | undefined;
}

const ModalApiKey = ({ apiKey }: ModalApiKeyProps) => {
  const [newApiKey, setNewApiKey] = useState(apiKey?.key);

  const handleSaveApiKey = async () => {
    if (apiKey) {
      await db.apiKeyOpenRouter.update(apiKey?.id, { key: newApiKey || '' });
    } else {
      await db.apiKeyOpenRouter.add({ key: newApiKey || '' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {apiKey ? "Update API Key" : "Add API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API Key Management</DialogTitle>
          <DialogDescription>
            Add or update your OpenRouter API key for the application.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Enter your API key"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={handleSaveApiKey}>Save API Key</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}


export function Header() {
  const apiKey = useLiveQuery(() => db.apiKeyOpenRouter.toArray());

  return (
    <header className="w-full h-14 flex items-center px-4">
      <div className="flex flex-1 items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <SidebarTrigger />
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex gap-2 items-center">
        <ModalApiKey apiKey={apiKey?.[0]} />
        {/* <ModeToggle /> */}
      </div>
    </header>
  )
}
