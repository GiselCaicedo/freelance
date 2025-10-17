'use client'

import { Settings, Shield, Zap, ChevronRight, Users, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Configuracion() {
  const router = useRouter()
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const sections = [
    {
      id: 'generales',
      title: 'Generales',
      description: 'Configuraciones básicas',
      icon: Settings,
      color: 'bg-orange-500',
      borderColor: 'border-orange-200',
      subItems: [],
    },
    {
      id: 'seguridad',
      title: 'Seguridad y Accesos',
      description: 'Usuarios, roles y permisos',
      icon: Shield,
      color: 'bg-blue-500',
      borderColor: 'border-blue-300',
      subItems: [
        { id: 'usuarios', label: 'Usuarios', icon: Users, path: '/settings/security/users' },
        { id: 'roles', label: 'Roles', icon: UserCheck, path: '/settings/security/roles' },
      ],
    },
    {
      id: 'utilidades',
      title: 'Utilidades',
      description: 'Herramientas del sistema',
      icon: Zap,
      color: 'bg-purple-500',
      borderColor: 'border-purple-200',
      subItems: [],
    },
  ]

  const handleSectionClick = (sectionId: string) => {
    if (sections.find((s) => s.id === sectionId)?.subItems.length > 0) {
      setExpandedSection(expandedSection === sectionId ? null : sectionId)
    }
  }

  const handleSubItemClick = (path: string) => {
    router.push(path)
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
       

        {/* Secciones */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSection === section.id
            const hasSubItems = section.subItems.length > 0

            return (
              <div key={section.id}>
                {/* Card Principal */}
                <button
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full group rounded-lg border ${section.borderColor} p-6 text-left transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`${section.color} p-3 rounded-lg flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {section.title}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {/* Chevron */}
                    {hasSubItems && (
                      <ChevronRight
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </div>
                </button>

                {/* Sub Items */}
                {hasSubItems && isExpanded && (
                  <div className="mt-3 space-y-2">
                    {section.subItems.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isBlueParent = section.id === 'seguridad'
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleSubItemClick(subItem.path)}
                          className={`w-full group flex items-center gap-3 rounded-lg border p-4 text-left transition-all duration-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isBlueParent
                              ? 'border-blue-300 hover:border-blue-400'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <SubIcon
                            className={`w-5 h-5 ${
                              isBlueParent
                                ? 'text-blue-500'
                                : section.color.replace('bg-', 'text-')
                            }`}
                          />
                          <span className="font-medium text-slate-900">{subItem.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
