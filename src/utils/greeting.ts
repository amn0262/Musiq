import { Gender } from '../types/music';

export interface GreetingInfo {
  greeting: string;
  salutation: string;
  subGreeting: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  icon: 'sun' | 'cloud-sun' | 'moon' | 'sparkles';
}

/**
 * Returns dynamic, personalized time-of-day greeting tailored by user's name and gender
 * Supports Arabic (RTL) and English.
 */
export function getTimeGreeting(
  name: string,
  gender: Gender = 'male',
  date: Date = new Date(),
  lang: 'ar' | 'en' = 'ar'
): GreetingInfo {
  const cleanName = (name || (lang === 'ar' ? 'صديقنا الموسيقي' : 'Music Lover')).trim();
  const hour = date.getHours();

  if (lang === 'ar') {
    const isFemale = gender === 'female';
    const salutation = isFemale ? `عزيزتي ${cleanName}` : `عزيزي ${cleanName}`;

    // Morning: 5:00 to 11:59
    if (hour >= 5 && hour < 12) {
      return {
        greeting: `صباح الخير يا ${cleanName} ☀️`,
        salutation,
        subGreeting: isFemale
          ? 'طاب صباحكِ بكل نغمة جميلة وبداية يوم مليئة بالطاقة والحيوية'
          : 'طاب صباحك بكل نغمة جميلة وبداية يوم مليئة بالطاقة والحيوية',
        period: 'morning',
        icon: 'sun',
      };
    }

    // Afternoon: 12:00 to 16:59
    if (hour >= 12 && hour < 17) {
      return {
        greeting: `نهارك سعيد وموسيقي يا ${cleanName} 🌤️`,
        salutation,
        subGreeting: isFemale
          ? 'استمتعي بفترة بعد الظهيرة مع مختارات طربية تنعش يومكِ'
          : 'استمتع بفترة بعد الظهيرة مع مختارات طربية تنعش يومك',
        period: 'afternoon',
        icon: 'cloud-sun',
      };
    }

    // Evening: 17:00 to 23:59
    if (hour >= 17 && hour < 24) {
      return {
        greeting: `مساء الخير والطرب يا ${cleanName} 🌙`,
        salutation,
        subGreeting: isFemale
          ? 'مساء الروقان والاسترخاء مع أجمل المقاطع التي تناسب ذوقكِ الرفيع'
          : 'مساء الروقان والاسترخاء مع أجمل المقاطع التي تناسب ذوقك الرفيع',
        period: 'evening',
        icon: 'moon',
      };
    }

    // Late Night: 00:00 to 04:59
    return {
      greeting: `طابت ليلتك الهادئة يا ${cleanName} ✨`,
      salutation,
      subGreeting: isFemale
        ? 'سهرة طربية هادئة ومميزة ترافقكِ في سكون الليل'
        : 'سهرة طربية هادئة ومميزة ترافقك في سكون الليل',
      period: 'night',
      icon: 'sparkles',
    };
  }

  // English fallback
  const salutation = `Dear ${cleanName}`;
  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good Morning, ${cleanName}! ☀️`,
      salutation,
      subGreeting: 'Start your day with uplifting melodies and positive vibes',
      period: 'morning',
      icon: 'sun',
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good Afternoon, ${cleanName}! 🌤️`,
      salutation,
      subGreeting: 'Keep your momentum going with your personalized soundtrack',
      period: 'afternoon',
      icon: 'cloud-sun',
    };
  }

  if (hour >= 17 && hour < 24) {
    return {
      greeting: `Good Evening, ${cleanName}! 🌙`,
      salutation,
      subGreeting: 'Unwind and relax with handpicked tunes tailored for you',
      period: 'evening',
      icon: 'moon',
    };
  }

  return {
    greeting: `Peaceful Night, ${cleanName}! ✨`,
    salutation,
    subGreeting: 'Gentle, soothing tracks for late-night contemplation',
    period: 'night',
    icon: 'sparkles',
  };
}
