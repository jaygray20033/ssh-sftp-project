import { axiosInstance } from './config'
import { applyInterceptors } from './interceptors'

applyInterceptors(axiosInstance)

export const http = axiosInstance

export { getAccessToken, setAccessToken, ApiError } from './interceptors'
