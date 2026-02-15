'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type DrawerProps = React.ComponentProps<typeof Dialog>
type DrawerTriggerProps = React.ComponentProps<typeof DialogTrigger>
type DrawerContentProps = React.ComponentProps<typeof DialogContent>
type DrawerHeaderProps = React.ComponentProps<'div'>
type DrawerTitleProps = React.ComponentProps<typeof DialogTitle>
type DrawerDescriptionProps = React.ComponentProps<typeof DialogDescription>

export function Drawer(props: DrawerProps) {
  return <Dialog {...props} />
}

export function DrawerTrigger(props: DrawerTriggerProps) {
  return <DialogTrigger {...props} />
}

export function DrawerContent(props: DrawerContentProps) {
  return <DialogContent {...props} />
}

export function DrawerHeader(props: DrawerHeaderProps) {
  return <DialogHeader {...props} />
}

export function DrawerTitle(props: DrawerTitleProps) {
  return <DialogTitle {...props} />
}

export function DrawerDescription(props: DrawerDescriptionProps) {
  return <DialogDescription {...props} />
}
