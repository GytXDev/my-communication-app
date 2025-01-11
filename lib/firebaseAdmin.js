// lib/firebaseAdmin.js

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Configuration Firebase Admin
const adminConfig = {
  credential: cert({
    projectId: "gytx-lumina-f5cbc",
    clientEmail: "firebase-adminsdk-zr5qc@gytx-lumina-f5cbc.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDaHMCVkktqgDD4\nihNlGhaD7yji+JTQCE8ajL5jy6E6DMIpgYDWelZbqnMDiNcY4V/wtTsKvhurgCEP\nko8Nj1Y1qEpl4I0JiloWOvsFDgTwS2ngDvo0aTJaQ56aI+bddJzCvustvzeCzzvB\njuigCSwQqkTPi2m6pSpx/7pAtBS5G0A0i2fbDStqz5dF8YR/yNuODpU2cMzQJZ0T\n6Mpf7YC5pxqaF1HxEGKy+NaxLnDgyB/cx3TprwewFaEOxnWmz1K2LuxCohd4T39h\n45jw3efy8vG5l4ZERGlbYVmrYyTMou1HwK0+GbdJKLOSC0+V6ziiyitClgLjV4Q2\nWv//EvoHAgMBAAECggEAVkx7DJMyQMTQ233yV5XfY7tcf5Wgd8FZ3yTh7eVzeN70\ncey6F+KWybUixbq+dKszxS9H2aPHme9b5Wf1LwXQM/HO4glbdHNn2pTinijiXltQ\nXGVArT0UPa+0kMN0xJmvrsRQlCys35Z0S8zqEOwgIcXk7QN5xW41YZ6vyIsYCfbZ\nzkBnM60zo3kwqBL7dmdhk/Prr2ghab14Gn5zFYVE8Z7WeixPjLo/GCfLp6YInLbk\nHrLXuW8KVNNQuhP/xF1QqlzUKAC8iY4y4NR5S0oZqKOLitAYGbaYWCGPux5P6fUS\nm1HrMbkutK1ChY+9WRinwamRe9urWNCQnxQMWmELAQKBgQDsu4lTwO3qRnU+jan2\nXPcQmgGRjFtLTtqtTyJEoiFc57CGjUkWpbznxYJgPWmqqDWfZ0qpEp3Eb1Q7HTJb\n48lm7D9IBp9d+pBtBHMo3g3tG+k//Qv3XCEwJy50+IsYdw8sAWgpNe23S4GOXzAD\n7GDEOCjLcL+aaGgOqe58ToaHBwKBgQDr3UB6eDuqHrZjEtL9Xv/HfqB23mpNjVQZ\nkH6xp57FYCURMbxmTHVhG18EbMWnwwFLCaetq/xoxl54SbQb5AQwKMvnGlJXX/49\n6t1nnref8jC2trMCgFm9M9glc2rXvFNntQqZ+2w2MUbbPsUsDVAPYzzQ6Q+pc5sb\n2aFkdqg1AQKBgQCKbiOgoTm+fBMFUCuqD7S9tYDjTpL4F5VSMOsV/UTLIgScubOa\nlbJAScOyaVcH3zL0Ep+a/HLbMkqsAqe3Ch10nQNoJ887UlDwHuEEbczw8RhVPbCo\npewWT2MgLVKRLNXnYq85Ifru6y1IRqs6MBhpxXk9daHlNdZbdM0rTXPnMwKBgFJn\ntaxUL3xLSKuqmv6c3z5i1ktRf9BijTx1SF5nUshgw/KS7uDK28O2nWbdXd0z+1Kt\nJ+E8km5EyCK8lWmdK31r83llr9kJF7moQfx+7ma6ZhygDkDUeQXqhBzpiy2ehYFZ\nNkAAIJl6c+gLsTWn3Q3TPR88HhW05z8+tO11q2UBAoGAB8GBnHkof1r9z3FDcEOv\ngtW76M72kt742c3h3Ey8e+5jGUcsh+8P6I2x6qtzCaXwiMgN9Jxr1PxVSnazfzkH\n4O4N7G78MgNyoZaa9WvnRki4UMyi5wxxWT2/1dN44XeGirusrrCj0AZ/R0zY/5te\nd19RdyYHya0QDbeJ/u8LI5o=\n-----END PRIVATE KEY-----\n",
  }),
};

// Initialiser Firebase Admin uniquement si ce n'est pas déjà fait
if (!getApps().length) {
  initializeApp(adminConfig);
}

const adminAuth = getAuth();

export { adminAuth };
