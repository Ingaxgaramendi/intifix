/** Every backend response is wrapped in this envelope. */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

/** Spring Data `Page<T>` shape returned by paginated endpoints. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

/** Query params accepted by paginated endpoints. */
export interface PageParams {
  page?: number
  size?: number
  /** e.g. "fechaCreacion,desc" */
  sort?: string
}

export const emptyPage = <T>(): Page<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
})
