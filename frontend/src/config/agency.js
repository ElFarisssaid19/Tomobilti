/*
 * Public contact details of the agency (footer, contact page, "Pourquoi Tomobilti").
 * The pick-up points themselves (addresses, phones, hours) come from GET /api/locations.
 *
 * TO REPLACE before going live: the phone and WhatsApp number are the demo number of
 * the Casablanca Maârif agency, and the social profiles are the intended handles.
 */
export const AGENCY = {
  name: 'Tomobilti',
  email: 'contact@tomobilti.ma',
  phone: '+212522000104',
  phoneDisplay: '+212 5 22 00 01 04',
  whatsapp: '212522000104',
  address: '45, Boulevard Zerktouni, Maârif, 20330 Casablanca',
  social: {
    instagram: 'https://www.instagram.com/tomobilti.ma',
    facebook: 'https://www.facebook.com/tomobilti.ma',
  },
}

/** wa.me link, with an optional pre-filled message. */
export function whatsappUrl(text) {
  const base = `https://wa.me/${AGENCY.whatsapp}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/** Kept here for the existing imports; the formatter lives in utils/format.js. */
export { formatPhone } from '../utils/format.js'
