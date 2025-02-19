import React from 'react';
import { Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-4 text-sm text-gray-600">
            <a
              href="/legal/privacy-policy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              Política de Privacidade
            </a>
            <span>•</span>
            <a
              href="/legal/terms-of-service.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              Termos de Serviço
            </a>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Desenvolvido por Gustavo Kuhn</span>
            <a
              href="mailto:gutv@hotmail.com"
              className="inline-flex items-center hover:text-gray-900"
              title="Enviar email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}