'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
<<<<<<< HEAD
import { Check, ChevronLeft, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import PageHeader from '@/components/common/PageHeader'
import { useAlerts } from '@/components/common/AlertsProvider'
=======
import { Check, ChevronLeft, Save, Search, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
import {
  getRoleByIdApi,
  getPermissionsGroupedApi,
  getRolePermissionIdsApi,
  saveRolePermissionsApi,
  Permission,
} from '@/services/conexion'

type Grouped = Record<string, Permission[]>

export default function RolePermissionsPage() {
  const { locale, id } = useParams() as { locale: string; id: string }
  const router = useRouter()
<<<<<<< HEAD
  const { notify } = useAlerts()
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  const [roleName, setRoleName] = useState<string>('')
  const [groups, setGroups] = useState<Grouped>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [role, grouped, current] = await Promise.all([
          getRoleByIdApi(id),
          getPermissionsGroupedApi(),
          getRolePermissionIdsApi(id),
        ])
        setRoleName(role?.name ?? '—')
        setGroups(grouped)
        setSelected(new Set(current))
        setError(null)
      } catch (e: any) {
<<<<<<< HEAD
        const message = e?.message || 'Error cargando permisos del rol'
        setError(message)
        notify({ type: 'error', title: 'No se pudieron cargar los permisos', description: message })
=======
        setError(e?.message || 'Error cargando permisos del rol')
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
      } finally {
        setLoading(false)
      }
    })()
<<<<<<< HEAD
  }, [id, notify])
=======
  }, [id])
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

  // Helpers
  const flatList = useMemo(() => {
    const out: Permission[] = []
    for (const key of Object.keys(groups)) {
      out.push(...groups[key])
    }
    return out
  }, [groups])

  const filteredGroups = useMemo(() => {
    if (!filter.trim()) return groups
    const q = filter.toLowerCase()
    const g: Grouped = {}
    for (const [mod, perms] of Object.entries(groups)) {
      const subset = perms.filter(p =>
        (p.name?.toLowerCase() ?? '').includes(q) ||
        (p.description?.toLowerCase() ?? '').includes(q) ||
        (mod.toLowerCase()).includes(q)
      )
      if (subset.length) g[mod] = subset
    }
    return g
  }, [groups, filter])

  const allCheckedIn = (module: string) =>
    (filteredGroups[module] ?? []).every(p => selected.has(p.id))
  const anyCheckedIn = (module: string) =>
    (filteredGroups[module] ?? []).some(p => selected.has(p.id))

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleModule = (module: string, checkAll: boolean) => {
    const ids = (filteredGroups[module] ?? []).map(p => p.id)
    setSelected(prev => {
      const n = new Set(prev)
      for (const id of ids) {
        if (checkAll) n.add(id)
        else n.delete(id)
      }
      return n
    })
  }

  const selectAll = () => setSelected(new Set(flatList.map(p => p.id)))
  const clearAll  = () => setSelected(new Set())

  const handleSave = async () => {
    try {
      setSaving(true)
      await saveRolePermissionsApi(id, Array.from(selected))
<<<<<<< HEAD
      notify({ type: 'success', title: 'Permisos actualizados', description: 'Los cambios se guardaron correctamente.' })
    } catch (e: any) {
      notify({ type: 'error', title: 'No se pudieron guardar los permisos', description: e?.message || 'Ocurrió un error inesperado' })
=======
      alert('Permisos actualizados')
    } catch (e: any) {
      alert(e?.message || 'No fue posible guardar')
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
<<<<<<< HEAD
      <PageHeader
        className="mb-6"
        breadcrumbs={[
          { label: 'Seguridad y Accesos', href: `/${locale}/settings/security` },
          { label: 'Roles', href: `/${locale}/settings/security/roles` },
          { label: 'Permisos' },
        ]}
        title={`Permisos del rol: ${roleName || '—'}`}
        description="Activa o desactiva permisos por sección (módulo)."
        actions={(
          <>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/settings/security/roles`)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" /> Volver
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        )}
      />
=======
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Seguridad y Accesos', href: `/${locale}/settings/security` },
              { label: 'Roles', href: `/${locale}/settings/security/roles` },
              { label: 'Permisos' },
            ]}
          />
          <div className="border border-gray-200 my-5" />
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Permisos del rol: <span className="font-semibold ms-1">{roleName}</span>
          </h2>
          <p className="text-sm text-gray-500">Activa o desactiva permisos por sección (módulo).</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/${locale}/settings/security/roles`)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8

      {/* Barra de herramientas */}
      <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por módulo, nombre o descripción…"
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="ms-auto flex items-center gap-2">
<<<<<<< HEAD
          <button type="button" onClick={selectAll} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
            Seleccionar todo
          </button>
          <button type="button" onClick={clearAll} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
=======
          <button onClick={selectAll} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
            Seleccionar todo
          </button>
          <button onClick={clearAll} className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
            Limpiar
          </button>
        </div>
      </div>

      {/* Estado de carga / error */}
      {loading && <div className="text-sm text-gray-500">Cargando…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Tarjetas por módulo */}
      <div className="space-y-6">
        {Object.entries(filteredGroups).map(([module, perms]) => (
          <section key={module} className="rounded-xl border border-gray-200 bg-white p-4">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{module}</h3>
              <div className="flex items-center gap-2">
                <button
<<<<<<< HEAD
                  type="button"
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                  onClick={() => toggleModule(module, true)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  <ToggleRight className="w-3.5 h-3.5" /> Activar módulo
                </button>
                <button
<<<<<<< HEAD
                  type="button"
=======
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
                  onClick={() => toggleModule(module, false)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  <ToggleLeft className="w-3.5 h-3.5" /> Desactivar
                </button>
                <span className="text-[11px] text-gray-500">
                  {anyCheckedIn(module)
                    ? allCheckedIn(module) ? 'Todo activado' : 'Parcial'
                    : 'Ninguno'}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {perms.map((p) => {
                const isOn = selected.has(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition
                      ${isOn
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleOne(p.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">{p.name}</span>
                    {isOn && <Check className="w-3.5 h-3.5 ms-auto" />}
                    {p.description && <span className="ms-auto text-[11px] text-gray-500">{p.description}</span>}
                  </label>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
