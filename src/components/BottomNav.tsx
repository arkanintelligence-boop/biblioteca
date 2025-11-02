import { Home, Newspaper, Users, User, Bot } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Início', labelShort: 'Início', to: '/dashboard' },
    { icon: Newspaper, label: 'Feed Oculto', labelShort: 'Feed', to: '/feed' },
    { icon: Users, label: 'Legião Oculta', labelShort: 'Legião', to: '/comunidade' },
    { icon: Bot, label: 'Robô Oculto', labelShort: 'Robô', to: '/robo-oculto' },
    { icon: User, label: 'Perfil', labelShort: 'Perfil', to: '/perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-purple-500/30 z-50 lg:hidden">
      <div className="flex items-center justify-between h-16 px-3 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                isActive ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              <span className="text-xs font-medium text-center leading-tight whitespace-nowrap">
                {item.labelShort}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
