'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Printer, Menu, X, Search, MapPin, Mail, Globe, ShieldCheck, FileText, Cookie, Camera, MessageCircle, Share2 } from 'lucide-react';

// IMPORTACIONES ESTRICTAS DE IMÁGENES (Evita que se pierdan en el empaquetado)
import logoIzquierdo from '../public/logo-izquierdo.png';
import logoDerecho from '../public/logo-derecho.png';

const inter = Inter({ subsets: ['latin'] });

// --- COMPONENTE DEL BUSCADOR (Live Search / Búsqueda en vivo) ---
function GlobalSearchBar({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleLiveSearch = (val: string) => {
    setSearchTerm(val);
    
    // Todas las tarjetas en la página
    const cards = document.querySelectorAll('.place-card');
    
    // Si borran todo el texto, limpiamos cualquier brillo y no hacemos nada más
    if (!val.trim()) {
      cards.forEach(c => c.classList.remove('ring-4', 'ring-sky-400', 'shadow-2xl', 'scale-[1.02]', 'z-10'));
      return;
    }

    const term = val.toLowerCase();

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      
      if (name.includes(term)) {
        // 1. Deslizamos automáticamente mientras el usuario escribe
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 2. Limpiamos cualquier brillo anterior por si estaba escribiendo rápido
        cards.forEach(c => c.classList.remove('ring-4', 'ring-sky-400', 'shadow-2xl', 'scale-[1.02]', 'z-10'));
        
        // 3. Iluminamos la tarjeta que hizo match
        card.classList.add('ring-4', 'ring-sky-400', 'shadow-2xl', 'scale-[1.02]', 'z-10');
        
        // El brillo se apagará solo después de 2.5 segundos
        setTimeout(() => {
          card.classList.remove('ring-4', 'ring-sky-400', 'shadow-2xl', 'scale-[1.02]', 'z-10');
        }, 2500);

        break; // Detenemos el ciclo en la primera coincidencia
      }
    }
  };

  // Permite cerrar el buscador presionando la tecla "Escape"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <form 
      onSubmit={(e) => { 
        e.preventDefault(); 
        onClose(); // Si presionan Enter, simplemente cerramos la cajita
      }} 
      className="relative group w-full"
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-600 transition-colors">
        <Search size={16} strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder="Escribe para buscar..."
        className="w-full bg-white/90 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-9 pr-9 text-sm font-semibold focus:outline-none focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400 shadow-sm"
        value={searchTerm}
        onChange={(e) => handleLiveSearch(e.target.value)}
        autoFocus
      />
      {searchTerm && (
        <button 
          type="button"
          onClick={() => handleLiveSearch('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-red-500 transition-colors"
          title="Borrar búsqueda"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </form>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 

  const categoryNavLinks = {
    attraction: 'Atractivos',
    restaurant: 'Restaurantes',
    hotel: 'Hoteles',
    cafeteria: 'Cafeterías',
    medical: 'S.Médicos',
    route: 'Rutas',
    church: 'Iglesias',
  };

  return (
    <html lang="es" className={inter.className}>
      <body className="bg-slate-800 text-slate-900 antialiased flex flex-col min-h-screen scroll-smooth">
        
        {/* HEADER LIMPIO Y LUMINOSO (GLASSMORPHISM BLANCO) */}
        <header className="print:hidden bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 shadow-md">
          <nav className="container mx-auto px-4 flex items-center justify-between py-3 gap-2 sm:gap-4 relative">
            
            <Link href="/galeria" className="flex items-center gap-3 no-underline group shrink-0" onClick={() => { setIsMenuOpen(false); setIsSearchOpen(false); }}>
              <div className="bg-white/10 p-2 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-sm">
                <img src={logoIzquierdo.src} alt="Logo de Ocozocoautla Pueblo Mágico" className="h-10 md:h-12 object-contain" />
              </div>
              <div className="flex flex-col text-white hidden sm:flex">
                <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-sky-400 leading-none">EXPLORA</span>
                <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter transition-colors group-hover:text-sky-400 leading-none">OCOZOCOAUTLA</span>
              </div>
            </Link>
            
            {/* MENÚ DE ESCRITORIO */}
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 ml-auto mr-4">
              {Object.entries(categoryNavLinks).map(([id, name]) => (
                <Link key={id} href={`/#${id}`} className="uppercase text-slate-200 font-black text-[13px] xl:text-sm hover:text-sky-400 transition-colors drop-shadow">
                  {name}
                </Link>
              ))}
            </div>
            
            {/* ÍCONOS DE LA DERECHA */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto lg:ml-0">
              
              {/* LUPA UNIVERSAL */}
              <button
                className="p-2 text-slate-200 hover:text-white transition-colors rounded-full hover:bg-white/10"
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen); 
                  setIsMenuOpen(false);
                }}
                aria-label="Buscar"
                title="Buscar lugares"
              >
                <Search size={22} strokeWidth={2.5} />
              </button>

              <Link 
                className="text-slate-200 hover:text-white transition-colors flex items-center justify-center p-2 rounded-full hover:bg-white/10" 
                href="/imprimir"
                title="Imprimir página"
              >
                <Printer size={22} strokeWidth={2.5} />
              </Link>
              
              <div className="hidden lg:block pl-2 border-l border-white/15 ml-2">
                <img src={logoDerecho.src} alt="Logo de México Turismo" className="h-12 md:h-14 object-contain brightness-95" />
              </div>
              
              <button
                className="lg:hidden p-2 text-slate-200 hover:text-white transition-colors rounded-full hover:bg-white/10"
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsSearchOpen(false);
                }}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={26} strokeWidth={2.5} /> : <Menu size={26} strokeWidth={2.5} />}
              </button>
            </div>
          </nav>

          {/* CAJA DE BÚSQUEDA FLOTANTE */}
          {isSearchOpen && (
            <>
              {/* Overlay invisible */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSearchOpen(false)}
              ></div>
              
              {/* Cajita pequeña flotando */}
              <div className="absolute top-full right-4 mt-2 w-64 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl z-50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <GlobalSearchBar onClose={() => setIsSearchOpen(false)} />
              </div>
            </>
          )}

          {/* MENÚ MÓVIL */}
          {isMenuOpen && (
            <div className="lg:hidden bg-slate-900/95 backdrop-blur-2xl border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 absolute w-full shadow-2xl z-50">
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {Object.entries(categoryNavLinks).map(([id, name]) => (
                  <Link 
                    key={id} 
                    href={`/#${id}`} 
                    onClick={() => setIsMenuOpen(false)}
                    className="uppercase text-slate-200 font-bold text-base hover:text-white transition-colors text-center py-3 rounded-xl hover:bg-white/10"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>
        
        <main className="flex-grow">
          {children}
        </main>

        {/* FOOTER PROFESIONAL INTEGRAL */}
        <footer className="print:hidden bg-slate-900/90 backdrop-blur-xl text-slate-300 pt-14 pb-8 mt-auto border-t border-white/10 shadow-lg">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            
            {/* 1. Identidad de marca */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-md">
                  <img src={logoIzquierdo.src} alt="Logo Ocozocoautla" className="h-8 object-contain" />
                </div>
                <div className="flex flex-col text-white">
                  <span className="text-lg font-black uppercase tracking-tighter leading-none">OCOZOCOAUTLA DE ESPINOSA</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Guía turística oficial del Pueblo Mágico. Descubre la cultura, tradiciones, gastronomía y los mejores rincones para visitar.
              </p>
            </div>

            {/* 2. Navegación / Mapa del sitio */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe size={16} className="text-sky-400" /> Mapa del Sitio
              </h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link href="/galeria" className="hover:text-sky-400 transition-colors">Galería Fotográfica</Link></li>
                <li><Link href="/imprimir" className="hover:text-sky-400 transition-colors">Guía Personalizada (Imprimir)</Link></li>
                <li><Link href="/#attraction" className="hover:text-sky-400 transition-colors">Atractivos Turísticos</Link></li>
              </ul>
            </div>

            {/* 3. Datos de contacto */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-sky-400" /> Contacto
              </h4>
              <ul className="space-y-3 text-sm text-slate-400 font-medium">
                <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-sky-400 shrink-0 mt-0.5" /> 
                  <span>Ocozocoautla de Espinosa, Chiapas, México.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={16} className="text-sky-400 shrink-0" /> 
                  <span className="break-all">museo@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* 4. Información legal */}
            <div>
              <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-sky-400" /> Legal
              </h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="" className="hover:text-sky-400 transition-colors flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" /> Aviso Legal
                  </Link>
                </li>
                <li>
                  <Link href="" className="hover:text-sky-400 transition-colors flex items-center gap-2">
                    <ShieldCheck size={14} className="text-slate-400" /> Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="" className="hover:text-sky-400 transition-colors flex items-center gap-2">
                    <Cookie size={14} className="text-slate-400" /> Política de Cookies
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Línea divisoria y Copyright */}
          <div className="container mx-auto px-4 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} <Link href="/museo">E</Link>xplora Ocozocoautla. Todos los derechos reservados.
              
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Pueblo Mágico de Chiapas
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}