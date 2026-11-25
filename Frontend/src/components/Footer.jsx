import { Link } from 'react-router-dom';
import { Sprout, MapPin, Tractor, Users, Warehouse } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-earth-100 mt-16 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-fresh-500 text-white flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">AgriConnect</span>
            </div>
            <p className="text-sm text-forest-200 leading-relaxed">
              Connecting Farmers. Empowering Agriculture. Hyperlocal discovery for
              machinery, skilled farm labour, and post-harvest infrastructure.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Services
            </h3>
            <ul className="space-y-2 text-sm text-forest-200">
              <li>
                <Link to="/machinery" className="hover:text-white inline-flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5" /> Machinery Rental
                </Link>
              </li>
              <li>
                <Link to="/labour" className="hover:text-white inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Agricultural Labour
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-white inline-flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5" /> Post-Harvest Facilities
                </Link>
              </li>
              <li>
                <Link to="/nearby-map" className="hover:text-white inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Nearby Services Map
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-sm text-forest-200">
              <li>
                <Link to="/about" className="hover:text-white">
                  About AgriConnect
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white">
                  Service Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Get Started
            </h3>
            <ul className="space-y-2 text-sm text-forest-200">
              <li>
                <Link to="/register" className="hover:text-white">
                  Register as Farmer
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white">
                  Become a Service Provider
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  Sign In / Demo Accounts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-forest-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-forest-200">
          <p>© {new Date().getFullYear()} AgriConnect. Built for Rural Innovation.</p>
          <p>Hyperlocal Distance Engine powered by Haversine & OpenStreetMap</p>
        </div>
      </div>
    </footer>
  );
}
