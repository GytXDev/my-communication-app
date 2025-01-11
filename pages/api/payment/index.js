// pages/api/payment/index.js

import { adminAuth } from "@/lib/firebaseAdmin";

// Fonction pour générer une chaîne alphanumérique aléatoire
function generateRandomString(length = 6) {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Fonction pour vérifier le statut de la transaction avec un maximum de 5 tentatives
async function checkTransactionStatus(transactionId, headers) {
  const statusUrl = `${process.env.PAYMENT_STATUS_URL}${transactionId}`;
  console.log(`URL de vérification du statut: ${statusUrl}`);
  const maxAttempts = 5;
  const delay = 2000; // 2 secondes

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Tentative ${attempt + 1} de vérification du statut pour la transaction: ${transactionId}`);
    try {
      const statusResponse = await fetch(statusUrl, {
        method: "GET",
        headers: headers,
      });

      console.log(`Réponse de la requête de statut (${statusResponse.status}):`);
      const contentType = statusResponse.headers.get("content-type");
      console.log(`Content-Type: ${contentType}`);

      if (contentType && contentType.includes("text/html")) {
        const errorText = await statusResponse.text();
        console.log(`Réponse HTML reçue: ${errorText}`);
        return "Erreur de serveur lors de la vérification du statut.";
      }

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.log(`Erreur lors de la vérification du statut: ${errorText}`);
        return "Erreur lors de la vérification du statut.";
      }

      const statusResult = await statusResponse.json();
      console.log("Résultat de la vérification du statut:", statusResult);

      if (statusResult.status && statusResult.status.message) {
        const message = statusResult.status.message;
        console.log(`Message de statut reçu: ${message}`);
        if (isFinalStatus(message)) {
          console.log(`Statut final atteint: ${message}`);
          return message;
        }
      }

      // Attendre avant de réessayer
      console.log(`Attente de ${delay / 1000} secondes avant la prochaine tentative`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.log(`Erreur lors de la tentative ${attempt + 1}:`, error);
      return "Erreur lors de la vérification du statut.";
    }
  }

  console.log("Impossible d'obtenir le statut de la transaction après plusieurs tentatives.");
  return "Impossible d'obtenir le statut de la transaction après plusieurs tentatives.";
}

// Fonction pour déterminer si le statut est final
function isFinalStatus(message) {
  const finalStatuses = [
    "Transaction a ete effectue avec succes",
    "Your transaction has been successfully processed",
    "transaction a ete annulee avec succes",
  ];
  return finalStatuses.some((status) => message.includes(status));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    console.log("Méthode non autorisée:", req.method);
    return res.status(405).json({ status_message: "Méthode non autorisée." });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Authorization header manquant ou mal formaté.");
    return res.status(401).json({ status_message: "Non autorisé." });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Vérifier le token Firebase ID
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Utilisateur authentifié avec UID:", uid);

    const { numero, amount } = req.body;
    console.log("Requête reçue avec numero:", numero, "et amount:", amount);

    if (!numero || !amount) {
      console.log("Paramètres manquants");
      return res.status(400).json({ status_message: "Paramètres manquants." });
    }

    // Générer une référence unique de 6 caractères
    const reference = generateRandomString(6);
    console.log("Référence générée:", reference);

    // Préparer les données pour la requête de paiement
    const paymentData = {
      amount: amount,
      reference: reference,
      client_msisdn: numero,
      portefeuille: process.env.PAYMENT_PORTFOLIO,
      disbursement: process.env.PAYMENT_DISBURSEMENT,
      isTransfer: true,
    };
    console.log("Données de paiement:", paymentData);

    // Préparer les en-têtes
    const headers = {
      accept: "/",
      "x-client-id": process.env.PAYMENT_CLIENT_ID,
      "x-client-secret": process.env.PAYMENT_CLIENT_SECRET,
      "x-wallet": process.env.PAYMENT_WALLET,
      "Content-Type": "application/json",
    };
    console.log("En-têtes de paiement:", headers);

    // Effectuer la requête de paiement
    const paymentResponse = await fetch(process.env.PAYMENT_GATEWAY_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(paymentData),
    });

    console.log("Réponse de la requête de paiement:", paymentResponse.status);

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.log("Erreur lors du paiement:", errorText);
      return res
        .status(paymentResponse.status)
        .json({ status_message: `Erreur lors du paiement : ${errorText}` });
    }

    const paymentResult = await paymentResponse.json();
    console.log("Résultat du paiement:", paymentResult);

    if (!paymentResult.transaction || !paymentResult.transaction.reference) {
      console.log("Réponse de paiement invalide");
      return res.status(500).json({ status_message: "Réponse de paiement invalide." });
    }

    const transactionId = paymentResult.transaction.id;
    console.log("Transaction ID:", transactionId);

    // Vérifier le statut de la transaction
    const statusMessage = await checkTransactionStatus(transactionId, headers);
    console.log("Message de statut:", statusMessage);

    return res.status(200).json({ status_message: statusMessage });
  } catch (error) {
    console.error("Erreur dans l'API de paiement :", error);
    return res.status(500).json({ status_message: "Une erreur est survenue." });
  }
}
