import admin from "firebase-admin";
import serviceAccountJson from "./firebase-admin/serviceAccountKey.json";
import { ServiceAccount } from "firebase-admin";

const serviceAccount = serviceAccountJson as ServiceAccount;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export default admin;