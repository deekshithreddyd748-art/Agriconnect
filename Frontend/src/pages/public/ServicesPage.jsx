import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tractor, Users, Warehouse, MapPin, ArrowRight } from 'lucide-react';
import {
  EQUIPMENT_CATEGORIES,
  FACILITY_CATEGORIES,
  LABOUR_CATEGORIES,
} from '../../utils/constants';

export default function ServicesPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">
            {t('servicesPage.eyebrow')}
          </span>
          <h1 className="text-3xl font-extrabold text-forest-900 mt-1">
            {t('servicesPage.title')}
          </h1>
          <p className="text-slate-600 mt-1">{t('servicesPage.subtitle')}</p>
        </div>
        <Link
          to="/nearby-map"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800 w-fit"
        >
          <MapPin className="w-4 h-4" /> {t('footer.mapLink')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4">
              <Tractor className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('landing.servicesSection.machineryTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              {t('landing.servicesSection.machineryDesc')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {t(`categories.equipment.${cat}`, cat)}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/machinery"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            {t('landing.findEquipment')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-harvest-100 text-harvest-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('landing.servicesSection.labourTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              {t('landing.servicesSection.labourDesc')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LABOUR_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {t(`categories.labour.${cat}`, cat)}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/labour"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            {t('landing.findLabour')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4">
              <Warehouse className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {t('landing.servicesSection.facilitiesTitle')}
            </h2>
            <p className="text-sm text-slate-600 mt-1 mb-4">
              {t('landing.servicesSection.facilitiesDesc')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FACILITY_CATEGORIES.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-earth-100 text-slate-700 text-xs font-medium"
                >
                  {t(`categories.facility.${cat}`, cat)}
                </span>
              ))}
            </div>
          </div>
          <Link
            to="/facilities"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800"
          >
            {t('landing.exploreFacilities')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
