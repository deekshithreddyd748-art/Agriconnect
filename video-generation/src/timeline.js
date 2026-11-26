export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SCENES = [
  {
    id: 'scene1',
    name: 'Cinematic Introduction',
    startSec: 0,
    durationSec: 18,
    narration:
      'Introducing AgriConnect, a digital platform designed to simplify access to agricultural services and connect farmers with nearby service providers.',
    subtitles: [
      {
        startOffset: 0.4,
        endOffset: 8.2,
        text: 'Introducing **AgriConnect**, a digital platform designed to simplify access to agricultural services',
      },
      {
        startOffset: 8.4,
        endOffset: 15.8,
        text: 'and connect **Farmers** with nearby agricultural service providers.',
      },
    ],
  },
  {
    id: 'scene2',
    name: 'Problem and Solution',
    startSec: 18,
    durationSec: 20,
    narration:
      'Finding reliable machinery, available labour and suitable agricultural facilities can be challenging. AgriConnect brings these essential services together through one simple platform.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 9.8,
        text: 'Finding reliable **Machinery**, available **Labour** and suitable **Facilities** can be challenging.',
      },
      {
        startOffset: 10.0,
        endOffset: 18.2,
        text: '**AgriConnect** brings all these **Nearby Services** together through one simple platform.',
      },
    ],
  },
  {
    id: 'scene3',
    name: 'Simple User Access',
    startSec: 38,
    durationSec: 20,
    narration:
      'Users can access AgriConnect through a simple interface and select the role that matches their needs. Each user gets access to relevant services and dashboard features.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 9.5,
        text: 'Users can enter **AgriConnect** with a simple mobile interface and choose their exact role.',
      },
      {
        startOffset: 9.7,
        endOffset: 18.2,
        text: 'Each role unlocks relevant **Nearby Services** and tailored dashboard features.',
      },
    ],
  },
  {
    id: 'scene4',
    name: 'Farmer Dashboard',
    startSec: 58,
    durationSec: 30,
    narration:
      'Farmers can explore available machinery, discover labour services and find agricultural facilities. They can view relevant service information and submit booking requests through the platform.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 13.5,
        text: '**Farmers** can explore available **Machinery**, discover **Labour** and find post-harvest **Facilities**.',
      },
      {
        startOffset: 13.7,
        endOffset: 27.0,
        text: 'Inspect real availability and submit **Bookings** directly through the **AgriConnect** platform.',
      },
    ],
  },
  {
    id: 'scene5',
    name: 'Service Provider Dashboards',
    startSec: 88,
    durationSec: 30,
    narration:
      'AgriConnect also empowers service providers. Equipment owners can manage machinery listings, labour providers can present their skills and availability, and facility owners can showcase their agricultural services.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 11.5,
        text: '**AgriConnect** empowers equipment owners to manage **Machinery** listings and availability.',
      },
      {
        startOffset: 11.7,
        endOffset: 27.5,
        text: '**Labour** providers showcase skills and wages, while **Facilities** highlight storage capacity.',
      },
    ],
  },
  {
    id: 'scene6',
    name: 'Nearby Map and Booking',
    startSec: 118,
    durationSec: 27,
    narration:
      'With location-based discovery, users can explore nearby agricultural resources. The booking system helps connect farmers and service providers through a simple service-request workflow.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 11.8,
        text: 'With location-based discovery, explore **Nearby Services** within your preferred radius.',
      },
      {
        startOffset: 12.0,
        endOffset: 24.5,
        text: 'The **Bookings** system connects **Farmers** and providers through a clear request workflow.',
      },
    ],
  },
  {
    id: 'scene7',
    name: 'Final Branding',
    startSec: 145,
    durationSec: 20,
    narration:
      'AgriConnect brings agricultural services closer to the farming community through a simple and connected digital platform. AgriConnect — connecting farmers, empowering agriculture.',
    subtitles: [
      {
        startOffset: 0.5,
        endOffset: 10.5,
        text: '**AgriConnect** brings essential **Machinery**, **Labour** and **Facilities** closer to rural communities.',
      },
      {
        startOffset: 10.7,
        endOffset: 18.2,
        text: '**AgriConnect** — connecting **Farmers**, empowering agriculture. Developed by Team ANOKA.',
      },
    ],
  },
];

export const TOTAL_DURATION_SEC = SCENES.reduce((acc, s) => acc + s.durationSec, 0); // 165s = 2m 45s
export const TOTAL_FRAMES = TOTAL_DURATION_SEC * FPS; // 4950 frames
