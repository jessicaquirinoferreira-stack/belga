import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'customer-login' | 'customer-register' | 'admin-login';
  onSuccess: (isAdmin: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'customer-login',
  onSuccess,
}) => {
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    mustChangePassword, 
    updateUserPassword 
  } = useAuth();

  const [mode, setMode] = useState<'customer-login' | 'customer-register' | 'admin-login'>(
    initialMode
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If initialMode changes when opened
  React.useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mustChangePassword) {
        if (newPassword.length < 6) {
          throw new Error('A nova senha deve ter no mínimo 6 dígitos.');
        }
        await updateUserPassword(newPassword);
        onSuccess(true);
        onClose();
        return;
      }

      if (mode === 'customer-register') {
        if (!name.trim()) throw new Error('Digite seu nome completo.');
        if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 dígitos.');
        await signUpWithEmail(email, password, name);
        onSuccess(false);
        onClose();
      } else if (mode === 'admin-login') {
        await signInWithEmail(email || 'admin@x.com', password);
        onSuccess(true);
        onClose();
      } else {
        // Customer login
        await signInWithEmail(email, password);
        onSuccess(false);
        onClose();
      }
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Tente entrar na sua conta.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Método de login em ativação. Tente novamente em instantes.');
      } else {
        setError(err.message || 'Erro na autenticação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess(false);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup, no error needed
      } else {
        setError('Falha ao conectar com o Google. Use e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                mode === 'admin-login' ? 'bg-purple-700' : 'bg-orange-600'
              }`}
            >
              {mode === 'admin-login' ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {mustChangePassword
                  ? 'Troca de Senha Obrigatória'
                  : mode === 'admin-login'
                  ? 'Painel Administrativo'
                  : mode === 'customer-register'
                  ? 'Criar Minha Conta'
                  : 'Entrar no Crediário Belga'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'admin-login'
                  ? 'Acesso restrito para equipe de gestão'
                  : 'Consulte suas parcelas e compras'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Password Change View for Initial Admin Login (Item 7 from prompt) */}
        {mustChangePassword ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block mb-1">Atenção, Administrador:</span>
              Você está utilizando as credenciais iniciais. Por motivos de segurança, cadastre uma nova senha pessoal antes de acessar o painel.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nova Senha Pessoal *
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha e Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick credentials hint for admin login */}
            {mode === 'admin-login' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                <span className="font-bold block">Acesso Administrativo Belga Móveis:</span>
                Utilize seu e-mail cadastrado ou <strong>admin@x.com</strong>
              </div>
            )}

            {mode === 'customer-register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'admin-login' ? 'admin@x.com' : 'seuemail@exemplo.com'}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                <span>{mode === 'customer-login' ? 'Senha de 6 Dígitos (Ficha Digital) *' : 'Senha *'}</span>
                {mode === 'customer-login' && (
                  <span className="text-[10px] text-orange-600 font-semibold normal-case">Senha criada no pedido</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'customer-login' ? 'Sua senha de 6 dígitos' : '••••••••'}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {mode === 'customer-login' && (
              <div className="p-2.5 bg-orange-50/70 border border-orange-200/60 rounded-xl text-[11px] text-orange-900 leading-snug">
                💡 <strong>Dica:</strong> Se você emitiu uma Ficha de Pedido pelo site, utilize o mesmo <strong>e-mail</strong> e a <strong>senha de 6 dígitos</strong> preenchidos para ver seu carnê e parcelas.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                mode === 'admin-login'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <span>
                {loading
                  ? 'Verificando...'
                  : mode === 'admin-login'
                  ? 'Entrar no Painel Administrativo'
                  : mode === 'customer-register'
                  ? 'Cadastrar Conta'
                  : 'Entrar na Minha Conta'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode !== 'admin-login' && (
              <>
                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-slate-400 text-[11px] uppercase font-bold">
                    Ou
                  </span>
                  <div className="grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuar com o Google</span>
                </button>
              </>
            )}

            {/* Toggle Modes */}
            <div className="pt-2 text-center text-xs space-y-2">
              {mode === 'customer-login' ? (
                <p className="text-slate-600">
                  Não possui cadastro?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('customer-register');
                      setError('');
                    }}
                    className="font-bold text-orange-600 hover:underline"
                  >
                    Criar conta agora
                  </button>
                </p>
              ) : mode === 'customer-register' ? (
                <p className="text-slate-600">
                  Já possui cadastro?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('customer-login');
                      setError('');
                    }}
                    className="font-bold text-orange-600 hover:underline"
                  >
                    Entrar na sua conta
                  </button>
                </p>
              ) : (
                <p className="text-slate-600">
                  É cliente?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('customer-login');
                      setError('');
                    }}
                    className="font-bold text-purple-700 hover:underline"
                  >
                    Ir para login de cliente
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
