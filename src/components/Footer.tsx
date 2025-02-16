import React from 'react';
import { Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <h3 className="text-sm font-medium">Desenvolvido por Gustavo Kuhn</h3>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a 
              href="mailto:gutv@hotmail.com" 
              className="flex items-center gap-2 hover:text-blue-200 transition-colors duration-200"
            >
              <Mail className="w-4 h-4" />
              <span>gutv@hotmail.com</span>
            </a>
            
            <a 
              href="tel:+5551997647900" 
              className="flex items-center gap-2 hover:text-blue-200 transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              <span>(51) 99764-7900</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}