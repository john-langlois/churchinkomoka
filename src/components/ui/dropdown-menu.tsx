import * as React from "react"
import { ChevronDown } from "lucide-react"

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.MutableRefObject<HTMLElement | null>
}>({ 
  open: false, 
  setOpen: () => {},
  triggerRef: { current: null }
})

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    asChild?: boolean
    render?: React.ReactElement
  }
>(({ children, asChild, render, ...props }, ref) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const internalRef = React.useRef<HTMLElement>(null)
  
  React.useEffect(() => {
    if (internalRef.current) {
      triggerRef.current = internalRef.current
    }
  }, [triggerRef])
  
  const handleClick = () => setOpen(!open)
  
  const setRefs = (node: HTMLElement | null) => {
    internalRef.current = node
    triggerRef.current = node
    if (typeof ref === 'function') {
      ref(node as any)
    } else if (ref) {
      ref.current = node as any
    }
  }
  
  const triggerProps = {
    onClick: handleClick,
    ref: setRefs,
    ...props,
  }
  
  if (render) {
    return React.cloneElement(render, triggerProps as any)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps as any)
  }
  
  return (
    <button
      {...triggerProps}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }
>(({ className = "", align = "start", children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const contentHeight = 200 // Approximate height of dropdown
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      
      // Position above if there's more space above, otherwise below
      if (spaceAbove > spaceBelow && spaceAbove > contentHeight) {
        setPosition({
          top: rect.top - contentHeight - 8, // 8px margin
          left: align === "end" ? rect.right - 224 : rect.left, // 224px = w-56
        })
      } else {
        setPosition({
          top: rect.bottom + 8,
          left: align === "end" ? rect.right - 224 : rect.left,
        })
      }
    }
  }, [open, align, triggerRef])
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open && contentRef.current && !contentRef.current.contains(event.target as Node)) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen, triggerRef])
  
  if (!open || !position) return null
  
  return (
    <div
      ref={(node) => {
        contentRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }}
      className={`fixed z-50 w-56 rounded-xl border border-stone-200 bg-white shadow-lg ${className}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-400 ${className}`}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="py-1">{children}</div>
)

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive"
  }
>(({ className = "", variant = "default", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`block w-full px-4 py-2 text-left text-sm cursor-pointer ${
      variant === "destructive" 
        ? "text-red-600 hover:bg-red-50" 
        : "text-stone-900 hover:bg-stone-50"
    } ${className}`}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`my-1 h-px bg-stone-200 ${className}`}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className = "", checked, onCheckedChange, children, ...props }, ref) => (
  <div
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={`flex items-center gap-2 px-4 py-2 text-sm text-stone-900 hover:bg-stone-50 cursor-pointer ${className}`}
    {...props}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={() => {}}
      className="h-4 w-4 rounded border-stone-300"
      readOnly
    />
    {children}
  </div>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
}
