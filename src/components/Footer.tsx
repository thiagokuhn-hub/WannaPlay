import React from 'react';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-4">
          <h3 className="text-sm font-medium">Desenvolvido por Gustavo Kuhn</h3>
          <a 
            href="mailto:gutv@hotmail.com" 
            className="flex items-center hover:text-blue-200 transition-colors duration-200"
            title="Enviar email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}