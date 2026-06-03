// components/BottomNavbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService } from '@/service/authService';
import { HomeIcon, TicketIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, TicketIcon as TicketIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

export default function BottomNavbar() {
  const pathname = usePathname();
  const [isAuth] = useState(() => authService.isAuthenticated());

  // Hide navbar on login, register, and admin pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      name: isAuth ? 'Dashboard' : 'Beranda',
      href: isAuth ? '/customer/dashboard' : '/',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      name: 'Cari Tiket',
      href: isAuth ? '/customer/cari-ticket' : '/',
      icon: TicketIcon,
      activeIcon: TicketIconSolid,
    },
    {
      name: 'Ticket Saya',
      href: isAuth ? '/customer/ticket-saya' : '/login',
      icon: TicketIcon,
      activeIcon: TicketIconSolid,
    },
    {
      name: isAuth ? 'Profil' : 'Login',
      href: isAuth ? '/customer/dashboard' : '/login',
      icon: UserIcon,
      activeIcon: UserIconSolid,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-2xl z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          // A tab is active if the current pathname is exactly item.href or is a child of item.href (for subroutes like /customer/dashboard)
          const isActive = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href);
          
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