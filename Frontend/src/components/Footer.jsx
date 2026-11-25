import { Link } from 'react-router-dom';
import { Sprout, MapPin, Tractor, Users, Warehouse, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-900 text-earth-100 mt-16 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-fresh-500 text-forest-900 flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">AgriConnect</span>
            </div>
            <p className="text-sm text-forest-200 leading-relaxed">
              Empowering Farmers. Connecting Resources. Hyperlocal discovery for
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
              Navigation
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
                  All Services
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white">
                  Join AgriConnect
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Contact Information
            </h3>
            <ul className="space-y-2.5 text-sm text-forest-200">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-fresh-500 shrink-0" />
                <span>support@agriconnect.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-fresh-500 shrink-0" />
                <span>+91 1800-123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-fresh-500 shrink-0 mt-0.5" />
                <span>Agro Innovation Hub, Baramati, Pune, Maharashtra</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-forest-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-forest-200">
          <p>© {new Date().getFullYear()} AgriConnect. Empowering Rural Agriculture.</p>
          <p>Powered by OpenStreetMap, Leaflet &amp; Haversine Discovery</p>
        </div>
      </div>
    </footer>
  );
}
