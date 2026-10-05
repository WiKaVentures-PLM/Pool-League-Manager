import { describe, expect, it } from 'vitest';
import {
  brandMessage,
  decideInboundAction,
  isHelp,
  isOptIn,
  isOptOut,
  normalizePhone,
  type ConsentStatus,
} from './sms';

describe('normalizePhone', () => {
  it('reduces any format to the last 10 digits', () => {
    // Twilio sends E.164; profiles.phone stores bare digits. These must agree
    // or the captain lookup in process-sms-score silently finds nobody.
    expect(normalizePhone('+13197210662')).toBe('3197210662');
    expect(normalizePhone('3197210662')).toBe('3197210662');
    expect(normalizePhone('(319) 721-0662')).toBe('3197210662');
    expect(normalizePhone('1-319-721-0662')).toBe('3197210662');
  });
});

describe('brandMessage', () => {
  it('wraps the body in the brand and opt-out language filed with the carriers', () => {
    expect(brandMessage('Scores submitted!')).toBe(
      'Pool League Manager: Scores submitted! Reply STOP to opt out, HELP for help.',
    );
  });

  it('keeps real messages inside one GSM-7 segment', () => {
    // Em dashes forced UCS-2 here once, which cuts the segment limit from 160
    // to 70 characters and doubled the cost of the most common replies.
    const longest = brandMessage(
      'Please send a photo of your scoresheet. No image was found in your message.',
    );
    expect(longest.length).toBeLessThanOrEqual(160);
    expect([...longest].every(c => c.charCodeAt(0) < 128)).toBe(true);
  });
});

describe('keyword predicates', () => {
  it('matches the keywords filed on the campaign registration', () => {
    expect(isOptOut('STOP')).toBe(true);
    expect(isOptOut('unsubscribe')).toBe(true);
    expect(isOptOut('Cancel.')).toBe(true);
    expect(isOptIn('YES')).toBe(true);
    expect(isOptIn('start')).toBe(true);
    expect(isOptIn('yes!')).toBe(true);
    expect(isHelp('HELP')).toBe(true);
    expect(isHelp('info')).toBe(true);
  });

  it('requires the whole message to be the keyword', () => {
    // A captain writing "stop by the bar later" must not be unsubscribed, and
    // "yes we won 7-5" must not count as consent.
    expect(isOptOut('stop by the bar later')).toBe(false);
    expect(isOptIn('yes we won 7-5')).toBe(false);
    expect(isHelp('helpful photo attached')).toBe(false);
  });

  it('treats an empty body (a bare MMS) as no keyword', () => {
    for (const body of ['', '   ', null, undefined]) {
      expect(isOptOut(body)).toBe(false);
      expect(isOptIn(body)).toBe(false);
      expect(isHelp(body)).toBe(false);
    }
  });
});

describe('decideInboundAction', () => {
  const cases: Array<[string | null, ConsentStatus, string, string]> = [
    ['STOP', 'granted', 'revoke-and-confirm', 'opt-out beats everything'],
    ['stop.', 'granted', 'revoke-and-confirm', 'case and trailing punctuation'],
    ['Unsubscribe', 'granted', 'revoke-and-confirm', 'mixed case opt-out'],
    ['HELP', 'granted', 'help-reply', 'help keyword'],
    ['info', 'revoked', 'help-reply', 'help answers even when revoked'],
    ['YES', 'pending', 'grant-and-release', 'consent granted on YES'],
    ['yes!', 'pending', 'grant-and-release', 'punctuation tolerated'],
    ['START', 'revoked', 'grant-and-release', 'opt-in revives a revoked number'],
    ['', 'granted', 'process', 'photo from a consented captain'],
    ['', 'pending', 'park-and-prompt', 'first contact is prompted'],
    ['', null, 'park-and-prompt', 'unknown number is prompted'],
    ['', 'revoked', 'ignore-silently', 'NEVER message an opted-out number'],
    ['here are the scores', 'revoked', 'ignore-silently', 'revoked stays silent'],
    ['here are the scores', 'granted', 'process', 'normal path'],
    ['STOPALL', null, 'revoke-and-confirm', 'opt-out from an unknown number'],
    ['stop by the bar later', 'granted', 'process', 'substring must not opt out'],
    ['yes we won 7-5', 'granted', 'process', 'substring must not opt in'],
    ['helpful photo attached', 'granted', 'process', 'substring must not trigger help'],
  ];

  it.each(cases)('body=%j consent=%s -> %s (%s)', (body, consent, expected) => {
    expect(decideInboundAction(body, consent)).toBe(expected);
  });

  it('never returns a reply-bearing action for a revoked number', () => {
    // The one rule that must not regress: an opted-out number may only ever be
    // answered if they themselves asked for HELP or to opt back in.
    const replying = ['process', 'park-and-prompt'];
    for (const body of ['', 'scores', 'anything at all', null]) {
      expect(replying).not.toContain(decideInboundAction(body, 'revoked'));
    }
  });
});
