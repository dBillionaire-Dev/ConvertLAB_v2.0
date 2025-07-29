import Link from 'next/link';
import { Code } from 'lucide-react';

export function Footer() {

  return (
    <footer className="bg-gray-900 text-white pb-3 mt-4">
      <div className="container mx-auto px-8">

        <div className="flex flex-col items-center justify-center space-y-4 mt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Code className="h-4 w-4" />
            <span>Developed by</span>
            <Link
              href="https://nexdbillionairedev.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Nex.Dev
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
