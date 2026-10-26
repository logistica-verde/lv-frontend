import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { MockDb } from '@/mocks/db'
import type { Base } from '@/services/schemas/base'

type Problem = (status: number, detail: string) => Response

const createSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  endereco: z.string().trim().max(255).nullish(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

const statusSchema = z.object({ ativo: z.boolean() })

export function baseHandlers(db: MockDb, latencyMs: number, problem: Problem) {
  return [
    http.get('*/api/bases', async ({ request }) => {
      await delay(latencyMs)
      const all = new URL(request.url).searchParams.get('includeInactive') === 'true'
      const items = db.bases
        .filter((base) => all || base.ativo)
        .sort((first, second) => first.nome.localeCompare(second.nome))
      return HttpResponse.json(items)
    }),

    http.post('*/api/bases', async ({ request }) => {
      await delay(latencyMs)
      const parsed = createSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const base: Base = {
        id: db.nextBaseId++,
        nome: parsed.data.nome,
        endereco: parsed.data.endereco ?? null,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        ativo: true,
      }
      db.bases.push(base)
      return HttpResponse.json(base, { status: 201 })
    }),

    http.patch('*/api/bases/:id', async ({ params, request }) => {
      await delay(latencyMs)
      const parsed = statusSchema.safeParse(await request.json().catch(() => null))
      if (!parsed.success) {
        return problem(400, 'Invalid request content.')
      }
      const index = db.bases.findIndex((base) => base.id === Number(params['id']))
      const current = db.bases[index]
      if (!current) {
        return problem(404, `Base ${String(params['id'])} not found`)
      }
      const changed = { ...current, ativo: parsed.data.ativo }
      db.bases[index] = changed
      return HttpResponse.json(changed)
    }),
  ]
}
