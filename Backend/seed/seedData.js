import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Equipment from '../models/Equipment.js';
import Labour from '../models/Labour.js';
import LabourRequest from '../models/LabourRequest.js';
import LabourApplication from '../models/LabourApplication.js';
import LabourBooking from '../models/LabourBooking.js';
import Facility from '../models/Facility.js';
import Booking from '../models/Booking.js';

export async function ensureDemoData({ forceReset = false } = {}) {
  const existingUsers = await User.countDocuments({});
  if (existingUsers > 0 && !forceReset) {
    return { seeded: false };
  }

  if (forceReset) {
    await Promise.all([
      LabourApplication.deleteMany({}),
      LabourRequest.deleteMany({}),
      Booking.deleteMany({}),
      Equipment.deleteMany({}),
      Labour.deleteMany({}),
      Facility.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  const users = await User.create([
    {
      name: 'Rajesh Patil',
      email: 'farmer@agriconnect.in',
      phone: '+91 98230 11223',
      mobileNumber: '9823011223',
      mobileVerified: true,
      password: 'Demo@123',
      role: 'farmer',
      language: 'Marathi',
      village: 'Baramati',
      district: 'Pune',
      state: 'Maharashtra',
      primaryCrop: 'Sugarcane & Wheat',
      farmSize: 6.5,
      location: {
        lat: 18.1517,
        lng: 74.5777,
        address: 'Baramati Rural Road, Pune, Maharashtra',
      },
    },
    {
      name: 'Suresh Deshmukh',
      email: 'owner@agriconnect.in',
      phone: '+91 98231 44556',
      mobileNumber: '9823144556',
      mobileVerified: true,
      password: 'Demo@123',
      role: 'equipment_owner',
      language: 'Marathi',
      village: 'Malegaon Bk',
      district: 'Pune',
      state: 'Maharashtra',
      location: {
        lat: 18.1742,
        lng: 74.539,
        address: 'Malegaon Bk Farm Hub, Baramati, Pune',
      },
    },
    {
      name: 'Mahesh Jadhav',
      email: 'owner2@agriconnect.in',
      phone: '+91 97654 22334',
      mobileNumber: '9765422334',
      mobileVerified: true,
      password: 'Demo@123',
      role: 'equipment_owner',
      language: 'Hindi',
      village: 'Phaltan Road',
      district: 'Pune',
      state: 'Maharashtra',
      location: {
        lat: 18.081,
        lng: 74.504,
        address: 'Sharda Nagar, Baramati, Pune',
      },
    },
    {
      name: 'Kavita Shinde',
      email: 'labour@agriconnect.in',
      phone: '+91 98901 77889',
      mobileNumber: '9890177889',
      mobileVerified: true,
      password: 'Demo@123',
      role: 'labour_provider',
      language: 'Marathi',
      village: 'Pandare',
      district: 'Pune',
      state: 'Maharashtra',
      skills: ['Harvesting', 'Sowing / Planting', 'Weeding'],
      experience: '8+ years farm team supervision',
      availability: true,
      location: {
        lat: 18.118,
        lng: 74.544,
        address: 'Pandare Gram Panchayat, Baramati, Pune',
      },
    },
    {
      name: 'Vikram Kulkarni',
      email: 'facility@agriconnect.in',
      phone: '+91 94220 55667',
      mobileNumber: '9422055667',
      mobileVerified: true,
      password: 'Demo@123',
      role: 'facility_operator',
      language: 'English',
      village: 'MIDC Baramati',
      district: 'Pune',
      state: 'Maharashtra',
      location: {
        lat: 18.1865,
        lng: 74.6115,
        address: 'Plot C-14, Agro Industrial Zone, Baramati',
      },
    },
    {
      name: 'AgriConnect Admin',
      email: 'admin@agriconnect.in',
      phone: '+91 90000 00001',
      mobileNumber: '9000000001',
      mobileVerified: true,
      password: 'Admin@123',
      role: 'admin',
      language: 'English',
      village: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      location: {
        lat: 18.5204,
        lng: 73.8567,
        address: 'AgriConnect Operations Center, Pune',
      },
    },
  ]);

  const [farmer, owner1, owner2, labourProvider, facilityOperator] = users;

  const equipments = await Equipment.create([
    {
      name: 'Mahindra Arjun Novo 605 DI Tractor',
      category: 'Tractors',
      description:
        '57 HP heavy-duty 4WD tractor ideal for deep ploughing, haulage, and multi-crop land preparation. Includes experienced operator on request.',
      images: ['/images/tractor.svg'],
      ownerId: owner1._id,
      price: 750,
      priceUnit: 'hour',
      availability: true,
      serviceRadius: 20,
      specifications: { brand: 'Mahindra', horsepower: '57 HP', year: '2024' },
      location: {
        lat: 18.1742,
        lng: 74.539,
        address: 'Malegaon Bk Farm Hub, Baramati',
        village: 'Malegaon Bk',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      name: 'Shaktiman 7-Feet Heavy Rotavator',
      category: 'Rotavators',
      description:
        'High-speed 48-blade rotary tiller for fine seedbed preparation in sugarcane, wheat, and vegetable plots.',
      images: ['/images/rotavator.svg'],
      ownerId: owner1._id,
      price: 1100,
      priceUnit: 'acre',
      availability: true,
      serviceRadius: 15,
      specifications: { brand: 'Shaktiman', horsepower: '45+ HP required', year: '2023' },
      location: {
        lat: 18.165,
        lng: 74.561,
        address: 'Katphal Link Road, Baramati',
        village: 'Katphal',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      name: 'CLAAS Crop Tiger 40 Combine Harvester',
      category: 'Harvesters',
      description:
        'Multi-crop combine harvester suited for wheat, soybean, paddy, and gram with minimal grain loss and rapid unloading.',
      images: ['/images/harvester.svg'],
      ownerId: owner2._id,
      price: 2400,
      priceUnit: 'hour',
      availability: true,
      serviceRadius: 25,
      specifications: { brand: 'CLAAS', horsepower: '76 HP', year: '2024' },
      location: {
        lat: 18.081,
        lng: 74.504,
        address: 'Sharda Nagar Yard, Baramati',
        village: 'Sharda Nagar',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      name: '11-Row Precision Seed Cum Fertilizer Seeder',
      category: 'Seeders',
      description:
        'Zero-till calibrated seeder ensuring uniform row spacing and simultaneous basal fertilizer placement.',
      images: ['/images/seed-drill.svg'],
      ownerId: owner2._id,
      price: 1600,
      priceUnit: 'day',
      availability: true,
      serviceRadius: 18,
      specifications: { brand: 'Fieldking', horsepower: '35-50 HP', year: '2023' },
      location: {
        lat: 18.132,
        lng: 74.645,
        address: 'Jalochi Agro Centre, Baramati',
        village: 'Jalochi',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      name: 'Tractor-Mounted Boom Sprayer (400L)',
      category: 'Sprayers',
      description:
        '12-nozzle uniform pressure boom sprayer for orchards, cotton, and vegetable fields with low drift nozzles.',
      images: ['/images/sprayer.svg'],
      ownerId: owner1._id,
      price: 500,
      priceUnit: 'acre',
      availability: false,
      serviceRadius: 12,
      specifications: { brand: 'Aspee', horsepower: '35+ HP', year: '2022' },
      location: {
        lat: 18.211,
        lng: 74.592,
        address: 'Rui Canal Road, Baramati',
        village: 'Rui',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      name: '5 HP Submersible & Solar Backup Water Pump',
      category: 'Water Pumps',
      description:
        'Portable high-discharge irrigation pump unit with 120m delivery hose for emergency drought watering.',
      images: ['/images/water-pump.svg'],
      ownerId: owner2._id,
      price: 900,
      priceUnit: 'day',
      availability: true,
      serviceRadius: 15,
      specifications: { brand: 'Kirloskar', horsepower: '5 HP', year: '2024' },
      location: {
        lat: null,
        lng: null,
        address: 'Supe Weekly Market Yard (Coordinates Pending)',
        village: 'Supe',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
  ]);

  const labours = await Labour.create([
    {
      providerId: labourProvider._id,
      title: 'Sahyadri Sugarcane & Grain Harvesting Squad',
      category: 'Harvesting',
      description:
        'Experienced 14-member harvesting team skilled in sugarcane cutting, wheat bundling, and clean crop handling.',
      skills: ['Sugarcane Cutting', 'Wheat Harvesting', 'Crop Bundling', 'Loading'],
      experience: '8+ years rural team experience',
      workersAvailable: 14,
      pricePerWorker: 550,
      priceUnit: 'day',
      availability: true,
      availableDates: ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29'],
      serviceRadius: 15,
      location: {
        lat: 18.118,
        lng: 74.544,
        address: 'Pandare Gram Panchayat, Baramati',
        village: 'Pandare',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      providerId: labourProvider._id,
      title: 'GreenRoots Onion & Vegetable Transplantation Crew',
      category: 'Transplantation',
      description:
        'Trained 10-worker horticulture crew specializing in uniform onion, tomato, and paddy seedling transplantation.',
      skills: ['Onion Nursery Transplanting', 'Paddy Planting', 'Bed Preparation'],
      experience: '6 years horticulture specialization',
      workersAvailable: 10,
      pricePerWorker: 480,
      priceUnit: 'day',
      availability: true,
      availableDates: ['2026-11-26', '2026-11-28', '2026-11-30'],
      serviceRadius: 20,
      location: {
        lat: 18.149,
        lng: 74.512,
        address: 'Sangavi Chowk, Baramati',
        village: 'Sangavi',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      providerId: labourProvider._id,
      title: 'Precision Weeding & Drip Maintenance Team',
      category: 'Weeding',
      description:
        '8 skilled farm workers equipped for manual inter-row weeding, mulching sheet laying, and drip line checks.',
      skills: ['Manual Weeding', 'Mulching Film Laying', 'Drip Flushing'],
      experience: '5 years orchard & vegetable care',
      workersAvailable: 8,
      pricePerWorker: 450,
      priceUnit: 'day',
      availability: true,
      availableDates: ['2026-11-27', '2026-11-29'],
      serviceRadius: 12,
      location: {
        lat: 18.198,
        lng: 74.565,
        address: 'Tandulwadi Road, Baramati',
        village: 'Tandulwadi',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
  ]);

  const facilities = await Facility.create([
    {
      operatorId: facilityOperator._id,
      name: 'Baramati AgroFresh Cold Storage & Ripening Hub',
      category: 'Cold Storage',
      description:
        'Multi-chamber temperature-controlled cold storage (-2°C to +14°C) with backup power for pomegranate, grapes, onions, and potatoes.',
      images: ['/images/cold-storage.svg'],
      capacity: 500,
      availableCapacity: 320,
      capacityUnit: 'tons',
      price: 45,
      priceUnit: 'per ton/day',
      operatingHours: '06:00 AM - 09:00 PM',
      servicesOffered: ['Pre-cooling', 'Cold Storage', 'Crate Supply', 'Moisture Monitoring'],
      availability: true,
      contactPhone: '+91 94220 55667',
      location: {
        lat: 18.1865,
        lng: 74.6115,
        address: 'Plot C-14, Agro Industrial Zone, Baramati',
        village: 'MIDC Baramati',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      operatorId: facilityOperator._id,
      name: 'Kisan Krishi Scientific Grain Warehouse',
      category: 'Warehouses',
      description:
        'Moisture-proof, pest-monitored scientific godown with digital weighbridge and electronic receipt tracking for pulses and cereals.',
      images: ['/images/warehouse.svg'],
      capacity: 1200,
      availableCapacity: 780,
      capacityUnit: 'tons',
      price: 22,
      priceUnit: 'per ton/day',
      operatingHours: '07:00 AM - 07:00 PM',
      servicesOffered: ['Dry Grain Storage', 'Digital Weighbridge', 'Fumigation', 'Bagging'],
      availability: true,
      contactPhone: '+91 94220 55667',
      location: {
        lat: 18.141,
        lng: 74.618,
        address: 'Morgaon Road Market Yard, Baramati',
        village: 'Baramati',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
    {
      operatorId: facilityOperator._id,
      name: 'Indrayani Solar Grain Drying & Grading Unit',
      category: 'Drying Facilities',
      description:
        'Hybrid solar-biomass batch grain dryer and optical sorter reducing post-harvest moisture to safe 12% storage levels.',
      images: ['/images/grain-dryer.svg'],
      capacity: 80,
      availableCapacity: 55,
      capacityUnit: 'tons',
      price: 350,
      priceUnit: 'per ton/day',
      operatingHours: '06:30 AM - 06:30 PM',
      servicesOffered: ['Grain Drying', 'Moisture Testing', 'Cleaning & Grading'],
      availability: true,
      contactPhone: '+91 94220 55667',
      location: {
        lat: 18.062,
        lng: 74.595,
        address: 'Nira Highway Agro Park, Pune',
        village: 'Nira',
        district: 'Pune',
        state: 'Maharashtra',
      },
    },
  ]);

  await Booking.create([
    {
      serviceType: 'equipment',
      serviceModel: 'Equipment',
      serviceId: equipments[0]._id,
      serviceName: equipments[0].name,
      farmerId: farmer._id,
      providerId: owner1._id,
      bookingDate: '2026-11-28',
      duration: 4,
      durationUnit: 'hour',
      farmLocation: {
        address: 'Plot 12, Baramati Rural Road',
        village: 'Baramati',
        district: 'Pune',
        lat: 18.1517,
        lng: 74.5777,
      },
      notes: 'Need deep ploughing for 3-acre wheat plot starting 7 AM.',
      estimatedCost: 3000,
      status: 'Pending',
    },
    {
      serviceType: 'labour',
      serviceModel: 'Labour',
      serviceId: labours[0]._id,
      serviceName: labours[0].title,
      farmerId: farmer._id,
      providerId: labourProvider._id,
      bookingDate: '2026-11-29',
      duration: 2,
      durationUnit: 'day',
      workersRequested: 6,
      farmLocation: {
        address: 'Survey 48, Baramati West',
        village: 'Baramati',
        district: 'Pune',
        lat: 18.1517,
        lng: 74.5777,
      },
      notes: 'Sugarcane harvesting near canal bend.',
      estimatedCost: 6600,
      status: 'Accepted',
      providerNote: 'Team confirmed for 7:00 AM arrival.',
    },
    {
      serviceType: 'facility',
      serviceModel: 'Facility',
      serviceId: facilities[0]._id,
      serviceName: facilities[0].name,
      farmerId: farmer._id,
      providerId: facilityOperator._id,
      bookingDate: '2026-12-01',
      duration: 10,
      durationUnit: 'day',
      quantity: 12,
      selectedService: 'Cold Storage',
      farmLocation: {
        address: 'Baramati Rural Road',
        village: 'Baramati',
        district: 'Pune',
        lat: 18.1517,
        lng: 74.5777,
      },
      notes: '12 tons fresh pomegranate crates requiring +5°C chamber.',
      estimatedCost: 5400,
      status: 'Completed',
      providerNote: 'Stored in Chamber B-2.',
    },
    {
      serviceType: 'equipment',
      serviceModel: 'Equipment',
      serviceId: equipments[2]._id,
      serviceName: equipments[2].name,
      farmerId: farmer._id,
      providerId: owner2._id,
      bookingDate: '2026-11-24',
      duration: 3,
      durationUnit: 'hour',
      farmLocation: {
        address: 'Baramati East Block',
        village: 'Baramati',
        district: 'Pune',
        lat: 18.1517,
        lng: 74.5777,
      },
      notes: 'Soybean harvesting request.',
      estimatedCost: 7200,
      status: 'Rejected',
      providerNote: 'Harvester scheduled for maintenance on that date.',
    },
  ]);

  const seedRequests = await LabourRequest.create([
    {
      requestCode: 'LR-2026-1001',
      farmerId: farmer._id,
      category: 'Harvesting',
      workersRequired: 5,
      workersAccepted: 1,
      remainingVacancies: 4,
      acceptedWorkerIds: [labourProvider._id],
      startDate: '2026-12-02',
      durationDays: 3,
      dailyWage: 520,
      estimatedTotal: 7800,
      location: {
        village: 'Baramati',
        district: 'Pune',
        state: 'Maharashtra',
        address: 'Baramati Rural Road, Plot 14',
        lat: 18.1517,
        lng: 74.5777,
      },
      instructions: 'Sugarcane harvesting & clean bundling near main canal gate.',
      preferredHours: '07:00 AM - 02:00 PM',
      status: 'Worker Accepted',
    },
    {
      requestCode: 'LR-2026-1002',
      farmerId: farmer._id,
      category: 'Weeding',
      workersRequired: 4,
      workersAccepted: 0,
      remainingVacancies: 4,
      acceptedWorkerIds: [],
      startDate: '2026-12-05',
      durationDays: 2,
      dailyWage: 450,
      estimatedTotal: 3600,
      location: {
        village: 'Baramati',
        district: 'Pune',
        state: 'Maharashtra',
        address: 'East Farm Plot, Baramati',
        lat: 18.1517,
        lng: 74.5777,
      },
      instructions: 'Manual inter-row weeding for onion field.',
      preferredHours: '06:30 AM - 01:30 PM',
      status: 'Pending',
    },
  ]);

  await Promise.all([
    LabourApplication.create({
      requestId: seedRequests[0]._id,
      workerId: labourProvider._id,
      workerName: labourProvider.name,
      workerPhone: labourProvider.phone,
      workerVillage: 'Pandare, Pune',
      skills: labourProvider.skills,
      experience: labourProvider.experience,
      message: 'Available with harvesting tools on Dec 2.',
      status: 'Accepted',
    }),
    LabourBooking.create({
      bookingCode: 'LB-2026-1001',
      labourRequestId: seedRequests[0]._id,
      farmerId: farmer._id,
      workerId: labourProvider._id,
      bookingStatus: 'Accepted',
    }),
  ]);

  console.log('AgriConnect demo data seeded successfully.');
  return { seeded: true };
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const forceReset = process.argv.includes('--reset');
  connectDB()
    .then(() => ensureDemoData({ forceReset }))
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
