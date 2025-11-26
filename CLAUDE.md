# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Overview

**Taiga MCP Server** is a highly modular Model Context Protocol server that provides a complete natural language interface for Taiga project management systems. The project uses modern Node.js ES module architecture, supporting both stdio and HTTP/JSON-RPC transport modes for maximum flexibility and enterprise-level project management features.

### Core Features
- **Dual Transport Modes** - Stdio (CLI/Claude Desktop) and HTTP/JSON-RPC (n8n integration)
- **Complete Sprint Management** - Create, track, analyze statistics with 9 comprehensive tools
- **Issue Lifecycle Management** - Issue and Sprint association tracking with fuzzy matching
- **Enhanced Batch Operations** - Bulk creation and updates (7 tools supporting up to 20 items)
- **Intelligent User Resolution** - Multi-format support (username, email, full name) with fuzzy matching
- **Metadata Discovery System** - Self-documenting API with 5-minute caching for optimal performance
- **Validation & Dry-Run Mode** - Pre-validate operations with detailed error messages and suggestions
- **Advanced Query Syntax** - SQL-like syntax for precise data search and filtering
- **Comment Collaboration System** - Complete team discussion and collaboration features
- **File Attachment Management** - Upload, download, and manage project file resources (Base64-based)
- **Epic Project Management** - Large-scale project epic-level feature organization and management
- **Wiki Knowledge Management** - Complete project documentation and knowledge base system
- **Modular Architecture** - 58 MCP tools across 13 functional categories
- **Professional Testing Framework** - 30 test files with unit, integration, MCP protocol, and specialized feature tests
- **AI-Assisted Development** - Demonstrates human-AI collaborative software development potential

## 📋 Common Commands

### Development and Running
```bash
# Production mode
npm start                    # Start MCP server (stdio mode for Claude Desktop)
npm start:http              # Start HTTP server (JSON-RPC mode for n8n integration)

# Development mode (with hot-reload)
npm run dev                 # Start stdio server with nodemon (auto-restart on changes)
npm run dev:http            # Start HTTP server with nodemon (auto-restart on changes)

# Testing
npm test                     # Run default test suite (unit + quick tests)
npm run test:unit           # Run unit tests (no external dependencies)
npm run test:quick          # Run quick functional tests
npm run test:http           # Run HTTP server tests (8 automated tests)
npm run test:watch          # Run tests in watch mode (auto-rerun on changes)
npm run test:dev            # Run dev tests in watch mode (unit + quick + http)
npm run test:basic          # Run MCP protocol tests (complex)
npm run test:integration    # Run Taiga API integration tests (requires credentials)
npm run test:full          # Run all test suites (30 test files)

# Specialized tests (require valid Taiga credentials)
npm run test:userstory      # Run user story integration tests (10 tests)
node test/batchTest.js     # Run batch operations specialized tests
node test/advancedQueryTest.js  # Run advanced query specialized tests
node test/commentTest.js      # Run comment system specialized tests
node test/attachmentTest.js   # Run file attachment specialized tests
node test/base64UploadTest.js # Run Base64 file upload specialized tests
node test/epicTest.js         # Run Epic management specialized tests
node test/wikiTest.js         # Run Wiki management specialized tests

# Utility scripts (for automation)
./scripts/start-server.sh   # Start HTTP server in background (with PID tracking)
./scripts/stop-server.sh    # Stop background HTTP server
./scripts/run-all-tests.sh  # Run complete test suite with formatted output
```

### Package Management and Publishing
```bash
# Manual publishing (not recommended)
npm publish                 # Publish to npm (requires version update)

# Automated publishing (recommended)
npm version patch           # Create new version and trigger auto-publish
git push origin main --tags # Push tags to trigger CI/CD auto-publish

# Using published packages
npx taiga-mcp-server                     # NPM Registry
npx @greddy7574/taiga-mcp-server        # GitHub Package Registry
```

### Docker Deployment
```bash
# Build image
docker build -t taiga-mcp-server .

# Run container (requires .env file)
docker run --rm -i --env-file .env taiga-mcp-server

# Using docker-compose
docker-compose up --build        # Production environment
docker-compose --profile dev up  # Development environment (includes tests)

# Cleanup
docker-compose down
docker system prune -f
```

### Wiki Documentation Sync
```bash
# Wiki push workflow (docs folder directly linked to Wiki repository)
cd docs                      # Enter docs folder
git status                   # Check modification status
git add .                    # Add all modified files
git commit -m "📚 Update Wiki documentation"  # Create commit
git push origin master       # Push to GitHub Wiki

# Wiki link format specification
# Correct: [[Display Text|Page Name]]
# Incorrect: [[Page Name|Display Text]]

# Important reminders:
# - docs folder is configured as Wiki repository (*.wiki.git)
# - Main project on main branch, Wiki on master branch
# - After modifying docs content, must manually push to Wiki
# - Wiki link format must be [[Display Text|Page Name]]
```

## ⚙️ Environment Configuration

### Taiga Credentials (Two Methods)

**Method 1: Environment Variables (Recommended for CI/CD and automation)**
```bash
export TAIGA_API_URL=https://api.taiga.io/api/v1
export TAIGA_USERNAME=your_username
export TAIGA_PASSWORD=your_password
```

**Method 2: .env File (Optional - for local development)**
```env
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```

**Note**: The application automatically uses environment variables if they are available. The `.env` file is only needed for local development if you prefer not to export variables manually.

### Claude Desktop Configuration

#### NPM Method (Recommended)
```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "npx",
      "args": ["taiga-mcp-server"],
      "env": {
        "TAIGA_API_URL": "https://api.taiga.io/api/v1",
        "TAIGA_USERNAME": "your_username", 
        "TAIGA_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Docker Method
```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "docker",
      "args": [
        "run", 
        "--rm", 
        "-i",
        "-e", "TAIGA_API_URL=https://api.taiga.io/api/v1",
        "-e", "TAIGA_USERNAME=your_username",
        "-e", "TAIGA_PASSWORD=your_password",
        "taiga-mcp-server:latest"
      ]
    }
  }
}
```

#### Docker Compose Method
```json
{
  "mcpServers": {
    "taiga-mcp": {
      "command": "docker-compose",
      "args": [
        "-f", "/path/to/taigaMcpServer/docker-compose.yml",
        "run", "--rm", "taiga-mcp-server"
      ],
      "cwd": "/path/to/taigaMcpServer"
    }
  }
}
```

### n8n Integration Configuration (HTTP/JSON-RPC Mode)

**NEW v1.9+**: The server supports HTTP/JSON-RPC transport for n8n workflow automation.

#### Running HTTP Server
```bash
npm start:http              # Starts on http://localhost:3000
# Or with Docker:
docker-compose up taiga-mcp-http
```

#### n8n HTTP Request Configuration
```json
{
  "method": "POST",
  "url": "http://localhost:3000/mcp",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "method": "tools/call",
    "params": {
      "name": "createTask",
      "arguments": {
        "projectIdentifier": "my-project",
        "userStoryRef": "#123",
        "subject": "New task",
        "description": "Task description"
      }
    }
  }
}
```

#### Available MCP Methods
- `initialize` - Initialize MCP connection
- `tools/list` - Get list of all available tools
- `tools/call` - Execute a specific tool

#### Health Check
```bash
curl http://localhost:3000/health
# Response: {"status":"ok","timestamp":"2025-11-24T..."}
```

**Features:**
- Automatic Zod → JSON Schema conversion for tool definitions
- Full MCP protocol compliance over HTTP
- Stateless request/response model
- Environment variables from .env file

## 🤖 Workflow de développement avec Claude

Cette section décrit comment Claude Code doit travailler sur ce projet de manière autonome et automatisée.

### Principes de base

1. **🚨 PRINCIPE CARDINAL - Ne JAMAIS modifier les tests pour qu'ils passent** :
   - Les tests révèlent les bugs dans le code - c'est leur rôle principal
   - ❌ **INTERDIT** : Ajuster un test qui échoue pour le faire passer
   - ✅ **OBLIGATOIRE** : Analyser pourquoi le test échoue et corriger le code
   - **Exceptions UNIQUEMENT** :
     - Le test lui-même contient un bug évident (mauvaise assertion, logique erronée)
     - L'utilisateur demande explicitement de travailler sur les tests
     - La documentation MCP est ambiguë et le test a été mal écrit à cause de ça (corriger doc + test)
   - **Workflow correct quand un test échoue** :
     1. Lire le code testé pour comprendre le comportement réel
     2. Analyser si le test expose un vrai bug ou si c'est le test qui est faux
     3. Si c'est un bug de code : corriger le code
     4. Si c'est un bug de doc MCP : corriger la doc + ajuster le test si nécessaire
     5. Si c'est un bug de test : justifier clairement pourquoi avant de modifier le test
   - **En cas de doute** : Toujours privilégier la correction du code plutôt que du test

2. **Automatisation maximale** : Claude lance lui-même les commandes (serveur, tests) sans demander à l'utilisateur

3. **Tests systématiques** : Après chaque modification significative, lancer les tests pertinents

4. **Feedback immédiat** : Rapporter les résultats des tests à l'utilisateur

5. **Documentation à jour** : Mettre à jour CLAUDE.md après chaque changement de workflow

### ⚡ Règles importantes pour les tests d'intégration

**IMPORTANT - À LIRE AVANT DE LANCER LES TESTS :**

1. **Variables d'environnement** : Les variables `TAIGA_API_URL`, `TAIGA_USERNAME`, et `TAIGA_PASSWORD` sont **déjà configurées** dans l'environnement d'exécution
   - ❌ NE PAS chercher ou créer de fichier `.env`
   - ❌ NE PAS vérifier si le fichier `.env` existe
   - ✅ Les tests utilisent directement les variables d'environnement système

2. **Dépendances npm** : Vérifier intelligemment avant d'installer
   - ✅ Vérifier si `node_modules/` existe : `[ -d node_modules ] && echo "exists" || npm install`
   - ❌ NE PAS lancer `npm install` systématiquement à chaque test
   - ✅ Lancer `npm install` UNIQUEMENT si les dépendances sont manquantes

3. **Lancement des tests** : Lancer directement sans vérifications inutiles
   - ✅ `npm run test:userstory` - Lance directement les tests
   - ✅ `npm run test:integration` - Lance les tests d'intégration complets
   - ❌ NE PAS faire de vérifications préalables sur l'authentification
   - ❌ NE PAS tester l'API avec curl avant de lancer les tests

**Workflow recommandé pour lancer les tests d'intégration :**

```bash
# Vérifier et installer les dépendances si nécessaire (une seule fois)
[ -d node_modules ] || npm install

# Lancer directement les tests
npm run test:userstory
```

**En cas d'erreur d'authentification (403) :**
- C'est un problème de credentials côté utilisateur
- Informer l'utilisateur que les identifiants Taiga sont incorrects
- NE PAS chercher à créer un fichier .env
- NE PAS proposer de solutions complexes

### Commandes essentielles pour Claude

#### Démarrage du développement
```bash
# 1. Vérifier l'environnement
npm install                  # Installer/vérifier les dépendances

# 2. Lancer les tests pour vérifier l'état initial
./scripts/run-all-tests.sh  # Suite complète (unit + quick + http)
# OU
npm test                     # Tests rapides seulement (unit + quick)
```

#### Développement avec hot-reload
```bash
# Stdio mode (Claude Desktop)
npm run dev                  # Auto-restart on file changes

# HTTP mode (n8n integration)
npm run dev:http            # Auto-restart on file changes
```

#### Tests en continu pendant le développement
```bash
# Option 1: Tests en mode watch (recommandé pour dev actif)
npm run test:watch          # Relance tous les tests à chaque changement

# Option 2: Tests dev en mode watch (plus rapide)
npm run test:dev            # Relance unit + quick + http à chaque changement

# Option 3: Tests manuels après modifications
npm test                    # Tests rapides
npm run test:http           # Tests HTTP seulement
./scripts/run-all-tests.sh  # Suite complète avec rapport détaillé
```

#### Gestion du serveur HTTP en arrière-plan

Pour les tests qui nécessitent un serveur HTTP actif :

```bash
# Démarrer le serveur
./scripts/start-server.sh   # Démarre en background, crée .http-server.pid
# Output:
# 🚀 Starting MCP HTTP Server...
# ✅ Server started successfully (PID: 12345)
# ✅ Health check passed

# Vérifier l'état du serveur
curl http://localhost:3000/health
# Output: {"status":"healthy","server":"Taiga MCP","version":"1.9.14",...}

# Tester un endpoint MCP
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Arrêter le serveur
./scripts/stop-server.sh    # Arrêt gracieux, nettoyage des fichiers PID
# Output:
# 🛑 Stopping server (PID: 12345)...
# ✅ Server stopped
# ✅ Cleanup complete
```

### Workflow type pour Claude

#### Scénario 1 : Modification de code existant

```bash
# 1. Comprendre le contexte
# - Lire les fichiers concernés
# - Vérifier CLAUDE.md pour les conventions

# 2. Faire les modifications
# - Éditer les fichiers nécessaires
# - Suivre les conventions du projet (ES modules, etc.)

# 3. Tester immédiatement
npm test                    # Tests rapides
# OU si modification touche HTTP
npm run test:http          # Tests HTTP spécifiques

# 4. Si tests échouent
# - Analyser les erreurs
# - Corriger le code
# - Relancer les tests

# 5. Si tests passent
./scripts/run-all-tests.sh # Validation complète avant commit
```

#### Scénario 2 : Ajout d'une nouvelle fonctionnalité

```bash
# 1. Planification
# - Identifier les fichiers à modifier/créer
# - Vérifier l'architecture dans CLAUDE.md

# 2. Implémentation
# - Créer/modifier les fichiers src/
# - Suivre le pattern modulaire existant

# 3. Tests unitaires
npm run test:unit          # Vérifier que les utilitaires fonctionnent

# 4. Tests d'intégration
npm run test:quick         # Vérifier l'intégration MCP
npm run test:http          # Si fonctionnalité HTTP

# 5. Validation finale
./scripts/run-all-tests.sh # Suite complète

# 6. Documentation
# - Mettre à jour CLAUDE.md si nécessaire
# - Ajouter des exemples dans les commentaires
```

#### Scénario 3 : Debugging d'un problème

```bash
# 1. Reproduire le problème
npm run dev:http           # Lancer en mode dev (avec logs)
# Observer les logs en temps réel

# 2. Tests ciblés
# Si problème HTTP:
npm run test:http
# Si problème de logique métier:
npm run test:unit

# 3. Logs détaillés du serveur
./scripts/start-server.sh  # Démarre en background
tail -f .http-server.log   # Suivre les logs en temps réel
# ... faire les tests manuels ...
./scripts/stop-server.sh   # Arrêter quand terminé

# 4. Fix et validation
# - Corriger le code
npm test                   # Vérification rapide
./scripts/run-all-tests.sh # Validation complète
```

#### Scénario 4 : Lancer les tests d'intégration (IMPORTANT)

```bash
# ⚡ WORKFLOW CORRECT pour les tests d'intégration

# 1. Vérifier les dépendances (UNIQUEMENT si nécessaire)
[ -d node_modules ] || npm install

# 2. Lancer directement les tests (sans vérifications inutiles)
npm run test:userstory     # Tests user story
# OU
npm run test:integration   # Tests d'intégration complets

# ❌ NE PAS FAIRE :
# - NE PAS chercher de fichier .env
# - NE PAS lancer npm install à chaque fois
# - NE PAS tester avec curl avant
# - NE PAS vérifier l'authentification manuellement

# ✅ À FAIRE :
# - Les variables d'environnement sont déjà disponibles
# - Lancer directement les tests
# - Si erreur 403 : informer que les credentials sont incorrects
```

**Exemple de conversation correcte :**
```
User: Peux-tu lancer le test d'intégration sur les userstories

Claude: Je lance les tests d'intégration des user stories.

[Lance directement: npm run test:userstory]

[Si succès] ✅ Tests passés avec succès
[Si erreur 403] ❌ Erreur d'authentification - vérifiez vos identifiants Taiga
```

### Commandes à NE PAS demander à l'utilisateur

Claude doit lancer ces commandes **automatiquement** sans confirmation :

✅ **Toujours lancer automatiquement :**
- `npm install` (UNIQUEMENT si node_modules n'existe pas : `[ -d node_modules ] || npm install`)
- `npm test` (après modifications de code)
- `npm run test:unit` (tests unitaires)
- `npm run test:quick` (tests rapides)
- `npm run test:http` (tests HTTP)
- `npm run test:userstory` (tests d'intégration user story)
- `npm run test:integration` (tests d'intégration complets)
- `./scripts/run-all-tests.sh` (validation complète)
- `./scripts/stop-server.sh` (nettoyage)

❌ **Demander confirmation avant :**
- `npm publish` (publication npm)
- `git push` (push vers remote)
- `npm version` (changement de version)
- Modifications de .env (contient des credentials)

⚠️ **Notes importantes :**
- NE PAS lancer `npm install` à chaque test - vérifier d'abord si `node_modules/` existe
- NE PAS créer ou chercher de fichier `.env` - les variables d'environnement sont déjà disponibles
- NE PAS faire de tests curl sur l'API Taiga avant de lancer les tests d'intégration

### Interprétation des résultats de tests

#### Succès complet
```bash
./scripts/run-all-tests.sh
# Output:
# ╔════════════════════════════════════════════════════════════╗
# ║                    Test Summary                            ║
# ╠════════════════════════════════════════════════════════════╣
# ║  ✅ Passed: 3                                              ║
# ║  ❌ Failed: 0                                              ║
# ╚════════════════════════════════════════════════════════════╝
# 🎉 All tests passed successfully!

# Action Claude : Informer l'utilisateur que tout est OK
# Message : "✅ Modifications terminées. Tous les tests passent (23 tests)."
```

#### Échec de tests - Application du PRINCIPE CARDINAL

**🚨 Rappel du principe** : JAMAIS modifier les tests pour qu'ils passent - toujours corriger le code.

**Exemple concret - Tests de tâches échouant à 70%** :

```bash
npm run test:task:comprehensive
# Output:
# ❌ FAIL: TC-TASK-004: Get task by ID
#    Error: Response doesn't contain internal ID
# ❌ FAIL: TC-TASK-008: Update task subject
#    Error: Updated subject not reflected in response
# ❌ FAIL: TC-TASK-025: Error - Invalid user story
#    Error: Should reject invalid user story ID
# Success Rate: 70.4% (19/27)

# ❌ MAUVAISE APPROCHE (INTERDITE) :
# Modifier les tests pour ne plus vérifier l'ID interne
# Modifier les assertions pour accepter des données incomplètes
# Skipper les tests qui échouent

# ✅ BONNE APPROCHE (OBLIGATOIRE) :
# 1. Analyser POURQUOI les tests échouent
#    - Lire le code des outils testés (src/tools/taskTools.js)
#    - Comprendre ce que le test attend vs ce que le code fait réellement
#    - Vérifier si la documentation MCP est claire ou ambiguë

# 2. Identifier la cause racine
#    Découvertes dans ce cas :
#    - createTask ne retournait pas l'ID interne (bug de code)
#    - updateTask ne refetch pas les données complètes après PATCH (bug de code)
#    - createTask ne validait pas l'existence de la user story (bug de code)
#    - Les descriptions MCP étaient ambiguës (bug de documentation)

# 3. Corriger le CODE, pas les tests
#    Corrections appliquées :
#    - Ajout de l'ID interne dans la réponse de createTask
#    - Refetch des données après PATCH dans updateTask
#    - Validation de la user story avant création de tâche
#    - Amélioration des descriptions MCP pour clarifier ID vs référence

# 4. Résultat après corrections
npm run test:task:comprehensive
# Output:
# Success Rate: 96.3% (26/27)
# ✅ Les bugs de code sont corrigés
# ✅ Les tests révélaient bien des vrais problèmes
# ✅ La documentation MCP est maintenant claire
```

**Cas particulier - Documentation MCP ambiguë** :

Quand un test échoue à cause d'une description MCP ambiguë :

1. **Corriger la documentation MCP** (descriptions des schémas Zod)
2. **Analyser si le test a été mal écrit à cause de cette ambiguïté**
3. **Si oui** : Ajuster le test pour refléter la doc corrigée (exception valide)
4. **Si non** : Le test est correct, c'est le code qui doit changer

**Exemple** : Dans `taskIdentifier`, la description disait "Task ID or reference number" sans préciser que les petits nombres sont ambigus. Les clients pouvaient créer des tests utilisant "363" pensant que c'est un ID, alors que c'était interprété comme référence. Solution : clarifier la doc + montrer aux tests comment utiliser correctement les IDs.

**En résumé** :
- ❌ Test échoue → Modifier le test pour qu'il passe
- ✅ Test échoue → Comprendre pourquoi → Corriger le code (et/ou la doc MCP si ambiguë)
- ✅ Toujours privilégier la correction du code sur la modification des tests

### Fichiers à surveiller

Quand ces fichiers changent, lancer les tests associés :

| Fichier modifié | Tests à lancer |
|----------------|----------------|
| `src/**/*.js` | `npm test` (au minimum) |
| `src/httpServer.js` | `npm run test:http` |
| `src/tools/**/*.js` | `npm run test:quick` |
| `src/utils.js`, `src/constants.js` | `npm run test:unit` |
| `test/**/*.js` | Le test modifié directement |
| `test/userStoryIntegrationTest.js` | `npm run test:userstory` |
| `package.json` | `[ -d node_modules ] \|\| npm install` puis `npm test` |
| `.env` | ⚠️ N'existe pas - utiliser les variables d'environnement |

**Note importante** : Le fichier `.env` n'existe pas dans cet environnement. Les credentials Taiga sont fournis via les variables d'environnement système (`TAIGA_API_URL`, `TAIGA_USERNAME`, `TAIGA_PASSWORD`).

### Structure des tests

- **test/unitTest.js** : 11 tests, ~200ms, aucune dépendance externe
- **test/quickTest.js** : 4 tests, ~300ms, création serveur MCP
- **test/httpServerTest.js** : 8 tests, ~5s, démarre/arrête serveur HTTP
- **scripts/run-all-tests.sh** : Lance les 3 suites ci-dessus (total: 23 tests)

### Exemple de session de développement complète

```bash
# 🎯 Mission : Ajouter un nouvel endpoint /status à httpServer.js

# 1. État initial
npm test                   # Vérifier que tout fonctionne
# ✅ 15 tests passed

# 2. Modifications
# - Lire src/httpServer.js
# - Ajouter le nouveau endpoint /status
# - Sauvegarder

# 3. Tests immédiats
npm run test:http         # Tester HTTP spécifiquement
# ❌ 1 test failed (nouveau endpoint pas testé)

# 4. Ajouter test
# - Lire test/httpServerTest.js
# - Ajouter test pour /status
# - Sauvegarder

# 5. Retester
npm run test:http
# ✅ 9 tests passed (8 anciens + 1 nouveau)

# 6. Validation complète
./scripts/run-all-tests.sh
# ✅ All tests passed!

# 7. Documentation
# - Mettre à jour CLAUDE.md si nécessaire
# - Ajouter commentaires dans le code

# 8. Rapport à l'utilisateur
# "✅ Nouvel endpoint /status ajouté avec succès.
#  - Code : src/httpServer.js:XXX
#  - Test : test/httpServerTest.js:YYY
#  - Tous les tests passent (24 tests)"
```

### Résumé : Checklist pour Claude

Avant de dire "c'est terminé" :

- [ ] 🚨 **PRINCIPE CARDINAL RESPECTÉ** : Si des tests échouent, j'ai corrigé le CODE (pas ajusté les tests)
- [ ] Le code compile sans erreur
- [ ] `npm test` passe (tests rapides)
- [ ] `npm run test:http` passe (si modif HTTP)
- [ ] `npm run test:userstory` passe (si modif user stories ou tests d'intégration)
- [ ] `./scripts/run-all-tests.sh` passe (validation complète)
- [ ] CLAUDE.md est à jour (si changement de workflow)
- [ ] Les commentaires dans le code sont clairs
- [ ] Aucun serveur ne reste en background (vérifier avec `./scripts/stop-server.sh`)

**Important pour les tests d'intégration :**
- ✅ Utiliser les variables d'environnement système (déjà configurées)
- ❌ NE PAS chercher ou créer de fichier `.env`
- ❌ NE PAS lancer `npm install` à chaque test (vérifier `node_modules/` d'abord)

## 🏗️ Architecture Structure

### Modular Design (v1.5.0+, Enhanced v1.9.14)
```
src/
├── index.js              # Stdio MCP server entry point (130 lines)
├── httpServer.js         # HTTP/JSON-RPC server for n8n (420 lines) [NEW v1.9+]
├── constants.js          # Unified constant management (200+ lines)
├── utils.js             # Enhanced utility library (800+ lines)
├── taigaAuth.js         # Authentication management
├── taigaService.js      # Comprehensive API service layer (1,594 lines)
├── userResolution.js    # Intelligent user resolution with fuzzy matching (272 lines) [NEW v1.9+]
├── metadataService.js   # Metadata discovery & 5-min caching (408 lines) [NEW v1.9+]
├── validation.js        # Validation & dry-run system (385 lines) [NEW v1.9+]
├── query/               # Advanced query system
│   ├── QueryParser.js   # SQL-like query syntax parser
│   ├── QueryExecutor.js # Query execution engine
│   └── queryGrammar.js  # Query syntax definitions
└── tools/               # MCP tool modules (13 categories, 58 tools)
    ├── index.js         # Tool registry center
    ├── authTools.js     # Authentication tools (1 tool)
    ├── projectTools.js  # Project management tools (2 tools)
    ├── sprintTools.js   # Sprint management tools (9 tools) [ENHANCED]
    ├── issueTools.js    # Issue management tools (6 tools)
    ├── userStoryTools.js # User story tools (6 tools)
    ├── taskTools.js     # Task management tools (3 tools)
    ├── batchTools.js    # Batch operation tools (7 tools) [ENHANCED - was 3]
    ├── advancedSearchTools.js # Advanced search tools (3 tools)
    ├── commentTools.js  # Comment system tools (4 tools)
    ├── attachmentTools.js # File attachment tools (4 tools)
    ├── epicTools.js     # Epic management tools (6 tools)
    ├── wikiTools.js     # Wiki management tools (6 tools)
    └── metadataTools.js # Metadata discovery tools (5 tools) [NEW v1.9+]
```

### MCP Tool Categories (58 tools)

#### 🔐 Authentication Tools (1 tool)
- `authenticate` - Taiga user authentication

#### 📁 Project Management (2 tools)
- `listProjects` - List user projects
- `getProject` - Get project details (supports ID and slug)

#### 🏃 Sprint Management (9 tools) - **Enhanced with Advanced Features**
- `listMilestones` - List project Sprints (milestones)
- `getMilestone` - Get single milestone by identifier (ID, name, or fuzzy match)
- `getMilestoneStats` - Sprint statistics (progress, completion rate)
- `createMilestone` - Create new Sprint
- `updateMilestone` - Update Sprint properties (name, dates, status)
- `deleteMilestone` - Delete Sprint (with safety checks)
- `getIssuesByMilestone` - Get all issues in a Sprint
- `getUserStoriesByMilestone` - Get all user stories in a Sprint
- `findSprint` - User-friendly Sprint search with fuzzy matching

#### 🐛 Issue Management (6 tools)
- `listIssues` - List project issues (with Sprint information)
- `getIssue` - Issue details (including Sprint assignment)
- `createIssue` - Create issues (supports status, priority, etc.)
- `updateIssueStatus` - Update issue status
- `addIssueToSprint` - Add/remove issues to/from sprints
- `assignIssue` - Assign/unassign issues to team members

#### 📝 User Story Management (6 tools)
- `listUserStories` - List project user stories
- `createUserStory` - Create user stories
- `getUserStory` - Get user story details
- `updateUserStory` - Update user story properties
- `deleteUserStory` - Delete user stories
- `addUserStoryToSprint` - Add/remove user stories to/from sprints

#### ✅ Task Management (3 tools)
- `createTask` - Create tasks (linked to user stories)
- `getTask` - Get task details (supports ID and reference number)
- `updateTask` - Update task properties (subject, description, status, assignee, tags)

#### 🚀 Batch Operations (7 tools) - **Enhanced with Update Operations**
- `batchCreateIssues` - Bulk create Issues (up to 20 items)
- `batchCreateUserStories` - Bulk create user stories
- `batchCreateTasks` - Bulk create tasks (linked to specific Story)
- `batchUpdateTasks` - Update multiple tasks at once (status, assignee, due dates)
- `batchUpdateUserStories` - Bulk update user stories (supports epic, dueDate, status)
- `batchAssign` - Assign multiple items (tasks/stories/issues) to a user
- `batchUpdateDueDates` - Set due dates with flexible formats (relative/absolute/sprint-end)

#### 🔍 Advanced Search (3 tools) - **New Feature**
- `advancedSearch` - Advanced query syntax search (SQL-like syntax)
- `queryHelp` - Query syntax help and examples
- `validateQuery` - Query syntax validation tool

#### 💬 Comment System (4 tools) - **Collaboration Enhancement**
- `addComment` - Add comments to Issues/Stories/Tasks
- `listComments` - View complete project comment history
- `editComment` - Edit published comment content
- `deleteComment` - Delete unwanted comments

#### 📎 File Attachments (4 tools) - **Resource Management (Base64-based)**
- `uploadAttachment` - Upload file attachments to Issues/Stories/Tasks (Base64 encoded)
- `listAttachments` - View all attachments for project work items
- `downloadAttachment` - Download specified file attachments
- `deleteAttachment` - Delete unwanted file attachments

**Important Update (v1.9.8+)**: File upload has been changed to Base64 encoding mode, solving MCP protocol file path limitation issues. See `FILE_UPLOAD_GUIDE.md` for migration guide.

#### 🏛️ Epic Management (6 tools) - **Enterprise-level Project Organization**
- `createEpic` - Create large-scale project epic-level features
- `listEpics` - List all Epics in a project
- `getEpic` - Get Epic detailed information and progress statistics
- `updateEpic` - Update Epic information and status
- `linkStoryToEpic` - Link user stories to Epics
- `unlinkStoryFromEpic` - Remove user story associations from Epics

#### 📖 Wiki Management (6 tools) - **Knowledge Base and Documentation Center**
- `createWikiPage` - Create project Wiki pages with Markdown support
- `listWikiPages` - List all Wiki pages in a project
- `getWikiPage` - Get Wiki page details by ID or slug
- `updateWikiPage` - Update Wiki page content and settings
- `deleteWikiPage` - Delete Wiki pages (irreversible operation)
- `watchWikiPage` - Watch/unwatch Wiki page change notifications

#### 🔍 Metadata Discovery (5 tools) - **NEW v1.9+ - Self-Documenting API**
- `getProjectMetadata` - Get complete project metadata in one call (with 5-min caching)
- `listProjectMembers` - List all members with all identifier formats (username, email, full name)
- `getAvailableStatuses` - Get available statuses by entity type (task, story, issue)
- `listProjectMilestones` - List all sprints/milestones for reference
- `clearMetadataCache` - Clear cached metadata (force refresh)

**Key Features:**
- Automatic 5-minute TTL caching for optimal performance
- Parallel metadata fetching reduces latency
- Enables validation and dry-run modes
- Essential for understanding available options before operations

### Testing Architecture (30 test files)
```
test/
├── README.md           # Comprehensive testing documentation
├── runTests.js        # Orchestrates all test suites
│
├── Core Test Suites (4 levels)
│   ├── unitTest.js              # 11 tests, no external dependencies (100% pass)
│   ├── quickTest.js             # 4 tests, MCP server creation
│   ├── mcpTest.js               # 8 tests, protocol compliance
│   └── integration.js           # Real Taiga API tests (requires credentials)
│
├── Feature-Specific Tests (9 specialized suites)
│   ├── batchTest.js             # Batch operations (9 tests, 100% pass)
│   ├── advancedQueryTest.js     # Query syntax (11 tests, 100% pass)
│   ├── commentTest.js           # Comment system (10 tests, 100% pass)
│   ├── attachmentTest.js        # Attachments (10 tests, 100% pass)
│   ├── base64UploadTest.js      # Base64 file uploads
│   ├── epicTest.js              # Epic management (10 tests, 100% pass)
│   ├── wikiTest.js              # Wiki functionality
│   ├── sprintUpdateDeleteTest.js # Sprint CRUD operations
│   └── milestoneIdentifierTest.js # Milestone resolution
│
└── Debug/Development Tests (17 additional files)
    └── debugCommentTest.js, commentHistoryTest.js, etc.
```

## 🔧 Development Guidelines

### Core Design Principles
1. **Modular First** - Each feature as independent module for easy maintenance
2. **Unified Error Handling** - All API calls use unified error handling pattern
3. **Standardized Response Format** - Use `createSuccessResponse` and `createErrorResponse`
4. **Flexible Project Identifiers** - Support both numeric IDs and string slugs

### ES Module Standards
- All imports must include `.js` extension
- Use `export`/`import` syntax
- Support dynamic imports

### Data Processing Patterns
```javascript
// Project resolution example
const project = await resolveProject(projectIdentifier);

// Response formatting example  
return createSuccessResponse(`✅ ${SUCCESS_MESSAGES.ISSUE_CREATED}`);

// Error handling example
return createErrorResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND);
```

### Common Utility Functions

#### Core Utilities (utils.js)
- `resolveProject()` - Smart project resolution (ID/slug/name)
- `resolveMilestone()` - Sprint resolution with fuzzy matching
- `findSprint()` - User-friendly sprint search wrapper
- `formatDate()` - Unified date formatting
- `calculateCompletionPercentage()` - Completion percentage calculation
- `createSuccessResponse()` / `createErrorResponse()` - Response formatting
- `levenshteinDistance()` - String similarity calculation for fuzzy matching

#### User Resolution System (userResolution.js) - **NEW v1.9+**
- `resolveUser()` - Intelligent multi-format user resolution
  - Supports: username, email, full name (exact + fuzzy), user ID
  - Configurable similarity threshold (default: 70%)
  - Detailed error messages with all available users
- `resolveUserBatch()` - Batch user resolution for performance

#### Metadata Service (metadataService.js) - **NEW v1.9+**
- `getProjectMetadata()` - Complete metadata in one call
- `getProjectMembers()` - All members with caching
- `getAvailableStatuses()` - Status lists by entity type
- `getProjectMilestones()` - Sprint/milestone catalog
- `clearMetadataCache()` - Force cache refresh
- **5-minute TTL caching** for optimal performance

#### Validation System (validation.js) - **NEW v1.9+**
- `validateTask()` - Pre-validate task data before API calls
- `validateUserStory()` - Validate story data with field resolution
- `validateIssue()` - Validate issue data
- `validateWithDryRun()` - Preview resolved data without creating
- Returns: `{ isValid, errors, warnings, suggestions, resolvedData }`

## 📊 Code Quality Metrics

### Modularization Level
- **Total Source Lines**: ~9,600 lines across all src/ files
- **Main File Reduction**: 800+ lines → 130 lines (83% reduction)
- **Feature Separation**: 13 independent tool modules (58 total tools)
- **Test Coverage**: 30 test files across 4 testing levels
- **Documentation**: Complete API, architecture docs, and IMPROVEMENTS.md
- **Transport Modes**: Dual support (stdio + HTTP/JSON-RPC)

### Development Workflow
1. **Quick Validation**: `npm test` (unit + quick tests)
2. **Feature Development**: Modify corresponding tool modules
3. **Complete Testing**: `npm run test:full`
4. **Automated Publishing**: `npm version patch && git push origin main --tags`

### CI/CD Automation Pipeline 🚀
The project is configured with complete GitHub Actions automated publishing workflow:

**Trigger Condition**: Push `v*` tags
```bash
npm version patch              # Automatically create new version tag
git push origin main --tags    # Push to trigger CI/CD
```

**Automation Flow**:
1. **🧪 Testing Phase** - Run unit tests and quick tests
2. **📦 Parallel Publishing**:
   - NPM Registry: `taiga-mcp-server`
   - GitHub Packages: `@greddy7574/taiga-mcp-server`
3. **🎉 Release Creation** - Auto-generate changelog and release notes

**Configuration Requirements**:
- GitHub Repository Secret: `NPM_TOKEN` (npm automation token)
- Permissions: `contents: write`, `packages: write`

**Complete Flow Duration**: ~45 seconds (Testing→Publishing→Release)

## 🎯 Common Development Tasks

### Adding New Tools
1. Create tool file in `src/tools/`
2. Register tool in `src/tools/index.js`
3. Add related constants in `src/constants.js`
4. Add corresponding test cases

### Modifying API Responses
1. Check API calls in `src/taigaService.js`
2. Use formatting functions from `src/utils.js`
3. Ensure error handling consistency

### Debugging Issues
1. Run `npm run test:unit` to verify core logic
2. Run `npm run test:quick` to verify MCP functionality
3. Check `.env` file configuration
4. See `test/README.md` for testing strategy

## 🚀 Project Development History

### Version History
- **v1.0.0**: Basic MCP functionality
- **v1.3.0**: Added constants and utils modules
- **v1.4.0**: Enhanced constant management, unified naming
- **v1.5.0**: Complete modular architecture
- **v1.5.1**: Cleanup and testing framework
- **v1.5.2**: Git history cleanup, complete npm publishing
- **v1.5.3**: CI/CD foundation framework
- **v1.5.4**: CI/CD workflow fixes
- **v1.5.5**: Dual publishing support (NPM+GPR)
- **v1.5.6**: Fully automated Release creation
- **v1.6.0**: Docker containerization deployment and batch operations
- **v1.6.1**: Advanced query syntax system
- **v1.7.0**: Comment system collaboration enhancement
- **v1.8.0**: Epic management enterprise features
- **v1.9.8**: Base64 file upload architecture refactor, solving MCP protocol file handling limitations
- **v1.9.14**: Current version with all features integrated

### AI-Assisted Development Features
This project demonstrates the powerful potential of human-AI collaborative development:
- **Architecture Design**: AI-assisted modular design
- **Code Refactoring**: Complete refactoring from single file to modular architecture
- **Testing Framework**: Multi-level testing strategy design
- **Documentation Excellence**: Professional-grade documentation and guides

This project is a successful case study of "inspired by" open source development, showing how to achieve significant innovation and improvement while maintaining legal compliance.

## 🆕 Recent Major Improvements (v1.9.x)

**See `IMPROVEMENTS.md` for comprehensive details on recent enhancements.**

### Key Problems Solved
1. **User Assignment Issues** → Intelligent multi-format user resolution with fuzzy matching
2. **Generic Error Messages** → Field-specific errors with context and suggestions
3. **Batch Operation Performance** → 4 new batch update tools for efficient bulk operations
4. **Identifier Resolution Confusion** → Enhanced fuzzy matching for all identifiers
5. **Metadata Discovery** → 5 new tools with automatic caching (5-min TTL)
6. **Inconsistent API Responses** → Comprehensive validation system with dry-run mode

### New Capabilities Added
- **userResolution.js** (272 lines) - Multi-format user resolution (username, email, full name, ID)
- **metadataService.js** (408 lines) - Complete metadata discovery with caching
- **validation.js** (385 lines) - Pre-validation system with detailed feedback
- **httpServer.js** (420 lines) - HTTP/JSON-RPC transport for n8n integration
- **7 Batch Operation Tools** - Including batchUpdateTasks, batchUpdateUserStories, batchAssign, batchUpdateDueDates
- **9 Sprint Management Tools** - Enhanced with findSprint, updateMilestone, deleteMilestone
- **5 Metadata Discovery Tools** - getProjectMetadata, listProjectMembers, getAvailableStatuses, etc.

### Backward Compatibility
All improvements are **fully backward compatible**. Existing tools continue to work unchanged while benefiting from enhanced error handling and validation.

## 📚 Extended Documentation

**Complete technical documentation and user guides are available on the project Wiki:**
👉 **https://github.com/greddy7574/taigaMcpServer/wiki**

### Wiki Highlight Features
- 🔍 **Full-text Search** - Quickly find specific content
- 📱 **Mobile Optimized** - Better mobile device experience  
- 🔗 **Smart Navigation** - Quick jumps between pages
- 📖 **Online Editing** - Collaborative document editing
- 📊 **Rich Media Support** - Charts, tables, code highlighting

### Recommended Reading Order
1. [Installation Guide](https://github.com/greddy7574/taigaMcpServer/wiki/Installation-Guide) - Essential for new users
2. [API Reference](https://github.com/greddy7574/taigaMcpServer/wiki/API-Reference) - Complete API documentation
3. [CICD Automation](https://github.com/greddy7574/taigaMcpServer/wiki/CICD-Automation) - Automated publishing workflow

## 🔌 Taiga API Reference

This section documents the Taiga REST API as used by this MCP server. The implementation in this project demonstrates best practices for working with Taiga's API.

### API Base Configuration

```javascript
// Default Taiga API URL (can be self-hosted)
TAIGA_API_URL=https://api.taiga.io/api/v1

// Authentication (used for all requests)
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
```

### Authentication

**Endpoint**: `/auth` (handled by `taigaAuth.js`)

**Method**: POST

**Request**:
```json
{
  "type": "normal",
  "username": "your_username",
  "password": "your_password"
}
```

**Response**:
```json
{
  "auth_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "id": 123,
  "username": "your_username",
  "full_name": "Your Name",
  "email": "your@email.com"
}
```

**Implementation Pattern**:
- Auth token is cached for the session
- Token is included in all subsequent requests via `Authorization: Bearer {token}` header
- Automatic re-authentication on token expiration

### Core API Endpoints

#### Projects API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/projects` | GET | List user's projects | ✅ Yes |
| `/projects/{id}` | GET | Get project details | ❌ No |
| `/projects` | POST | Create project | ❌ No |

**Query Parameters**:
- `member={userId}` - Filter projects by member
- `page={n}` - Page number (1-indexed)
- `page_size={n}` - Items per page (default: 30, max: 100)

**Project Object Structure**:
```json
{
  "id": 123,
  "slug": "project-slug",
  "name": "Project Name",
  "description": "Project description",
  "created_date": "2025-01-01T00:00:00Z",
  "modified_date": "2025-01-15T00:00:00Z",
  "owner": {...},
  "members": [...],
  "is_private": true,
  "total_milestones": 5,
  "total_story_points": 100.0
}
```

#### User Stories API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/userstories` | GET | List user stories | ✅ Yes |
| `/userstories/{id}` | GET | Get story details | ❌ No |
| `/userstories` | POST | Create user story | ❌ No |
| `/userstories/{id}` | PATCH | Update user story | ❌ No |
| `/userstories/{id}` | DELETE | Delete user story | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project (required for list)
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status
- `assigned_to={userId}` - Filter by assignee

**User Story Object**:
```json
{
  "id": 456,
  "ref": 123,
  "subject": "Story title",
  "description": "Story description",
  "project": 123,
  "milestone": 789,
  "status": 1,
  "assigned_to": 456,
  "assigned_to_extra_info": {
    "username": "john.doe",
    "full_name_display": "John Doe"
  },
  "tags": ["frontend", "api"],
  "is_closed": false,
  "total_points": 5.0,
  "epic": 111
}
```

#### Tasks API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/tasks` | GET | List tasks | ✅ Yes |
| `/tasks/{id}` | GET | Get task details | ❌ No |
| `/tasks` | POST | Create task | ❌ No |
| `/tasks/{id}` | PATCH | Update task | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project
- `user_story={storyId}` - Filter by user story
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status

**Task Object**:
```json
{
  "id": 789,
  "ref": 45,
  "subject": "Task title",
  "description": "Task description",
  "project": 123,
  "user_story": 456,
  "milestone": 789,
  "status": 1,
  "assigned_to": 456,
  "assigned_to_extra_info": {
    "username": "john.doe",
    "full_name_display": "John Doe"
  },
  "tags": ["bug", "urgent"],
  "is_closed": false,
  "due_date": "2025-12-31"
}
```

#### Issues API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/issues` | GET | List issues | ✅ Yes |
| `/issues/{id}` | GET | Get issue details | ❌ No |
| `/issues` | POST | Create issue | ❌ No |
| `/issues/{id}` | PATCH | Update issue | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project
- `milestone={milestoneId}` - Filter by sprint
- `status={statusId}` - Filter by status
- `type={typeId}` - Filter by issue type
- `severity={severityId}` - Filter by severity
- `priority={priorityId}` - Filter by priority

**Issue Object**:
```json
{
  "id": 321,
  "ref": 67,
  "subject": "Issue title",
  "description": "Issue description",
  "project": 123,
  "milestone": 789,
  "status": 1,
  "type": 1,
  "severity": 2,
  "priority": 3,
  "assigned_to": 456,
  "tags": ["backend", "database"],
  "is_closed": false
}
```

#### Milestones/Sprints API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/milestones` | GET | List milestones | ✅ Yes |
| `/milestones/{id}` | GET | Get milestone details | ❌ No |
| `/milestones` | POST | Create milestone | ❌ No |
| `/milestones/{id}` | PATCH | Update milestone | ❌ No |
| `/milestones/{id}` | DELETE | Delete milestone | ❌ No |

**Query Parameters**:
- `project={projectId}` - Filter by project (required)
- `closed={true|false}` - Filter by open/closed status

**Milestone Object**:
```json
{
  "id": 789,
  "name": "Sprint 1",
  "slug": "sprint-1",
  "project": 123,
  "estimated_start": "2025-01-01",
  "estimated_finish": "2025-01-14",
  "closed": false,
  "disponibility": 0.0,
  "total_points": 25.0,
  "closed_points": 10.0,
  "user_stories": [456, 457, 458]
}
```

#### Epics API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/epics` | GET | List epics | ✅ Yes |
| `/epics/{id}` | GET | Get epic details | ❌ No |
| `/epics` | POST | Create epic | ❌ No |
| `/epics/{id}` | PATCH | Update epic | ❌ No |
| `/epics/{id}/related_userstories` | GET | Get epic's stories | ✅ Yes |

**Epic Object**:
```json
{
  "id": 111,
  "ref": 5,
  "subject": "Epic title",
  "description": "Epic description",
  "project": 123,
  "status": 1,
  "epics_order": 1,
  "color": "#FF0000",
  "tags": ["feature"],
  "user_stories": [456, 457]
}
```

#### Wiki API

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/wiki` | GET | List wiki pages | ✅ Yes |
| `/wiki/{id}` | GET | Get wiki page | ❌ No |
| `/wiki` | POST | Create wiki page | ❌ No |
| `/wiki/{id}` | PATCH | Update wiki page | ❌ No |
| `/wiki/{id}` | DELETE | Delete wiki page | ❌ No |

**Wiki Page Object**:
```json
{
  "id": 999,
  "slug": "home",
  "content": "# Wiki content in Markdown",
  "project": 123,
  "owner": 456,
  "created_date": "2025-01-01T00:00:00Z",
  "modified_date": "2025-01-15T00:00:00Z",
  "watchers": [456, 789]
}
```

#### Comments API (History System)

| Endpoint | Method | Purpose | Pagination |
|----------|--------|---------|------------|
| `/history/{type}/{id}` | GET | Get item history/comments | ✅ Yes |
| `/history/{type}/{id}` | POST | Add comment | ❌ No |
| `/history/{type}/{id}` | PATCH | Edit comment | ❌ No |
| `/history/{type}/{id}` | DELETE | Delete comment | ❌ No |

**Supported Types**: `issue`, `userstory`, `task`, `epic`, `wiki`

**Comment Object**:
```json
{
  "id": "comment-123",
  "comment": "Comment text",
  "comment_html": "<p>Comment text</p>",
  "user": {
    "username": "john.doe",
    "full_name": "John Doe"
  },
  "created_at": "2025-01-15T10:30:00Z",
  "delete_comment_date": null,
  "delete_comment_user": null
}
```

#### Attachments API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/issues/attachments` | POST | Upload issue attachment |
| `/userstories/attachments` | POST | Upload story attachment |
| `/tasks/attachments` | POST | Upload task attachment |
| `/issues/attachments/{id}` | GET | Download attachment |
| `/issues/attachments/{id}` | DELETE | Delete attachment |

**Upload Format** (v1.9.8+):
```json
{
  "project": 123,
  "object_id": 456,
  "attached_file": "data:image/png;base64,iVBORw0KG...",
  "description": "File description"
}
```

**Attachment Object**:
```json
{
  "id": 888,
  "project": 123,
  "attached_file": "https://taiga.io/media/attachments/...",
  "name": "screenshot.png",
  "size": 12345,
  "description": "File description",
  "is_deprecated": false,
  "created_date": "2025-01-15T10:00:00Z",
  "modified_date": "2025-01-15T10:00:00Z",
  "from_comment": false,
  "owner": 456
}
```

#### Metadata Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/userstory-statuses` | GET | Get user story statuses |
| `/task-statuses` | GET | Get task statuses |
| `/issue-statuses` | GET | Get issue statuses |
| `/priorities` | GET | Get priority options |
| `/severities` | GET | Get severity options |
| `/issue-types` | GET | Get issue types |
| `/memberships` | GET | Get project members |
| `/users/me` | GET | Get current user info |

**Query Parameters**:
- `project={projectId}` - Filter by project (required for most)

### Pagination Strategy

This project implements comprehensive pagination handling:

```javascript
// Automatic pagination in fetchAllPages() - src/taigaService.js:31
- Uses page_size=100 for optimal performance
- Fetches all pages automatically
- Checks x-pagination-count header
- Stops when results < page_size
```

**Best Practices**:
1. Always use `page_size=100` to minimize API calls
2. Check `x-pagination-count` and `x-pagination-next` headers
3. Handle empty result sets gracefully
4. Cache results when appropriate (see metadataService.js)

### Error Handling Patterns

```javascript
// Consistent error handling across all API calls
try {
  const client = await createAuthenticatedClient();
  const response = await client.get(endpoint);
  return response.data;
} catch (error) {
  console.error('Operation failed:', error.message);
  throw new Error(ERROR_MESSAGES.OPERATION_FAILED);
}
```

### Rate Limiting & Performance

**Implementation Strategies**:
1. **Caching**: 5-minute TTL for metadata (metadataService.js)
2. **Batch Operations**: Reduce API calls with batch tools
3. **Parallel Fetching**: Use Promise.all() for independent requests
4. **Pagination**: Fetch all pages efficiently with page_size=100

**Taiga API Limits** (typically):
- Rate limit: ~100 requests per minute
- Response size: ~10MB maximum
- Timeout: 30 seconds per request

### Advanced Features

#### Fuzzy Matching
```javascript
// Levenshtein distance algorithm for identifier resolution
- Configurable similarity threshold (default: 70%)
- Used for users, sprints, statuses
- See: utils.js:levenshteinDistance()
```

#### Validation System
```javascript
// Pre-validate before API calls
- Resolves names to IDs
- Validates field values
- Dry-run mode available
- See: validation.js
```

#### Identifier Resolution
```javascript
// Smart resolution of project/sprint/user identifiers
- Supports: ID (numeric), slug (string), name (fuzzy)
- Example: resolveProject("my-project") or resolveProject(123)
- See: utils.js
```

### API Documentation Links

**Official Taiga Documentation**:
- **API Docs**: https://docs.taiga.io/api.html
- **API Source**: https://github.com/taigaio/taiga-back
- **Frontend**: https://github.com/taigaio/taiga-front

**This Project's Implementation**:
- **API Service**: `src/taigaService.js` (1,594 lines)
- **Auth Handler**: `src/taigaAuth.js`
- **Constants**: `src/constants.js` (API_ENDPOINTS)
- **Utilities**: `src/utils.js`, `src/userResolution.js`, `src/metadataService.js`

### Common API Patterns in This Project

1. **Project Resolution** (`resolveProject`)
   - Try as numeric ID first
   - Then try as slug
   - Finally try fuzzy name match

2. **User Resolution** (`resolveUser`)
   - Try as numeric ID
   - Try as username (exact)
   - Try as email (exact)
   - Try as full name (fuzzy match)

3. **Milestone Resolution** (`resolveMilestone`)
   - Try as numeric ID
   - Try as exact name match
   - Try as fuzzy name match (Levenshtein distance)

4. **Metadata Caching** (`metadataService`)
   - 5-minute TTL cache
   - Parallel fetching
   - Auto-refresh on expiration

5. **Batch Operations** (`batchTools`)
   - Maximum 20 items per batch
   - `continueOnError` flag support
   - Detailed success/failure reporting