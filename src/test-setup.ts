import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  // Sin esto, cada `render()` se acumula en el DOM entre tests del mismo
  // archivo — @testing-library/react solo limpia cuando detecta un
  // `afterEach` global, y este proyecto no usa los globals de Vitest.
  cleanup()
  // Sin esto, un `vi.spyOn` de un test arrastra su historial de llamadas
  // (mock.calls) al siguiente test que espía la misma función.
  vi.restoreAllMocks()
})
