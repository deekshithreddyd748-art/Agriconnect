import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, Tractor, Users, Warehouse, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-forest-900 text-earth-100 mt-16 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-fresh-500 text-forest-900 flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">{t('brand')}</span>
            </div>
            <p className="text-sm text-forest-200 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              {t('footer.servicesHeading')}
            </h3>
            <ul className="space-y-2 text-sm text-forest-200">
              <li>
                <Link to="/machinery" className="hover:text-white inline-flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5" /> {t('footer.machineryLink')}
                </Link>
              </li>
              <li>
                <Link to="/labour" className="hover:text-white inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {t('footer.labourLink')}
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-white inline-flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5" /> {t('footer.facilitiesLink')}
                </Link>
              </li>
              <li>
                <Link to="/nearby-map" className="hover:text-white inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {t('footer.mapLink')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              {t('footer.navigationHeading')}
            </h3>
            <ul className="space-y-2 text-sm text-forest-200">
              <li>
                <Link to="/about" className="hover:text-white">
                  {t('footer.aboutLink')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white">
                  {t('footer.howLink')}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white">
                  {t('footer.allServicesLink')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white">
                  {t('footer.registerLink')}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white">
                  {t('footer.loginLink')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              {t('footer.contactHeading')}
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
                <span>{t('footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-forest-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-forest-200">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p>{t('footer.poweredBy')}</p>
        </div>
      </div>
    </footer>
  );
}
