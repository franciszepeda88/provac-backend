import { useState } from 'react';
import { API_URL } from '../config';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [enviandoRecuperar, setEnviandoRecuperar] = useState(false);
  const [mensajeRecuperar, setMensajeRecuperar] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error en el login');
        setLoading(false);
        return;
      }

      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      onLoginSuccess(data.usuario);
    } catch (err) {
      setError('Error de conexión con el servidor');
      setLoading(false);
    }
  };

  const handleSolicitarRecuperar = async (e) => {
    e.preventDefault();
    setMensajeRecuperar('');
    if (!emailRecuperar) return;
    setEnviandoRecuperar(true);
    try {
      await fetch(`${API_URL}/auth/solicitar-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperar }),
      });
      setMensajeRecuperar('✅ Solicitud enviada. Otro administrador te compartirá tu nueva contraseña.');
    } catch (err) {
      setMensajeRecuperar('✅ Solicitud enviada. Otro administrador te compartirá tu nueva contraseña.');
    } finally {
      setEnviandoRecuperar(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/logo-provac.png" alt="PROVAC" className="login-logo" />
        <p className="login-subtitle">Panel de Administración</p>

        {!modoRecuperar ? (
          <>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Ingresar'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
            <button
              type="button"
              className="login-link-recuperar"
              onClick={() => { setModoRecuperar(true); setMensajeRecuperar(''); setEmailRecuperar(email); }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        ) : (
          <>
            <p className="login-recuperar-texto">
              Escribe tu correo. Otro administrador verá tu solicitud y te compartirá una nueva contraseña.
            </p>
            <form onSubmit={handleSolicitarRecuperar}>
              <input
                type="email"
                placeholder="Email"
                value={emailRecuperar}
                onChange={(e) => setEmailRecuperar(e.target.value)}
                required
              />
              <button type="submit" disabled={enviandoRecuperar}>
                {enviandoRecuperar ? 'Enviando...' : 'Solicitar restablecimiento'}
              </button>
            </form>
            {mensajeRecuperar && <p className="login-recuperar-mensaje">{mensajeRecuperar}</p>}
            <button
              type="button"
              className="login-link-recuperar"
              onClick={() => setModoRecuperar(false)}
            >
              ← Volver a iniciar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
}
