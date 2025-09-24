export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const startDay = start.getDate()
    const startMonth = start.getMonth() + 1
    const endDay = end.getDate()
    const endMonth = end.getMonth() + 1

    return `${startDay.toString().padStart(2, "0")} ${getMonthAbbr(startMonth)} — ${endDay
        .toString()
        .padStart(2, "0")} ${getMonthAbbr(endMonth)}`
}

function getMonthAbbr(month: number): string {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    return months[month - 1]
}

export function formatDate(date: string): string {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`
}
