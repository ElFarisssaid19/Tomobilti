# Démonstration pour le jury (5 minutes)

Un parcours complet : un client réserve, l’agence confirme, remet la voiture et retrouve
la facture. Chaque étape montre une décision technique.

## Préparation (avant la soutenance)

1. Démarrer les services et l’application : `npm run services:up` puis `npm run dev`.
2. Données propres : `cd backend && php artisan migrate:fresh --seed` (dates relatives au
   jour même ; cela déconnecte tout le monde).
3. Ouvrir trois onglets :
   - **Client** : http://localhost:5173 (fenêtre privée, pour une session séparée) ;
   - **Agence** : http://localhost:5173/connexion dans une fenêtre normale ;
   - **Mailpit** : http://localhost:8025 (tous les e-mails envoyés).
4. Avoir l’écran en 1440 px de large ; garder un téléphone (ou l’émulation mobile du
   navigateur, 390 × 844) pour l’étape 2.

| Compte | E-mail | Mot de passe |
| --- | --- | --- |
| Client | `client@tomobilti.ma` (Salma Bennani, profil complet) | `Tomobilti2026!` |
| Agence | `admin@tomobilti.ma` | `Tomobilti2026!` |

> Comptes de démonstration uniquement : ils n’existent que dans les données de test.

## Déroulé

### 1. L’accueil et le catalogue (40 s)

**Faire** : sur l’accueil, choisir l’agence « Marrakech Aéroport Menara » et des dates
dans 3 semaines, puis « Rechercher ». Dans le catalogue, cliquer la catégorie « SUV »,
ouvrir le filtre « Automatique », trier par prix.

**Dire** :
- « Une application monopage React qui parle à une API Laravel en JSON. »
- « Les filtres sont dans l’URL : la recherche se partage et le bouton retour la
  restaure. Les voitures déjà réservées sur ces dates disparaissent : c’est le serveur
  qui calcule la disponibilité. »
- « Les listes de référence (catégories, agences, filtres) sont en cache côté serveur et
  vidées dès que l’agence modifie la flotte. »

### 2. La fiche voiture et le mobile (40 s)

**Faire** : ouvrir une voiture. Montrer la galerie (crédit de la photo sous l’image), le
calendrier des jours déjà réservés, le total estimé. Passer en vue téléphone 390 px.

**Dire** :
- « Les photos sont réelles, sous licence libre, recadrées et optimisées en WebP par une
  commande Artisan ; chaque crédit est affiché. »
- « Le site est pensé mobile d’abord : barre de navigation en bas, cibles tactiles de
  44 px, contrôlé avec axe-core (aucune violation sérieuse). »

### 3. La réservation (70 s)

**Faire** : « Réserver », se connecter avec le compte client : on revient sur la voiture
avec les dates. Parcourir les 4 étapes : dates et agences (choisir un retour à Casablanca
pour montrer les frais d’abandon de 300 DH), une option (siège bébé), « Vos
informations » (« Vous pouvez réserver »), le récapitulatif. Cocher les conditions, ouvrir
le lien « Lire les conditions » (nouvel onglet), puis « Confirmer la réservation ».

**Dire** :
- « Le prix vient toujours du serveur : la SPA envoie les choix, l’API renvoie le
  devis. »
- « L’éligibilité est vérifiée côté serveur : 21 ans et 2 ans de permis le jour de la
  prise en charge, e-mail vérifié, profil complet. »
- « Les conditions générales sont générées à partir des mêmes règles que l’API
  (`config/tomobilti.php`) : si l’âge minimum change, la page change. »
- « À la confirmation, une transaction verrouille la ligne de la voiture : deux clients
  qui réservent la même voiture en même temps ne peuvent pas obtenir tous les deux la
  réservation ; le second reçoit un 409 et des voitures similaires libres. Un double clic
  n’envoie qu’une requête. »

Montrer l’écran de confirmation avec la référence `TMB-…`, puis Mailpit : l’e-mail
« Demande reçue » au client et « Nouvelle demande » à l’agence.

### 4. Le back-office (70 s)

**Faire** : dans l’onglet agence, se connecter : le tableau de bord. Montrer les
indicateurs, la cloche (nouvelle demande), « Départs et retours ». Ouvrir
« Réservations » → onglet « À traiter » → la nouvelle demande. « Confirmer » (dialogue de
confirmation). Puis « Marquer comme récupérée », choisir « Espèces », « Payé maintenant ».

**Dire** :
- « Chaque changement de statut passe par un seul service, `ReservationWorkflow` : il
  verrouille la réservation, vérifie que la transition est permise (une machine à états)
  et écrit l’historique avec son auteur. »
- « Les boutons affichés dépendent du statut ; une action interdite répond 403 avec la
  raison. »
- « Le paiement se fait à l’agence : la remise des clés émet la facture dans la même
  transaction. »

Montrer l’historique des statuts en bas de la page, puis le planning (la barre de la
réservation dans la grille des voitures).

### 5. La facture et les e-mails (40 s)

**Faire** : ouvrir « Factures » : la nouvelle facture, payée, en espèces. Télécharger le
PDF. Dans Mailpit, ouvrir « Réservation confirmée » (bon de réservation en pièce jointe)
et « Votre facture » (facture PDF).

**Dire** :
- « Numéro séquentiel par année, HT et TVA 20 % calculés avec bcmath, montant en
  lettres, tous les montants au centime. »
- « Les e-mails passent par une file de jobs traitée par un worker, et ne partent
  qu’après la validation de la transaction : jamais d’e-mail pour une action annulée. »

### 6. Qualité et sécurité (20 s)

**Dire** :
- « 457 tests PHPUnit, 148 tests Vitest et 7 tests de bout en bout Playwright avec
  axe-core. »
- « En-têtes de sécurité sur chaque réponse, CSP stricte pour la SPA, limites de requêtes
  sur toutes les routes, cookies de session HttpOnly et SameSite, aucun secret dans le
  dépôt. »
- « Lighthouse : 100 en accessibilité, bonnes pratiques et SEO. »

## Questions probables

| Question | Réponse courte |
| --- | --- |
| Pourquoi des cookies et pas un JWT ? | Cookie `HttpOnly` illisible par un script (pas de vol par XSS), CSRF géré par Sanctum, révocation immédiate (on supprime la session). |
| Que se passe-t-il si deux clients réservent en même temps ? | `SELECT … FOR UPDATE` sur la voiture dans une transaction : le second voit la première réservation et reçoit 409. |
| Et si le prix change après la réservation ? | Les montants sont figés dans la réservation ; la facture reprend ces montants. |
| Pourquoi pas de paiement en ligne ? | Choix de l’agence : paiement et caution à la prise en charge ; la facture est émise à ce moment. |
| Comment sont protégées les données personnelles ? | Accès limité par les Policies (un client ne voit que ses réservations : 404 sinon), page de confidentialité (loi 09-08, CNDP), aucune donnée personnelle dans les logs. |
| Comment déployer ? | Voir `backend/.env.example` (section production) et [security.md](security.md) : `APP_DEBUG=false`, cookies sécurisés, worker de file, cron du planificateur, CSP sur le serveur web. |

## En cas de problème

- **Pas d’e-mail dans Mailpit** : le worker de file ne tourne pas (`npm run dev` le
  lance).
- **« Trop de requêtes »** : attendre une minute (limites de connexion).
- **Voiture indisponible** : choisir d’autres dates ; les réservations de démonstration
  sont réparties sur les semaines autour du jour du seed.
