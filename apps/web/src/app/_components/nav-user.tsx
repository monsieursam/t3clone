"use client"

import {
  LogIn
} from "lucide-react"

import { SignOutButton, useUser, SignInButton, UserProfile, UserButton } from "@clerk/nextjs"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
  const { user } = useUser()

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SignInButton>
            <SidebarMenuButton
              size="lg"
              className="w-full justify-start gap-2"
            >
              <LogIn className="size-4" />
              Sign In
            </SidebarMenuButton>
          </SignInButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <UserButton appearance={{
            elements: {
              userButtonPopoverCard: {
                pointerEvents: 'initial'
              }
            }
          }} />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.fullName}</span>
            <span className="truncate text-xs">{user.primaryEmailAddress?.emailAddress}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
