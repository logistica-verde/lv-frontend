export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Could not reach the API')
    this.name = 'NetworkError'
  }
}

export class AddressSearchUnavailableError extends Error {
  constructor() {
    super('Address search is unavailable')
    this.name = 'AddressSearchUnavailableError'
  }
}

export class ResponseFormatError extends Error {
  constructor(path: string) {
    super(`Unexpected response format from ${path}`)
    this.name = 'ResponseFormatError'
  }
}

export function describeError(error: Error): string {
  if (error instanceof NetworkError) {
    return 'Não foi possível conectar à API. Verifique se ela está em execução.'
  }
  if (error instanceof AddressSearchUnavailableError) {
    return 'O serviço de busca de endereços está indisponível no momento.'
  }
  if (error instanceof ResponseFormatError) {
    return 'A API respondeu em um formato inesperado.'
  }
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'Recurso não encontrado.'
    }
    if (error.status === 503) {
      return 'O serviço de auditoria em blockchain está indisponível no momento.'
    }
    if (error.status >= 500) {
      return 'A API encontrou um erro interno. Tente novamente em instantes.'
    }
    return error.message
  }
  return 'Ocorreu um erro inesperado.'
}
