# 🧪 Guide Complet des Tests d'Intégration

## 📋 Vue d'ensemble

Ce document décrit la suite complète de tests d'intégration pour le serveur MCP Taiga. Ces tests vérifient le bon fonctionnement de **48 outils MCP vitaux** à travers **89+ tests d'intégration**.

## 🎯 Objectifs des Tests

### Ce que les tests vérifient :

✅ **Messages de retour** : Indicateurs de succès (✅), messages d'erreur (❌), confirmations d'opération

✅ **Valeurs des champs** : Tous les champs de données (titre, description, dates, statut, assignation, etc.)

✅ **Relations** : Liens Sprint-Story, Story-Task, Epic-Story

✅ **Opérations groupées** : Création/mise à jour multiple d'items, assignations en masse

✅ **Gestion d'erreurs** : Entrées invalides, ressources manquantes, échecs de validation

## 📦 Structure des Tests

### 6 Suites de Tests | 89+ Tests | 48 Outils MCP

| Suite de Test | Tests | Outils | Description |
|---------------|-------|--------|-------------|
| **Project & Metadata** | 13 | 7 | Authentification, projets, découverte de métadonnées |
| **Epics** | 13 | 6 | CRUD Epics, liaison/déliaison avec stories |
| **Sprints/Milestones** | 17 | 9 | CRUD Sprints, statistiques, relations |
| **User Stories** | 17 | 10 | CRUD Stories, opérations groupées, assignation sprint |
| **Tasks** | 13 | 5 | CRUD Tasks, opérations groupées, liaison user story |
| **Search & Batch** | 16 | 5 | Recherche avancée, validation queries, opérations groupées |

## 🚀 Commandes Disponibles

### Lancer Tous les Tests d'Intégration

```bash
npm run test:integration:comprehensive
```

Cette commande exécute les 6 suites de tests séquentiellement avec un rapport détaillé.

### Lancer des Suites Individuelles

```bash
# Tests Project & Metadata (13 tests)
npm run test:integration:project

# Tests Epic (13 tests)
npm run test:integration:epic

# Tests Sprint/Milestone (17 tests)
npm run test:integration:sprint

# Tests User Story (17 tests)
npm run test:integration:userstory

# Tests Task (13 tests)
npm run test:integration:task

# Tests Search & Batch (16 tests)
npm run test:integration:search
```

## 🔐 Configuration Requise

### Variables d'Environnement

Les tests d'intégration nécessitent des identifiants Taiga valides :

```bash
export TAIGA_API_URL=https://api.taiga.io/api/v1
export TAIGA_USERNAME=votre_nom_utilisateur
export TAIGA_PASSWORD=votre_mot_de_passe
```

Ou créez un fichier `.env` :

```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=votre_nom_utilisateur
TAIGA_PASSWORD=votre_mot_de_passe
```

### Prérequis

- Compte Taiga valide (gratuit sur https://taiga.io)
- Au moins un projet accessible
- Droits d'écriture sur le projet (pour créer/modifier/supprimer des éléments)

## 📊 Détail des Suites de Tests

### 1️⃣ Project & Metadata (13 tests)

**Outils testés :**
- `authenticate` - Authentification utilisateur
- `listProjects` - Liste tous les projets
- `getProject` - Détails projet (par ID ou slug)
- `getProjectMetadata` - Métadonnées complètes en un appel
- `listProjectMembers` - Liste membres avec formats d'identification
- `getAvailableStatuses` - Options de statut (task/story/issue)
- `clearMetadataCache` - Nettoyage cache métadonnées

**Exemples de validation :**
```javascript
// Vérifie l'authentification
✓ Message de succès présent
✓ Nom d'utilisateur affiché
✓ Token stocké

// Vérifie les métadonnées projet
✓ ID projet résolu
✓ Slug projet résolu
✓ Noms de membres disponibles
✓ Emails disponibles
✓ Statuts par type d'entité
```

### 2️⃣ Epic (13 tests)

**Outils testés :**
- `createEpic` - Création epic avec sujet, description, couleur, tags
- `listEpics` - Liste tous les epics du projet
- `getEpic` - Détails epic (par ID ou référence)
- `updateEpic` - Mise à jour propriétés epic
- `linkStoryToEpic` - Lier user story à epic
- `unlinkStoryFromEpic` - Retirer user story d'epic

**Exemples de validation :**
```javascript
// Création d'epic
✓ Sujet: "[TEST] Integration Test Epic"
✓ Description: "This is a comprehensive test epic..."
✓ Couleur: "#FF5733"
✓ Tags: ["test", "integration"]
✓ ID epic retourné
✓ Référence #123 retournée

// Liaison story
✓ Message de succès
✓ Story visible dans l'epic
✓ Déliaison fonctionne
✓ Story retirée de l'epic
```

### 3️⃣ Sprint/Milestone (17 tests)

**Outils testés :**
- `createMilestone` - Création sprint avec dates
- `listMilestones` - Liste tous les sprints
- `getMilestoneStats` - Statistiques sprint
- `updateMilestone` - Mise à jour propriétés sprint
- `deleteMilestone` - Suppression sprint
- `getSprintComplete` - Détails complets sprint
- `getUserStoriesByMilestone` - Stories dans sprint
- `getIssuesByMilestone` - Issues dans sprint
- `listProjectMilestones` - Liste métadonnées milestones

**Exemples de validation :**
```javascript
// Création de sprint
✓ Nom: "[TEST] Integration Sprint 1732711234567"
✓ Date début: "2025-11-27"
✓ Date fin: "2025-12-11" (14 jours plus tard)
✓ ID sprint retourné

// Statistiques
✓ Taux de complétion: 0% (sprint vide)
✓ Stories points: affichés
✓ Stories dans sprint: listées
✓ Issues dans sprint: listées

// Mise à jour et suppression
✓ Nom mis à jour
✓ Dates mises à jour
✓ Suppression réussie
✓ Sprint non trouvable après suppression
```

### 4️⃣ User Story (17 tests)

**Outils testés :**
- `createUserStory` - Création story avec tous les champs
- `getUserStory` - Détails story (par ID ou référence)
- `listUserStories` - Liste toutes les stories
- `batchGetUserStories` - Récupération multiple stories
- `updateUserStory` - Mise à jour propriétés story
- `deleteUserStory` - Suppression story
- `addUserStoryToSprint` - Assignation story à sprint
- `batchCreateUserStories` - Création groupée (jusqu'à 20)
- `batchUpdateUserStories` - Mise à jour groupée
- `getTasksByUserStory` - Tâches pour une story

**Exemples de validation :**
```javascript
// Création story
✓ Sujet: "[TEST] Complete User Story"
✓ Description: "This is a comprehensive test..."
✓ Tags: ["test", "integration", "comprehensive"]
✓ ID et référence retournés

// Opérations groupées
✓ 3 stories créées en une fois
✓ Tous les sujets présents
✓ Tous les IDs retournés
✓ Mise à jour groupée de 3 stories
✓ Tags mis à jour: ["test", "batch-updated"]

// Relations
✓ Assignation à sprint réussie
✓ Sprint visible dans story
✓ Tâches liées listées
```

### 5️⃣ Task (13 tests)

**Outils testés :**
- `createTask` - Création tâche avec tous les champs
- `getTask` - Détails tâche (par ID ou référence)
- `updateTask` - Mise à jour propriétés (sujet, description, statut, assigné, date limite)
- `batchCreateTasks` - Création groupée tâches
- `batchUpdateTasks` - Mise à jour groupée tâches

**Exemples de validation :**
```javascript
// Création de tâche
✓ Sujet: "[TEST] Complete Task"
✓ Description: "This is a comprehensive test task..."
✓ Tags: ["test", "task", "comprehensive"]
✓ Date limite: "2025-12-04" (format YYYY-MM-DD)
✓ User Story: #123 (liaison visible)
✓ ID et référence retournés

// Mise à jour
✓ Sujet mis à jour: "[TEST] Updated Task"
✓ Description mise à jour
✓ Tags mis à jour: ["test", "updated"]
✓ Date limite mise à jour: "2025-12-11"
✓ Assigné à utilisateur
✓ Statut mis à jour

// Opérations groupées
✓ 3 tâches créées en une fois
✓ 3 tâches mises à jour en une fois
✓ Tous les champs vérifiés
```

### 6️⃣ Search & Batch (16 tests)

**Outils testés :**
- `advancedSearch` - Recherche avec syntaxe SQL-like
- `queryHelp` - Documentation syntaxe de requête
- `validateQuery` - Validation syntaxe avant exécution
- `batchAssign` - Assignation multiple d'items à utilisateur
- `batchUpdateDueDates` - Mise à jour dates limites en masse

**Exemples de validation :**
```javascript
// Aide et validation
✓ Aide syntaxe affichée
✓ Exemples fournis
✓ Requête valide acceptée: 'subject CONTAINS "test"'
✓ Requête invalide rejetée: 'invalid @@##'

// Recherche avancée
✓ Query simple: 'subject CONTAINS "[SEARCH-TEST]"'
✓ 3 stories trouvées
✓ Query complexe: 'subject CONTAINS "Alpha"'
✓ 1 seule story trouvée

// Opérations groupées
✓ 3 stories assignées à utilisateur
✓ 3 tâches avec dates limites mises à jour
✓ Format absolu: "2025-12-31"
✓ Format relatif: "+7d" (7 jours à partir d'aujourd'hui)
✓ Assignation groupée de 3 tâches
```

## 📈 Rapport de Test Type

### Exécution Réussie

```
╔════════════════════════════════════════════════════════════════════╗
║     Taiga MCP Server - Comprehensive Integration Test Suite       ║
╚════════════════════════════════════════════════════════════════════╝

📦 Testing all vital MCP tools across 6 categories
📊 Total expected tests: 89+
📅 Started: 27/11/2025 14:30:15

🔗 API: https://api.taiga.io/api/v1
👤 User: your_username

=======================================================================
🧪 Running: Project & Metadata
📋 Authentication, projects, metadata discovery, cache management
⏱️  Expected: 13 tests
=======================================================================

🧪 TC-PM-001: Authenticate user... ✅ PASS
   → Using project ID: 123456
🧪 TC-PM-002: List all projects... ✅ PASS
🧪 TC-PM-003: Get project by ID... ✅ PASS
...
✅ Project & Metadata completed successfully (5.23s)

[... autres suites ...]

╔════════════════════════════════════════════════════════════════════╗
║                  Integration Test Summary                          ║
╚════════════════════════════════════════════════════════════════════╝

📊 Test Suite Results:
──────────────────────────────────────────────────────────────────────
Suite                     | Status     | Duration   | Tests
──────────────────────────────────────────────────────────────────────
Project & Metadata        | ✅ PASS    | 5.23s      | 13 tests
Epics                     | ✅ PASS    | 8.45s      | 13 tests
Sprints/Milestones        | ✅ PASS    | 12.67s     | 17 tests
User Stories              | ✅ PASS    | 15.34s     | 17 tests
Tasks                     | ✅ PASS    | 10.12s     | 13 tests
Search & Batch            | ✅ PASS    | 11.89s     | 16 tests
──────────────────────────────────────────────────────────────────────

📈 Overall Statistics:
   ✅ Passed Suites: 6/6
   ❌ Failed Suites: 0/6
   📊 Total Tests: 89+
   ⏱️  Total Duration: 63.70s
   📈 Success Rate: 100.0%

📋 MCP Tool Coverage:
   ✓ Authentication Tools (1 tool)
   ✓ Project Management (2 tools)
   ✓ Sprint Management (9 tools)
   ✓ Epic Management (6 tools)
   ✓ User Story Management (10 tools)
   ✓ Task Management (5 tools)
   ✓ Metadata Discovery (5 tools)
   ✓ Advanced Search (3 tools)
   ✓ Batch Operations (7 tools)
   ─────────────────────────────
   📦 Total: 48 vital MCP tools tested

══════════════════════════════════════════════════════════════════════
🎉 ALL INTEGRATION TESTS PASSED! 🎉

   All vital MCP tools are functioning correctly.
   The Taiga MCP Server is ready for production use.
```

## 🧹 Nettoyage

Tous les tests effectuent un nettoyage automatique :

✅ Suppression des user stories créées (cascade vers les tâches)
✅ Suppression des sprints/milestones créés
✅ Ressources marquées avec préfixe `[TEST]` pour identification facile

Si les tests sont interrompus, nettoyage manuel possible :
1. Rechercher items avec préfixe `[TEST]`
2. Supprimer epics, stories, tasks de test manuellement depuis l'UI Taiga

## 🐛 Dépannage

### Test échoue - Credentials invalides

```
❌ Missing Taiga credentials
   Required: TAIGA_API_URL, TAIGA_USERNAME, TAIGA_PASSWORD
```

**Solution** : Vérifier que les variables d'environnement sont définies.

### Test échoue - Erreur 403

```
❌ Error: Request failed with status code 403
```

**Solution** : Vérifier que le nom d'utilisateur et mot de passe sont corrects.

### Test échoue - Projet non trouvé

```
❌ Should find at least one project
```

**Solution** : S'assurer que votre compte Taiga a accès à au moins un projet.

### Test échoue - Droits insuffisants

```
❌ Error: Permission denied
```

**Solution** : Vérifier que vous avez les droits d'écriture sur le projet (membre avec rôle approprié).

## 📝 Ajouter de Nouveaux Tests

Structure type d'un test :

```javascript
await this.test('TC-XXX-YYY: Description du test', async () => {
  // 1. Appeler l'outil MCP
  const result = await someTool.handler({ ...args });
  const text = this.parseToolResponse(result);

  // 2. Vérifier message de retour
  this.assert(text.includes('✅'), 'Should succeed');
  this.assert(text.includes('created'), 'Should show creation message');

  // 3. Vérifier valeurs des champs
  this.assert(text.includes('expected value'), 'Should return expected value');
  this.assert(text.includes('another field'), 'Should show another field');

  // 4. Extraire IDs pour nettoyage
  const id = this.extractIdFromResponse(text);
  this.createdIds.push(id);
});
```

## 🔗 Documentation Connexe

- [README Principal](README.md) - Vue d'ensemble du projet
- [CLAUDE.md](CLAUDE.md) - Guide de développement
- [Test Integration README](test/integration/README.md) - Documentation technique des tests
- [API Reference](docs/API-Reference.md) - Documentation des outils MCP

## 📊 Statistiques

- **Total Tests** : 89+
- **Couverture Outils** : 48 outils MCP vitaux
- **Catégories** : 6 suites de tests
- **Temps Exécution** : ~60-90 secondes (selon connexion API)
- **Taux de Succès Attendu** : 100%

---

**Version** : 1.0.0
**Date** : 2025-11-27
**Auteur** : Taiga MCP Server Team
