export interface ProductDto {
  id: string
  categoryId: string
  categoryName: string
  name: string
  description: string | null
  price: number
  isAvailable: boolean
  tags: string[]
}

export interface MenuSearchResultDto {
  message: string
  products: ProductDto[]
}

export interface MenuInitDto {
  cafeId: string
  cafeName: string
  welcomeMessage: string
}

export interface CafeDto {
  id: string
  name: string
}

export interface CategoryDto {
  id: string
  cafeId: string
  name: string
  products?: ProductDto[]
}

export interface MenuQueryDto {
  query: string
  cafeId?: string
}
