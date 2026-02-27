import { cn } from "@/lib/utils"
import * as React from "react"

const NotebookCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border-2 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black font-sans notebook-lines",
      className
    )}
    {...props}
  />
))
NotebookCard.displayName = "NotebookCard"

const NotebookCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b-2 border-dashed border-gray-300 bg-[linear-gradient(transparent_95%,#ffcccb_95%)] bg-[length:100%_2rem]", className)}
    {...props}
  />
))
NotebookCardHeader.displayName = "NotebookCardHeader"

const NotebookCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-bold text-2xl tracking-tight text-blue-800", className)}
    {...props}
  />
))
NotebookCardTitle.displayName = "NotebookCardTitle"

const NotebookCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-lg font-medium text-gray-700", className)}
    {...props}
  />
))
NotebookCardDescription.displayName = "NotebookCardDescription"

const NotebookCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 text-lg leading-relaxed bg-[linear-gradient(transparent_95%,#e5e7eb_95%)] bg-[length:100%_2rem]", className)} {...props} />
))
NotebookCardContent.displayName = "NotebookCardContent"

const NotebookCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t-2 border-dashed border-gray-300 mt-4", className)}
    {...props}
  />
))
NotebookCardFooter.displayName = "NotebookCardFooter"

const NotebookButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md border-2 border-black bg-blue-100 px-6 py-2 text-xl font-bold text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all",
      className
    )}
    {...props}
  />
))
NotebookButton.displayName = "NotebookButton"

const NotebookBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "danger" | "success" | "warning" }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-100 text-blue-900 border-blue-900",
    danger: "bg-red-100 text-red-900 border-red-900",
    success: "bg-green-100 text-green-900 border-green-900",
    warning: "bg-yellow-100 text-yellow-900 border-yellow-900",
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-sm border-2 px-3 py-1 font-bold text-base uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
NotebookBadge.displayName = "NotebookBadge"

export {
  NotebookCard,
  NotebookCardHeader,
  NotebookCardFooter,
  NotebookCardTitle,
  NotebookCardDescription,
  NotebookCardContent,
  NotebookButton,
  NotebookBadge
}
