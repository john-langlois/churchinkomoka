"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, onCheckedChange, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked ?? false)
    
    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setIsChecked(newChecked)
      if (onCheckedChange) {
        onCheckedChange(newChecked)
      }
      if (props.onChange) {
        props.onChange(e)
      }
    }
    
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div
          className={`
            flex h-4 w-4 items-center justify-center rounded border-2 transition-all
            ${isChecked 
              ? 'border-stone-900 bg-stone-900' 
              : 'border-stone-300 bg-white'
            }
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer hover:border-stone-400'
            }
            ${className}
          `}
          onClick={() => {
            if (!disabled) {
              const input = ref && 'current' in ref ? ref.current : null
              if (input) {
                input.click()
              }
            }
          }}
        >
          {isChecked && (
            <CheckIcon className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
