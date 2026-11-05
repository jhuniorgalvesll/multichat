'use strict';

// Servicios disponibles. Las pestañas nuevas se llaman `tabName` (o `name`) + número.
// `popupHosts`: dominios cuyas ventanas emergentes (inicio de sesión, vincular cuentas) se abren
// dentro de la app con la misma sesión; cualquier otro enlace se abre en el navegador.
const META_HOSTS = ['facebook.com', 'instagram.com', 'meta.com', 'fbsbx.com'];

module.exports = {
  whatsapp: {
    name: 'WhatsApp',
    short: 'WA',
    url: 'https://web.whatsapp.com/',
    color: '#25D366',
  },
  telegram: {
    name: 'Telegram',
    short: 'TG',
    url: 'https://web.telegram.org/a/',
    color: '#2AABEE',
  },
  messenger: {
    name: 'Messenger',
    short: 'MSG',
    url: 'https://www.facebook.com/messages/',
    color: '#0866FF',
    popupHosts: META_HOSTS,
  },
  instagram: {
    name: 'Instagram',
    short: 'IG',
    url: 'https://www.instagram.com/direct/inbox/',
    color: '#E1306C',
    popupHosts: META_HOSTS,
  },
  metabusiness: {
    name: 'Meta Business Suite',
    tabName: 'Meta Business',
    short: 'MBS',
    url: 'https://business.facebook.com/latest/inbox/all',
    color: '#0081FB',
    popupHosts: META_HOSTS,
  },
  discord: {
    name: 'Discord',
    short: 'DC',
    url: 'https://discord.com/app',
    color: '#5865F2',
  },
  slack: {
    name: 'Slack',
    short: 'SL',
    url: 'https://app.slack.com/client',
    color: '#4A154B',
  },
};
