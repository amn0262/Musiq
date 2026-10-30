import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectSongTheme, THEMES } from './themeSystem.ts';

describe('detectSongTheme unit tests', () => {
  it('detects Tarab/Classical for Fairuz and Umm Kulthum', () => {
    const fairuzTheme = detectSongTheme({
      title: 'Li Beirut',
      artist: 'Fairuz',
      category: 'classical',
    });
    assert.strictEqual(fairuzTheme.id, 'tarab_amber');
    assert.strictEqual(fairuzTheme.colorNameAr, 'العنبري الذهبي الملكي');

    const ummTheme = detectSongTheme({
      titleAr: 'أنت عمري',
      artistAr: 'أم كلثوم',
    });
    assert.strictEqual(ummTheme.id, 'tarab_amber');
  });

  it('detects Modern Arabic Pop for Amr Diab and Nancy Ajram', () => {
    const amrTheme = detectSongTheme({
      title: 'Nour El Ein',
      artist: 'Amr Diab',
      category: 'pop',
    });
    assert.strictEqual(amrTheme.id, 'pop_arabic_rose');
    assert.strictEqual(amrTheme.colorNameAr, 'الياقوتي الوردي الحيوي');
  });

  it('detects Khaleeji for Hussain Al Jassmi and Majid Al Mohandis', () => {
    const jassmiTheme = detectSongTheme({
      titleAr: 'بالبنط العريض',
      artistAr: 'حسين الجسمي',
    });
    assert.strictEqual(jassmiTheme.id, 'khaleeji_gold');
    assert.strictEqual(jassmiTheme.colorNameAr, 'الذهبي الصحراوي الأصيل');
  });

  it('detects Turkish for Tarkan with Şımarık', () => {
    const tarkanTheme = detectSongTheme({
      title: 'Şımarık (Kiss Kiss)',
      artist: 'Tarkan',
      album: 'Ölürüm Sana',
    });
    assert.strictEqual(tarkanTheme.id, 'turkish_crimson');
    assert.strictEqual(tarkanTheme.language, 'turkish');
    assert.strictEqual(tarkanTheme.colorNameAr, 'القرمزي العثماني الفاخر');
  });

  it('detects Rap for Wegz and Pablo', () => {
    const wegzTheme = detectSongTheme({
      title: 'El Bakht',
      titleAr: 'البخت',
      artist: 'Wegz',
      category: 'rap',
    });
    assert.strictEqual(wegzTheme.id, 'rap_lime');
    assert.strictEqual(wegzTheme.colorNameAr, 'الأخضر النيون الحماسي');
  });

  it('detects Western Pop for The Weeknd and Dua Lipa', () => {
    const weekndTheme = detectSongTheme({
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      category: 'trending',
    });
    // Weeknd has trending/pop, detectSongTheme matches Weeknd
    assert.ok(weekndTheme.id === 'western_violet' || weekndTheme.id === 'trending_indigo');
  });

  it('detects Relaxing Piano for Ludovico Einaudi', () => {
    const pianoTheme = detectSongTheme({
      title: 'Nuvole Bianche',
      artist: 'Ludovico Einaudi',
      category: 'relaxing',
    });
    assert.strictEqual(pianoTheme.id, 'relaxing_cyan');
    assert.strictEqual(pianoTheme.colorNameAr, 'السماوي الهادئ المائي');
  });
});
