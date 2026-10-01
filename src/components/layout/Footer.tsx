import React from 'react';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Shield, 
  Lock, 
  CreditCard, 
  Truck, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Globe,
  Sparkles 
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { BELGA_LOGO_URL } from '../../lib/branding';

interface FooterProps {
  settings: StoreSettings;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Top trust badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 px-6 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Crediário Próprio Facilitado</h4>
              <p className="text-xs text-slate-400 mt-0.5">Parcele em até 12x no carnê ou semanal sem complicação</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Entrega Rápida e Montagem</h4>
              <p className="text-xs text-slate-400 mt-0.5">Atendimento em toda a região metropolitana do Rio de Janeiro</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Garantia de Qualidade</h4>
              <p className="text-xs text-slate-400 mt-0.5">Colchões com molas ensacadas e espumas de alta densidade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img
              src={BELGA_LOGO_URL}
              alt="Belga Móveis"
              className="h-12 w-auto max-w-[150px] object-contain drop-shadow-sm"
            />
            <div>
              <span className="text-xl font-black text-white">BELGA </span>
              <span className="text-xl font-black text-blue-400">MÓVEIS</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {settings.slogan || 'Seu lar mais completo!'} Os melhores colchões Queen, camas, sofás e móveis com facilidade total no crediário digital.
          </p>
          <div className="flex items-center gap-3">
            {settings.socialLinks?.instagram && (
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all text-slate-400"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {settings.socialLinks?.facebook && (
              <a
                href={settings.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-slate-400"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            <a
              href={`https://wa.me/55${settings.whatsapp?.replace(/\D/g, '') || '21973934438'}`}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all text-slate-400"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            {settings.socialLinks?.website && (
              <a
                href={settings.socialLinks.website}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-blue-400 hover:text-white flex items-center justify-center transition-all text-slate-400"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-orange-500 pl-2">
            Categorias
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('catalog')}
                className="hover:text-orange-400 transition-colors"
              >
                Colchões Queen com Molas
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog')}
                className="hover:text-orange-400 transition-colors"
              >
                Sofás e Poltronas
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog')}
                className="hover:text-orange-400 transition-colors"
              >
                Mesas e Cadeiras
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog')}
                className="hover:text-orange-400 transition-colors"
              >
                Guarda-roupas e Armários
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('catalog')}
                className="hover:text-orange-400 transition-colors"
              >
                Camas Box e Cabeceiras
              </button>
            </li>
          </ul>
        </div>

        {/* Customer area links */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-blue-500 pl-2">
            Crediário & Cliente
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('portal')}
                className="hover:text-blue-400 transition-colors"
              >
                Minha Conta & Meus Pedidos
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('portal')}
                className="hover:text-blue-400 transition-colors"
              >
                Acompanhar Parcelas do Crediário
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('simulator')}
                className="hover:text-blue-400 transition-colors"
              >
                Simulador de Parcelas
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('portal')}
                className="hover:text-blue-400 transition-colors"
              >
                Ficha Digital do Cliente
              </button>
            </li>
            <li>
              <span className="text-slate-500">Termos do Crediário e Garantia</span>
            </li>
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-amber-500 pl-2">
            Atendimento & Pix
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 font-medium">WhatsApp Comercial:</span>
                <a
                  href={`https://wa.me/55${settings.whatsapp?.replace(/\D/g, '') || '21973934438'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-white hover:text-orange-400"
                >
                  {settings.whatsapp || '(21) 97393-4438'}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 font-medium">Crediário & Chave Pix:</span>
                <span className="font-bold text-amber-400">
                  {settings.crediarioPixPhone || '(21) 96656-7027'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 font-medium">Localização:</span>
                <span className="text-slate-300">{settings.address}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 font-medium">Horário de Atendimento:</span>
                <span className="text-slate-300">{settings.hours || 'Seg à Sáb: 08h às 19h'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Admin Link and Copyright bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800/80 flex flex-col items-center justify-center gap-4">
        <div className="text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Belga Móveis - Todos os direitos reservados. CNPJ comercial cadastrado.
        </div>

        {/* Footer Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('intro')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-all border border-slate-700/60 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ver Abertura Cinematográfica (6s)</span>
          </button>

          {/* Discrete Admin Panel Button */}
          <button
            onClick={() => onNavigate('admin-login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition-all border border-slate-700/60 shadow-xs cursor-pointer"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>PAINEL ADMIN</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
