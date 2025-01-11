// /utils/dayjsConfig.js
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import "dayjs/locale/fr";

// Ajouter les plugins
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Configurer la langue et les options
dayjs.locale("fr");
dayjs.updateLocale("fr", {
    relativeTime: {
        future: "dans %s",
        past: "il y a %s",
        s: "quelques secondes",
        m: "une minute",
        mm: "%d minutes",
        h: "une heure",
        hh: "%d heures",
        d: "un jour",
        dd: "%d jours",
        M: "un mois",
        MM: "%d mois",
        y: "un an",
        yy: "%d ans",
    },
});

export default dayjs;
