export type ValidationErrorItem = {
  field: string
  message: string
  code?: string
}

export type PaginationMeta = {
  limit: number
  offset: number
  total_count?: number
}

export type Paginated<T> = PaginationMeta & {
  entries: T[]
}

export type SuccessData<T> = T | Paginated<T> | null

export type SuccessPayload = {
  message?: string
}

export type ErrorPayload = {
  statusCode?: number
  message?: string
  errors?: ValidationErrorItem[]
}

export type ApiSuccessResponse<T> = {
  statusCode: number
  message: string
  data: SuccessData<T>
  path: string
  timestamp: string
}

export type ApiErrorResponse = {
  statusCode: number
  message: string
  path: string
  timestamp: string
  errors?: ValidationErrorItem[]
}
