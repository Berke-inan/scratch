import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Product {
  id?: string | number
  name: string
  description: string
  price: number | string
  currency?: string
  tags?: string[]
}

export interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { name, description, price, currency = "₺", tags = [] } = product

  const formattedPrice =
    typeof price === "number"
      ? new Intl.NumberFormat("tr-TR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(price)
      : price

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl",
        "border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-neutral-900/40",
        "p-6 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700",
        "shadow-none ring-0",
        className
      )}
    >
      <div className="space-y-3">
        {/* Header: Title and Price */}
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
            {name}
          </h3>
          <span className="shrink-0 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
            {formattedPrice} {currency}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 font-normal">
          {description}
        </p>
      </div>

      {/* Tags / Badges */}
      {tags.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5 pt-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-normal tracking-wide",
                "bg-neutral-100 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-300",
                "border border-neutral-200/60 dark:border-neutral-700/50",
                "transition-colors"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
