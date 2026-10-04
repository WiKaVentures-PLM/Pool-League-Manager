// Brand and opt-out language registered on our A2P 10DLC campaign with the mobile
// carriers. Every outbound SMS must carry both, in both the TwiML replies from
// twilio-webhook and the Twilio REST replies from process-sms-score, so that real
// traffic matches the sample messages filed in the campaign registration.
//
// If you change this wording, update the campaign registration in the Twilio console
// to match — mismatched samples are a rejection reason.
export const BRAND_PREFIX = 'Pool League Manager: ';
export const COMPLIANCE_SUFFIX = ' Reply STOP to opt out, HELP for help.';

export function brandMessage(body: string): string {
  return `${BRAND_PREFIX}${body}${COMPLIANCE_SUFFIX}`;
}
