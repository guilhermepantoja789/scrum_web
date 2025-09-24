import * as React from "react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = DayPickerProps

export function Calendar({ className, classNames, ...props }: CalendarProps) {
    return (
        <DayPicker
            className={cn("p-3", className)}
            classNames={{
                caption: "flex justify-center pt-1 relative items-center",
                nav: "space-x-1 flex items-center",
                button_previous: "h-7 w-7 rounded-md hover:bg-accent",
                button_next: "h-7 w-7 rounded-md hover:bg-accent",
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell:
                    "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent/50",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                ...classNames,
            }}
            {...props}
        />
    )
}
