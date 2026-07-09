
import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword } from '../services/authService';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C39.986 36.657 44 30.836 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);

const LoginView: React.FC<{ onLogin: any, onGoHome: any }> = ({ onGoHome }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'platformAdmin' | 'shopOwner'>('shopOwner');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRoleChange = (newRole: 'platformAdmin' | 'shopOwner') => {
      setRole(newRole);
      if (newRole === 'platformAdmin') setIsRegistering(false);
      setIsResettingPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
        if (isResettingPassword) {
            const { error } = await resetPassword(email);
            if (error) throw error;
            setSuccessMsg("¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu clave.");
        } else if (isRegistering) {
            const { error } = await registerWithEmail(email, password, name);
            if (error) throw error;
        } else {
            const { error } = await loginWithEmail(email, password);
            if (error) throw error;
        }
    } catch (err: any) {
        setError(err.message || "Error al conectar con el servidor.");
    } finally {
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError(null);
      setGoogleLoading(true);
      // Guardamos el rol elegido para que al volver de Google sepamos qué perfil crear
      localStorage.setItem('userRole', role);
      
      try {
          const { error } = await loginWithGoogle();
          if (error) throw error;
          // El navegador redirigirá automáticamente
      } catch (err: any) {
          setError(err.message || "Error al conectar con Google.");
          setGoogleLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 shadow-2xl rounded-3xl overflow-hidden border border-slate-800">
        <div className="hidden md:block relative overflow-hidden group">
            <img 
                src="https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Barber Shop" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-10 text-white">
                <button onClick={onGoHome} className="text-left focus:outline-none rounded-lg p-1">
                    <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                        Barber
                        <span className="text-red-600"> AI</span>
                    </h1>
                </button>
                <p className="mt-4 text-lg text-slate-200 font-bold uppercase tracking-tight opacity-90">Gestiona tu barbería moderna con Inteligencia Artificial.</p>
            </div>
        </div>

        <div className="bg-white p-8 md:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto mb-8">
                <button 
                    onClick={() => {
                        if (isResettingPassword) setIsResettingPassword(false);
                        else onGoHome();
                    }} 
                    className="flex items-center text-slate-400 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-[0.3em] focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {isResettingPassword ? 'VOLVER AL LOGIN' : 'VOLVER AL INICIO'}
                </button>
            </div>

            <div className="w-full max-w-md mx-auto">
                 <h2 className="text-4xl font-black text-slate-950 mb-2 uppercase tracking-tight">
                    {isResettingPassword ? 'RECUPERAR' : isRegistering ? 'REGÍSTRATE' : 'BIENVENIDO'}
                 </h2>
                 <p className="text-slate-500 font-bold mb-8 text-xs uppercase tracking-widest">
                    {isResettingPassword ? 'Te enviaremos un correo de recuperación.' : 'Conéctate con el futuro de la barbería.'}
                 </p>

                 {!isResettingPassword && (
                    <div className="mb-8 flex bg-slate-100 p-1 rounded-2xl">
                        <button type="button" onClick={() => handleRoleChange('shopOwner')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'shopOwner' ? 'bg-white text-red-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
                            DUEÑO
                        </button>
                        <button type="button" onClick={() => handleRoleChange('platformAdmin')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${role === 'platformAdmin' ? 'bg-white text-red-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
                            ADMIN
                        </button>
                    </div>
                 )}
            
                <div className="space-y-4">
                    {!isResettingPassword && (
                        <>
                            <button 
                                onClick={handleGoogleLogin} 
                                disabled={googleLoading || loading} 
                                className="w-full flex items-center justify-center py-4 px-4 border-2 border-slate-100 rounded-2xl shadow-sm bg-white text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {googleLoading ? (
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                ) : (
                                    <GoogleIcon />
                                )}
                                {isRegistering ? 'REGISTRARSE CON GOOGLE' : 'CONTINUAR CON GOOGLE'}
                            </button>
                            
                            <div className="py-6 flex items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">O USAR EMAIL</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>
                        </>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                         {isRegistering && !isResettingPassword && (
                            <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required={isRegistering} 
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-950 font-bold focus:border-red-600 outline-none transition-all placeholder-slate-300 uppercase" 
                                    placeholder="JUAN PÉREZ" 
                                />
                                <span className="text-[9px] text-slate-400 block mt-1 ml-1">Nombre con el que se registrará tu negocio</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-950 font-bold focus:border-red-600 outline-none transition-all placeholder-slate-300" 
                                placeholder="email@ejemplo.com" 
                            />
                        </div>
                        
                        {!isResettingPassword && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
                                    {!isRegistering && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsResettingPassword(true);
                                                setError(null);
                                                setSuccessMsg(null);
                                            }}
                                            className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline"
                                        >
                                            Olvidé mi contraseña
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-950 font-bold focus:border-red-600 outline-none transition-all placeholder-slate-300" 
                                    placeholder="••••••••" 
                                />
                                {isRegistering && (
                                    <span className="text-[9px] text-slate-400 block mt-1 ml-1">Debe contener al menos 6 caracteres</span>
                                )}
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-2xl space-y-3">
                                <p className="text-red-700 text-[10px] font-black leading-tight uppercase tracking-tight">{error}</p>
                                {error.toLowerCase().includes('unauthorized-domain') && (
                                    <div className="text-[10px] text-slate-700 font-medium space-y-1.5 normal-case tracking-normal border-t border-red-100 pt-2 mt-2">
                                        <p className="font-bold text-red-700 uppercase tracking-wide">⚠️ ¿Cómo solucionar este error?</p>
                                        <p>Tu dominio personalizado (<span className="font-bold text-slate-900">{window.location.host}</span>) no está autorizado en tu consola de Firebase.</p>
                                        <ol className="list-decimal list-inside space-y-1 text-slate-600">
                                            <li>Inicia sesión en tu <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-red-700 font-bold underline hover:text-red-800">Consola de Firebase</a>.</li>
                                            <li>Selecciona tu proyecto.</li>
                                            <li>Ve a <strong>Authentication</strong> &gt; pestaña <strong>Settings</strong> (Configuración).</li>
                                            <li>Selecciona <strong>Authorized domains</strong> (Dominios autorizados).</li>
                                            <li>Haz clic en <strong>Add domain</strong> y añade exactamente: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-black text-slate-800">{window.location.host}</code></li>
                                        </ol>
                                        <p className="text-slate-500 text-[9px] pt-1">Opcional: Si quieres habilitar el login de Google por el servidor independiente, configura las variables <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code> y <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_SECRET</code> en tus variables de entorno.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-2xl">
                                <p className="text-emerald-700 text-[10px] font-black leading-tight uppercase tracking-tight">{successMsg}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || googleLoading} 
                            className="w-full py-4 px-4 bg-red-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-red-200 hover:bg-red-800 transition-all active:scale-[0.98] disabled:bg-slate-300"
                        >
                            {loading ? 'CARGANDO...' : isResettingPassword ? 'ENVIAR CORREO' : isRegistering ? 'CREAR CUENTA' : 'INGRESAR'}
                        </button>
                    </form>


                </div>
                
                {!isResettingPassword && role !== 'platformAdmin' && (
                  <p className="mt-10 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {isRegistering ? '¿YA TIENES CUENTA?' : '¿NO TIENES CUENTA?'} 
                      <button onClick={() => setIsRegistering(!isRegistering)} className="ml-2 text-red-600 hover:text-red-800 underline underline-offset-4 transition-colors">
                          {isRegistering ? 'INGRESAR AQUÍ' : 'REGÍSTRATE AQUÍ'}
                      </button>
                  </p>
                )}

                {isResettingPassword && (
                    <p className="mt-10 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        ¿RECORDÉ MI CLAVE? 
                        <button onClick={() => setIsResettingPassword(false)} className="ml-2 text-red-600 hover:text-red-800 underline underline-offset-4 transition-colors">
                            VOLVER AL LOGIN
                        </button>
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
