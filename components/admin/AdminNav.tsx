'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface AdminNavProps {
  user: {
    name: string
    email: string
    role: string
  }
}

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Attendees', href: '/admin/attendees' },
  { label: 'Import', href: '/admin/import' },
  { label: 'Live Scans', href: '/admin/scans' },
  { label: 'Certificates', href: '/admin/certificates' },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin'
  }
  return pathname.startsWith(href)
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const userInitials = useMemo(() => {
    return user.name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'U'
  }, [user.name])

  const NavLinks = (
    <div className="flex flex-col gap-1 border-t border-slate-200 pt-4 sm:border-none sm:pt-0 sm:flex-row sm:items-center sm:gap-6">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-400/40'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between sm:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-600">Doezy</span>
            <span className="hidden text-sm font-semibold uppercase tracking-wide text-slate-500 sm:inline-block">
              Admin Console
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:hidden"
            aria-expanded={mobileOpen}
            aria-controls="admin-nav-links"
          >
            <span className="sr-only">Toggle navigation</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div
          id="admin-nav-links"
          className={`${mobileOpen ? 'grid' : 'hidden'} gap-4 sm:flex sm:items-center sm:justify-between sm:gap-8`}
        >
          {NavLinks}
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 sm:border-none sm:pt-0">
            <div className="hidden text-xs font-semibold uppercase tracking-wide text-slate-500 sm:block">
              {user.role.replace(/_/g, ' ')}
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {userInitials}
                </span>
                <span className="hidden sm:block">
                  <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="block text-xs text-slate-500">{user.email}</span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.061l-4.24 4.24a.75.75 0 01-1.06 0l-4.24-4.24a.75.75 0 01.04-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-3 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <Link
                    href="/admin/account"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Account settings
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Logout
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m9 0l-3 3m3-3l-3-3" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

