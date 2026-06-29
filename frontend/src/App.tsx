import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Track from './pages/Track';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, paddingTop: 72 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/restaurants/:id" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/track/:id" element={<Track />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agent-dashboard" element={<AgentDashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
