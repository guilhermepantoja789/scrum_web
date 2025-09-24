import * as React from "react"
import * as Recharts from "recharts"
import { cn } from "@/lib/utils"

type LegendItem = {
    value: string
    color?: string
    type?: string
    id?: string | number
}

type ChartContainerProps = React.PropsWithChildren<{
    className?: string
    title?: string
    description?: string
}>

export function ChartContainer({
                                   className,
                                   title,
                                   description,
                                   children,
                               }: ChartContainerProps) {
    return (
        <div className={cn("rounded-xl border bg-card p-4 text-card-foreground", className)}>
            {(title || description) && (
                <div className="mb-4">
                    {title && <h3 className="text-sm font-medium">{title}</h3>}
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
            {children}
        </div>
    )
}

export function ChartLegend({
                                payload = [],
                            }: {
    payload?: LegendItem[]
}) {
    return (
        <div className="flex flex-wrap items-center gap-3 text-xs">
            {payload.map((item: LegendItem, index: number) => (
                <div key={index} className="flex items-center gap-2">
          <span
              className="h-2 w-2 rounded-sm"
              style={{ background: item.color || "currentColor" }}
          />
                    <span>{item.value}</span>
                </div>
            ))}
        </div>
    )
}

/**
 * Exemplo de uso com Recharts:
 *
 * <ChartContainer title="Vendas">
 *   <Recharts.ResponsiveContainer width="100%" height={260}>
 *     <Recharts.LineChart data={data}>
 *       <Recharts.CartesianGrid strokeDasharray="3 3" />
 *       <Recharts.XAxis dataKey="name" />
 *       <Recharts.YAxis />
 *       <Recharts.Tooltip />
 *       <Recharts.Line type="monotone" dataKey="uv" stroke="currentColor" />
 *     </Recharts.LineChart>
 *   </Recharts.ResponsiveContainer>
 * </ChartContainer>
 */
