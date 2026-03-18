I've extracted extensive documentation from the shadcn/ui website. Let me compile all this content into a comprehensive markdown document for you.

---

# shadcn/ui Complete Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Theming](#theming)
4. [CLI Reference](#cli-reference)
5. [RTL Support](#rtl-support)
6. [Dark Mode](#dark-mode)
7. [Components](#components)
8. [Forms](#forms)
9. [Registry](#registry)

---

## Introduction

**shadcn/ui** is a set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks and AI models. Open Source. Open Code.

**This is not a component library. It is how you build your component library.**

### Key Principles

- **Open Code:** The top layer of your component code is open for modification.
- **Composition:** Every component uses a common, composable interface, making them predictable.
- **Distribution:** A flat-file schema and command-line tool make it easy to distribute components.
- **Beautiful Defaults:** Carefully chosen default styles, so you get great design out-of-the-box.
- **AI-Ready:** Open code for LLMs to read, understand, and improve.

---

## Installation

### Quick Start

Run the following command to create a new project with shadcn/ui:

```bash
npx shadcn@latest init
```

### Pick Your Framework

shadcn/ui is built to work with all React frameworks:
- Next.js
- Vite
- TanStack Start
- Laravel
- React Router
- Astro
- Manual Installation

---

## Theming

### CSS Variables

To use CSS variables for theming, set `tailwind.cssVariables` to `true` in your `components.json` file:

```json
{
  "tailwind": {
    "cssVariables": true
  }
}
```

### Convention

We use a simple `background` and `foreground` convention for colors:

```css
--primary: 222.2 47.4% 11.2%;
--primary-foreground: 210 40% 98%;
```

### List of Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

### Base Colors

Available base colors: **Neutral**, **Stone**, **Zinc**, **Mauve**, **Olive**, **Mist**, and **Taupe**.

---

## CLI Reference

### init

Initialize configuration and dependencies for a new project:

```bash
npx shadcn@latest init
```

**Options:**
- `-d, --defaults` - Use default configuration
- `-c, --config <path>` - Path to configuration file
- `-b, --base-color <color>` - Base color for theme

### add

Add components and dependencies to your project:

```bash
npx shadcn@latest add button
npx shadcn@latest add button card dialog
```

**Options:**
- `-o, --overwrite` - Overwrite existing files
- `-p, --path <path>` - Path to add components
- `-c, --config <path>` - Path to configuration file

### view

View items from the registry before installing:

```bash
npx shadcn@latest view button
npx shadcn@latest view button card
```

### search

Search for items from registries:

```bash
npx shadcn@latest search button
npx shadcn@latest search --registry @acme/components
```

### build

Generate the registry JSON files:

```bash
npx shadcn@latest build
npx shadcn@latest build --output ./public/r
```

### docs

Fetch documentation and API references:

```bash
npx shadcn@latest docs button
```

### info

Get information about your project:

```bash
npx shadcn@latest info
```

### migrate

Run migrations on your project:

```bash
npx shadcn@latest migrate rtl
npx shadcn@latest migrate radix
npx shadcn@latest migrate icons
```

---

## RTL Support

shadcn/ui components have first-class support for right-to-left (RTL) layouts.

### How it works

When you add components with `rtl: true` set in your `components.json`, the CLI automatically transforms:
- Physical positioning classes (`left-*`, `right-*`) to logical equivalents (`start-*`, `end-*`)
- Directional props to logical values
- Text alignment and spacing classes
- Icons with `rtl:rotate-180` class

### Migrating existing components

```bash
npx shadcn@latest migrate rtl [path]
```

---

## Components

### Accordion

A vertically stacked set of interactive headings that each reveal a section of content.

**Installation:**
```bash
npx shadcn@latest add accordion
```

**Usage:**
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Examples:**
- Basic (single item open at a time)
- Multiple (multiple items open)
- Disabled items
- With borders
- Wrapped in Card

---

### Alert

Displays a callout for user attention.

**Installation:**
```bash
npx shadcn@latest add alert
```

**Usage:**
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>
```

**Variants:**
- `default`
- `destructive`

---

### Alert Dialog

A modal dialog that interrupts the user with important content and expects a response.

**Installation:**
```bash
npx shadcn@latest add alert-dialog
```

**Usage:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger>Open</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Avatar

An image element with a fallback for representing the user.

**Installation:**
```bash
npx shadcn@latest add avatar
```

**Usage:**
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>
```

**API Reference:**

| Component | Props |
|-----------|-------|
| `Avatar` | `size`, `className` |
| `AvatarImage` | `src`, `alt`, `className` |
| `AvatarFallback` | `className` |
| `AvatarBadge` | `className` |
| `AvatarGroup` | `className` |
| `AvatarGroupCount` | `className` |

---

### Badge

Displays a badge or a component that looks like a badge.

**Installation:**
```bash
npx shadcn@latest add badge
```

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Badge</Badge>
```

**Variants:**
- `default`
- `secondary`
- `destructive`
- `outline`
- `ghost`
- `link`

---

### Breadcrumb

Displays the path to the current resource using a hierarchy of links.

**Installation:**
```bash
npx shadcn@latest add breadcrumb
```

**Usage:**
```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Current</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### Button

Displays a button or a component that looks like a button.

**Installation:**
```bash
npx shadcn@latest add button
```

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Button</Button>
```

**Variants:**
- `default`
- `outline`
- `ghost`
- `destructive`
- `secondary`
- `link`

**Sizes:**
- `default`
- `xs`
- `sm`
- `lg`
- `icon`
- `icon-xs`
- `icon-sm`
- `icon-lg`

---

### Calendar

A calendar component that allows users to select a date or a range of dates.

**Installation:**
```bash
npx shadcn@latest add calendar
```

**Usage:**
```tsx
import { Calendar } from "@/components/ui/calendar"

<Calendar />
```

**Features:**
- Single date selection
- Range selection (`mode="range"`)
- Month/year dropdowns (`captionLayout="dropdown"`)
- Presets
- Time picker integration
- RTL support
- Persian/Hijri/Jalali calendar support

---

### Card

Displays a card with header, content, and footer.

**Installation:**
```bash
npx shadcn@latest add card
```

**Usage:**
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
```

**API Reference:**

| Component | Props |
|-----------|-------|
| `Card` | `size`, `className` |
| `CardHeader` | `className` |
| `CardTitle` | `className` |
| `CardDescription` | `className` |
| `CardAction` | `className` |
| `CardContent` | `className` |
| `CardFooter` | `className` |

---

### Carousel

A carousel with motion and swipe built using Embla.

**Installation:**
```bash
npx shadcn@latest add carousel
```

**Usage:**
```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

<Carousel>
  <CarouselContent>
    <CarouselItem>...</CarouselItem>
    <CarouselItem>...</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

**Features:**
- Custom item sizes (`basis` utility class)
- Custom spacing
- Vertical orientation
- Embla options via `opts` prop
- Plugin support
- RTL support

---

### Checkbox

A control that allows the user to toggle between checked and not checked.

**Installation:**
```bash
npx shadcn@latest add checkbox
```

**Usage:**
```tsx
import { Checkbox } from "@/components/ui/checkbox"

<Checkbox id="terms" />
```

**Features:**
- Controlled/uncontrolled state
- Invalid state styling
- Disabled state
- Group support
- Table integration

---

### Collapsible

An interactive component which expands/collapses a panel.

**Installation:**
```bash
npx shadcn@latest add collapsible
```

**Usage:**
```tsx
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>
    Content
  </CollapsibleContent>
</Collapsible>
```

---

### Command

Command menu for search and quick actions (built on cmdk).

**Installation:**
```bash
npx shadcn@latest add command
```

**Usage:**
```tsx
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

<Command>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

---

### Context Menu

Displays a menu of actions triggered by a right click.

**Installation:**
```bash
npx shadcn@latest add context-menu
```

**Usage:**
```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

<ContextMenu>
  <ContextMenuTrigger>Right click</ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Profile</ContextMenuItem>
    <ContextMenuItem>Billing</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

### Data Table

Powerful table and datagrids built using TanStack Table.

**Installation:**
```bash
npx shadcn@latest add table
npm install @tanstack/react-table
```

**Features:**
- Basic table
- Row actions
- Pagination
- Sorting
- Filtering
- Column visibility
- Row selection
- Reusable components

---

### Date Picker

A date picker component with range and presets (built with Popover + Calendar).

**Installation:**
```bash
npx shadcn@latest add date-picker
```

**Examples:**
- Basic date picker
- Range picker
- Date of birth selector
- Input integration
- Time picker
- Natural language parsing (chrono-node)

---

### Dialog

A window overlaid on either the primary window or another dialog window.

**Installation:**
```bash
npx shadcn@latest add dialog
```

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

### Drawer

A drawer component for React (built on Vaul).

**Installation:**
```bash
npx shadcn@latest add drawer
```

**Usage:**
```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Are you sure?</DrawerTitle>
    </DrawerHeader>
  </DrawerContent>
</Drawer>
```

**Features:**
- Scrollable content
- Side positioning (`top`, `right`, `bottom`, `left`)
- Responsive dialog pattern

---

### Dropdown Menu

Displays a menu of actions triggered by a button.

**Installation:**
```bash
npx shadcn@latest add dropdown-menu
```

**Usage:**
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Field

Combine labels, controls, and help text to compose accessible form fields.

**Installation:**
```bash
npx shadcn@latest add field
```

**Usage:**
```tsx
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"

<Field>
  <FieldLabel>Username</FieldLabel>
  <FieldDescription>Choose a unique username.</FieldDescription>
  <Input />
  <FieldError />
</Field>
```

**Components:**
- `FieldSet` - Container for fieldset
- `FieldLegend` - Legend element
- `FieldGroup` - Layout wrapper
- `Field` - Core wrapper
- `FieldContent` - Flex column for control/descriptions
- `FieldLabel` - Label styled component
- `FieldTitle` - Title with label styling
- `FieldDescription` - Helper text
- `FieldSeparator` - Visual divider
- `FieldError` - Error container

---

### Hover Card

Displays rich content in a portal, triggered by a button.

**Installation:**
```bash
npx shadcn@latest add hover-card
```

---

### Input

Displays a form input or a component that looks like an input.

**Installation:**
```bash
npx shadcn@latest add input
```

---

### Label

Renders an accessible label associated with controls.

**Installation:**
```bash
npx shadcn@latest add label
```

---

### Menubar

A visually persistent menu common in desktop applications.

**Installation:**
```bash
npx shadcn@latest add menubar
```

---

### Navigation Menu

A collection of links for navigating websites.

**Installation:**
```bash
npx shadcn@latest add navigation-menu
```

---

### Pagination

Pagination component with page navigation.

**Installation:**
```bash
npx shadcn@latest add pagination
```

---

### Popover

Displays rich content in a portal, triggered by a button.

**Installation:**
```bash
npx shadcn@latest add popover
```

---

### Progress

Displays an indicator showing the completion progress of a task.

**Installation:**
```bash
npx shadcn@latest add progress
```

---

### Radio Group

A set of checkable buttons where no more than one can be checked at a time.

**Installation:**
```bash
npx shadcn@latest add radio-group
```

---

### Resizable

Accessible resizable panel groups and layouts (built on react-resizable-panels).

**Installation:**
```bash
npx shadcn@latest add resizable
```

---

### Scroll Area

Visually or semantically separates content with scrollable regions.

**Installation:**
```bash
npx shadcn@latest add scroll-area
```

---

### Select

Displays a select options menu.

**Installation:**
```bash
npx shadcn@latest add select
```

---

### Separator

Visually or semantically separates content.

**Installation:**
```bash
npx shadcn@latest add separator
```

---

### Sheet

A side panel that slides in from the edge of the screen.

**Installation:**
```bash
npx shadcn@latest add sheet
```

---

### Sidebar

A sidebar component for navigation.

**Installation:**
```bash
npx shadcn@latest add sidebar
```

---

### Skeleton

Use to show a placeholder while content loads.

**Installation:**
```bash
npx shadcn@latest add skeleton
```

---

### Slider

An input where the user selects a value from within a given range.

**Installation:**
```bash
npx shadcn@latest add slider
```

---

### Sonner

A toast component (recommended over deprecated Toast).

**Installation:**
```bash
npx shadcn@latest add sonner
```

---

### Spinner

A loading spinner component.

**Installation:**
```bash
npx shadcn@latest add spinner
```

---

### Switch

A control that allows the user to toggle between checked and not checked.

**Installation:**
```bash
npx shadcn@latest add switch
```

---

### Table

A responsive table component.

**Installation:**
```bash
npx shadcn@latest add table
```

---

### Tabs

A set of layered sections of content.

**Installation:**
```bash
npx shadcn@latest add tabs
```

---

### Textarea

Displays a form textarea.

**Installation:**
```bash
npx shadcn@latest add textarea
```

---

### Toggle

A two-state button that can be either on or off.

**Installation:**
```bash
npx shadcn@latest add toggle
```

---

### Toggle Group

A set of two-state buttons that can be toggled on or off.

**Installation:**
```bash
npx shadcn@latest add toggle-group
```

---

### Tooltip

A popup that displays information related to an element.

**Installation:**
```bash
npx shadcn@latest add tooltip
```

---

### Typography

Styles for headings, paragraphs, lists, and other text elements.

**Installation:**
```bash
npx shadcn@latest add typography
```

---

## Forms

### React Hook Form

Integration guide for building forms with React Hook Form.

### TanStack Form

Integration guide for building forms with TanStack Form.

---

## Registry

### Introduction

The shadcn/ui registry is a code distribution system that defines a schema for components and a CLI to distribute them.

### Getting Started

Learn how to create and publish your own registry.

### Namespaces

Organize your registry items with namespaces.

### Authentication

Authenticate with the registry for private items.

### registry.json

Configuration file for your registry.

### registry-item.json

Configuration file for individual registry items.

---

## Changelog

Stay updated with the latest changes and migrations.

### Recent Migrations

| Migration | Description |
|-----------|-------------|
| `icons` | Migrate to different icon library |
| `radix` | Migrate to unified radix-ui package |
| `rtl` | Migrate components for RTL support |

---

This documentation covers the complete shadcn/ui component library. For the most up-to-date information, visit [ui.shadcn.com/docs](https://ui.shadcn.com/docs).