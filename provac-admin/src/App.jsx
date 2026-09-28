import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import BandaTransporteForm from './forms/BandaTransporteForm';
import BandaTransmisionForm from './forms/BandaTransmisionForm';
import BandaModularForm from './forms/BandaModularForm';
import BandaThermodriveForm from './forms/BandaThermodriveForm';
import heroImg from './assets/hero.png';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [editando, setEditando] = useState(null); // levantamiento que se está editando, o null
  const [vista, setVista] = useState('dashboard'); // dashboard | usuarios

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsuario = localStorage.getItem('usuario');

    if (savedToken && savedUsuario) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUsuario));
    }
  }, []);

  const handleLoginSuccess = (usuarioData) => {
    setUsuario(usuarioData);
    setToken(localStorage.getItem('token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setToken(null);
    setEditando(null);
  };

  const handleEditar = (levantamiento) => {
    setEditando(levantamiento);
  };

  const handleVolverDashboard = () => {
    setEditando(null);
  };

  return (
    <div className="app">
      {!usuario ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : editando && editando.tipo_banda === 'transmision' ? (
        <BandaTransmisionForm
          usuario={usuario}
          onBack={handleVolverDashboard}
          onLogout={handleLogout}
          onIrInicio={handleVolverDashboard}
          existente={editando}
        />
      ) : editando && editando.tipo_banda === 'modular' ? (
        <BandaModularForm
          usuario={usuario}
          onBack={handleVolverDashboard}
          onLogout={handleLogout}
          onIrInicio={handleVolverDashboard}
          existente={editando}
        />
      ) : editando && editando.tipo_banda === 'thermodrive' ? (
        <BandaThermodriveForm
          usuario={usuario}
          onBack={handleVolverDashboard}
          onLogout={handleLogout}
          onIrInicio={handleVolverDashboard}
          existente={editando}
        />
      ) : editando ? (
        <BandaTransporteForm
          usuario={usuario}
          onBack={handleVolverDashboard}
          onLogout={handleLogout}
          onIrInicio={handleVolverDashboard}
          existente={editando}
        />
      ) : (
        <div className="dashboard-container">
          <nav className="navbar">
            <img
              src="/logo-provac.png"
              alt="PROVAC"
              className="navbar-logo"
              onClick={() => { setVista('dashboard'); handleVolverDashboard(); }}
              role="button"
              tabIndex={0}
            />
            <div className="navbar-tabs">
              <button
                className={vista === 'dashboard' ? 'navbar-tab-activo' : 'navbar-tab'}
                onClick={() => setVista('dashboard')}
              >
                Levantamientos
              </button>
              {usuario.rol === 'admin' && (
                <button
                  className={vista === 'usuarios' ? 'navbar-tab-activo' : 'navbar-tab'}
                  onClick={() => setVista('usuarios')}
                >
                  Usuarios
                </button>
              )}
            </div>
            <div className="navbar-user-area">
              <span className="navbar-user">{usuario.nombre}</span>
              <button onClick={handleLogout}>Cerrar Sesión</button>
            </div>
          </nav>

          <div className="admin-hero" style={{ backgroundImage: `url(${heroImg})` }}>
            <div className="admin-hero-overlay" />
            <div className="admin-hero-text">
              <div className="admin-hero-eyebrow">
                <span className="admin-hero-eyebrow-bar" />
                <span>PANEL DE ADMINISTRACIÓN</span>
              </div>
              <h1>Bienvenido, {(usuario.nombre || '').split(' ')[0]}</h1>
              <p>Gestiona los levantamientos y usuarios del sistema PROVAC</p>
            </div>
          </div>

          <main>
            {vista === 'usuarios' ? <Usuarios /> : <Dashboard onEditar={handleEditar} />}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
