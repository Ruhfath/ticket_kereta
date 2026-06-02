// components/BottomNavbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, TicketIcon, QuestionMarkCircleIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, TicketIcon as TicketIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

const navItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Cari Tiket',
    href: '/cari-tiket',
    icon: TicketIcon,
    activeIcon: TicketIconSolid,
  },
  {
    name: 'Ticket Saya',
    href: '/ticket-saya',
    icon: TicketIcon,
    activeIcon: TicketIconSolid,
  },
  {
    name: 'Login',
    href: '/login',
    icon: UserIcon,
    activeIcon: UserIconSolid,
  },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  // Hide navbar on login page
  if (pathname.startsWith('/login')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}