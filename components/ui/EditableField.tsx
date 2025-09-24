// Local: components/ui/EditableField.tsx

"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

type Props = {
    initialValue: string
    onSave: (newValue: string) => void
    inputClassName?: string
    displayClassName?: string
}

export function EditableField({ initialValue, onSave, inputClassName, displayClassName }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
            inputRef.current?.select()
        }
    }, [isEditing])

    const handleSave = () => {
        if (value.trim() !== initialValue.trim()) {
            onSave(value.trim())
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setValue(initialValue)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                    }}
                    className={inputClassName}
                />
                <Button size="icon" variant="ghost" onClick={handleSave}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={handleCancel}><X className="h-4 w-4" /></Button>
            </div>
        )
    }

    return (
        <div onClick={() => setIsEditing(true)} className={`cursor-pointer hover:bg-slate-100 p-1 -m-1 rounded-md ${displayClassName}`}>
            {initialValue || <span className="text-slate-400">Clique para editar</span>}
        </div>
    )
}