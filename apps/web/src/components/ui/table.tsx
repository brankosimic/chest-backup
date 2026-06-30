import { cn } from "@/lib/utils"

const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
}

const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />
}

const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => {
  return <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
}

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", className)} {...props} />
}

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return <td className={cn("p-4 align-middle", className)} {...props} />
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow }
