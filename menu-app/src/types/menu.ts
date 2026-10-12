export interface Tag {
  id: string
  name: string
  tagType?: string
}

export interface Product {
  id: string
  categoryId: string
  categoryName: string
  name: string
  description: string | null
  price: number
  isAvailable: boolean
  tags: string[]
}

export interface Category {
  id: string
  cafeId: string
  name: string
  products?: Product[]
}

export interface MenuSearchResponse {
  message: string
  products: Product[]
}

// Aliases for DTO compatibility
export type ProductDto = Product
export type CategoryDto = Category
export type MenuSearchResultDto = MenuSearchResponse

export interface MenuInitDto {
  cafeId: string
  cafeName: string
  welcomeMessage: string
}

export interface CafeDto {
  id: string
  name: string
}

export interface MenuQueryDto {
  query: string
  cafeId?: string
}
