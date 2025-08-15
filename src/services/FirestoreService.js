import { db } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
  orderBy,
  limit,
} from "firebase/firestore";
import * as components from "../game/components.js";

const BOTS_COLLECTION = "bots";

/**
 * Servizio per interagire con la collezione 'bots' su Firestore.
 */
class FirestoreService {
  /**
   * Crea un nuovo bot nel database.
   * @param {string} userId - L'ID dell'utente che crea il bot.
   * @param {object} botData - Dati iniziali del bot (es. { name, script, description }).
   * @returns {Promise<string>} L'ID del nuovo bot creato.
   */
  async createBot(userId, botData) {
    // Definiamo un "modello" completo per un nuovo bot.
    // Questo garantisce che tutti i campi esistano sempre.
    const botModel = {
      name: "Nuovo Bot", // Un nome di default
      description: "",
      script: "",
      visualModel: null, // Campo per il modello visuale
      multiplayerScript: "",
      version: 1,
      isMultiplayerEligible: false,
      // Calcola e salva il peso totale basato sui componenti standard.
      // In futuro, questo verrà calcolato in base ai componenti scelti dall'utente.
      totalWeight:
        components.standardArmor.weight +
        components.standardCannon.weight +
        components.standardBattery.weight +
        components.standardMotor.weight +
        components.standardRadar.weight,
      visibility: "private",
      componentIds: [],
      stats: {
        offline: { wins: 0, losses: 0, draws: 0, totalMatches: 0 },
        online: { wins: 0, losses: 0, draws: 0, totalMatches: 0 },
      },
    };

    const newBotData = {
      ...botModel, // Inizia con il modello completo
      ...botData, // Sovrascrivi con i dati forniti (es. name, script)
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, BOTS_COLLECTION), newBotData);
    return docRef.id;
  }

  /**
   * Recupera un singolo bot dal suo ID.
   * @param {string} botId - L'ID del bot da recuperare.
   * @returns {Promise<object|null>} I dati del bot o null se non trovato.
   */
  async getBot(botId) {
    const docRef = doc(db, BOTS_COLLECTION, botId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }

  /**
   * Recupera tutti i bot di un utente specifico.
   * @param {string} userId - L'ID dell'utente.
   * @returns {Promise<Array<object>>} Un array di oggetti bot.
   */
  async getUserBots(userId) {
    const q = query(collection(db, BOTS_COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const bots = [];
    querySnapshot.forEach((doc) => {
      bots.push({ id: doc.id, ...doc.data() });
    });
    return bots;
  }

  /**
   * Aggiorna un bot esistente.
   * @param {string} botId - L'ID del bot da aggiornare.
   * @param {object} updateData - I campi da aggiornare.
   * @returns {Promise<void>}
   */
  async updateBot(botId, updateData) {
    const docRef = doc(db, BOTS_COLLECTION, botId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      version: increment(1), // Incrementa la versione ad ogni aggiornamento
    });
  }

  /**
   * Elimina un bot.
   * @param {string} botId - L'ID del bot da eliminare.
   * @returns {Promise<void>}
   */
  async deleteBot(botId) {
    const docRef = doc(db, BOTS_COLLECTION, botId);
    await deleteDoc(docRef);
  }

  /**
   * Aggiorna le statistiche di un bot dopo una partita.
   * @param {string} botId - L'ID del bot.
   * @param {'win' | 'loss' | 'draw'} result - L'esito della partita.
   * @param {'online' | 'offline'} matchType - Il tipo di partita.
   * @returns {Promise<void>}
   */
  async updateBotStats(botId, result, matchType) {
    const docRef = doc(db, BOTS_COLLECTION, botId);
    const statField = `${result}s`; // 'wins', 'losses', 'draws'

    // Usiamo `increment` di Firestore per aggiornamenti atomici.
    const updatePayload = {
      [`stats.${matchType}.${statField}`]: increment(1),
      [`stats.${matchType}.totalMatches`]: increment(1),
      "stats.lastPlayedAt": serverTimestamp(),
    };

    await updateDoc(docRef, updatePayload);
  }

  /**
   * Trova un avversario adatto per il multiplayer.
   * @param {object} playerBot - Il bot del giocatore che cerca una partita.
   * @returns {Promise<object|null>} Un oggetto bot avversario o null se non trovato.
   */
  async findOpponent(playerBot) {
    const WEIGHT_TOLERANCE = 0.2; // 20% di tolleranza sul peso
    const minWeight = playerBot.totalWeight * (1 - WEIGHT_TOLERANCE);
    const maxWeight = playerBot.totalWeight * (1 + WEIGHT_TOLERANCE);

    const q = query(
      collection(db, BOTS_COLLECTION),
      where("isMultiplayerEligible", "==", true),
      where("totalWeight", ">=", minWeight),
      where("totalWeight", "<=", maxWeight)
    );

    const querySnapshot = await getDocs(q);
    const potentialOpponents = [];
    querySnapshot.forEach((doc) => {
      potentialOpponents.push({ id: doc.id, ...doc.data() });
    });

    // Filtra i bot del giocatore stesso
    const validOpponents = potentialOpponents.filter(
      (bot) => bot.userId !== playerBot.userId
    );

    if (validOpponents.length === 0) {
      return null; // Nessun avversario trovato
    }

    // Scegli un avversario casuale dalla lista dei candidati validi
    const randomIndex = Math.floor(Math.random() * validOpponents.length);
    return validOpponents[randomIndex];
  }

  /**
   * Recupera i bot per la classifica, ordinati per vittorie online.
   * @param {number} limitCount - Il numero di bot da recuperare.
   * @returns {Promise<Array<object>>} Un array di oggetti bot.
   */
  async getLeaderboard(limitCount = 20) {
    const q = query(
      collection(db, BOTS_COLLECTION),
      // Il filtro per visibilità è stato rimosso per mostrare tutti i bot.
      orderBy("stats.online.wins", "desc"), // Ordina per vittorie
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const bots = [];
    querySnapshot.forEach((doc) => {
      bots.push({ id: doc.id, ...doc.data() });
    });
    return bots;
  }
}

// Esporta una singola istanza del servizio (pattern Singleton)
export default new FirestoreService();