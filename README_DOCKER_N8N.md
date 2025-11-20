# 🚀 Taiga MCP Server - Docker + n8n Installation Guide

Ce guide vous explique comment installer et configurer le serveur MCP Taiga sur votre VPS avec Docker et l'intégrer avec n8n.

## 📋 Architecture

Le projet utilise maintenant une **architecture monorepo** avec bibliothèque partagée :

```
taigaMcpServer/
├── packages/
│   ├── taiga-core/          # 📦 Bibliothèque partagée (logique métier)
│   ├── taiga-mcp-server/    # 🔌 Interface MCP (pour Claude Desktop)
│   └── taiga-rest-api/      # 🌐 Interface REST API (pour n8n)
├── docker-compose.yml       # 🐳 Orchestration Docker
└── .env                     # ⚙️ Configuration
```

### Services Docker

1. **taiga-rest-api** (port 3000) - API REST pour n8n
2. **n8n** (port 5678) - Plateforme d'automatisation
3. **taiga-mcp-server** (optionnel) - Serveur MCP legacy

## 🔧 Installation

### 1. Prérequis

```bash
# Vérifier que Docker et Docker Compose sont installés
docker --version
docker-compose --version
```

### 2. Cloner le projet

```bash
cd /home/user
git clone https://github.com/greddy7574/taigaMcpServer.git
cd taigaMcpServer
```

### 3. Configuration

Créer le fichier `.env` avec vos identifiants Taiga :

```bash
cp .env.example .env
nano .env
```

Modifier les valeurs :

```env
# Taiga API Configuration
TAIGA_API_URL=https://api.taiga.io/api/v1
TAIGA_USERNAME=votre_nom_utilisateur
TAIGA_PASSWORD=votre_mot_de_passe

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=un_mot_de_passe_securise
WEBHOOK_URL=http://votre-vps-ip:5678/
TIMEZONE=Europe/Paris
```

### 4. Démarrer les services

```bash
# Build et démarrage
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

## 📊 Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| **Taiga REST API** | `http://your-vps-ip:3000` | API REST pour n8n |
| **API Documentation** | `http://your-vps-ip:3000/api-docs` | Documentation Swagger |
| **n8n** | `http://your-vps-ip:5678` | Interface n8n |
| **Health Check** | `http://your-vps-ip:3000/health` | Vérification santé API |

## 🔐 Authentification

L'API REST supporte **3 méthodes d'authentification** :

### Méthode 1 : API Key (Recommandée pour n8n)

```bash
# D'abord, obtenir votre API key
curl -X POST http://your-vps-ip:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Réponse:
# {
#   "success": true,
#   "apiKey": "dXNlcm5hbWU6cGFzc3dvcmQ=",
#   "token": "...",
#   "user": {...}
# }

# Utiliser l'API key dans vos requêtes
curl -H "X-API-Key: dXNlcm5hbWU6cGFzc3dvcmQ=" \
  http://your-vps-ip:3000/api/projects
```

### Méthode 2 : Headers Username/Password

```bash
curl -H "X-Taiga-Username: your_username" \
     -H "X-Taiga-Password: your_password" \
     http://your-vps-ip:3000/api/projects
```

### Méthode 3 : Variables d'environnement (Fallback)

Si aucune authentification n'est fournie, l'API utilisera les variables `TAIGA_USERNAME` et `TAIGA_PASSWORD` du fichier `.env`.

## 📘 Utilisation avec n8n

### 1. Accéder à n8n

1. Ouvrir `http://your-vps-ip:5678` dans votre navigateur
2. Se connecter avec les identifiants configurés dans `.env`

### 2. Créer votre premier workflow

#### Exemple : Récupérer tous les projets

1. **Ajouter un node "HTTP Request"**
   - Method: `GET`
   - URL: `http://taiga-rest-api:3000/api/projects`
   - Authentication: `Generic Credential Type`
   - Add Header:
     - Name: `X-API-Key`
     - Value: `votre_api_key` (obtenue via `/api/auth/login`)

2. **Tester**
   - Cliquer sur "Execute Node"
   - Vous devriez voir la liste de vos projets Taiga

#### Exemple : Créer une issue

1. **Add un node "HTTP Request"**
   - Method: `POST`
   - URL: `http://taiga-rest-api:3000/api/issues`
   - Authentication: Header avec `X-API-Key`
   - Body Content Type: `JSON`
   - JSON/RAW Parameters:
     ```json
     {
       "project": 123,
       "subject": "Nouvelle issue créée depuis n8n",
       "description": "Cette issue a été créée automatiquement",
       "priority": 1,
       "severity": 1,
       "type": 1
     }
     ```

### 3. Endpoints disponibles

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authentification et récupération de l'API key |
| `/api/projects` | GET | Liste tous les projets |
| `/api/projects/:id` | GET | Détails d'un projet |
| `/api/sprints?project_id=X` | GET | Liste les sprints d'un projet |
| `/api/sprints` | POST | Créer un sprint |
| `/api/issues?project_id=X` | GET | Liste les issues d'un projet |
| `/api/issues` | POST | Créer une issue |
| `/api/issues/:id` | PATCH | Modifier une issue |
| `/api/user-stories?project_id=X` | GET | Liste les user stories |
| `/api/user-stories` | POST | Créer une user story |
| `/api/user-stories/:id` | PATCH | Modifier une user story |
| `/api/user-stories/:id` | DELETE | Supprimer une user story |
| `/api/tasks` | POST | Créer une tâche |
| `/api/tasks/:id` | GET | Détails d'une tâche |
| `/api/tasks/:id` | PATCH | Modifier une tâche |
| `/api/epics?project_id=X` | GET | Liste les epics |
| `/api/epics` | POST | Créer un epic |
| `/api/comments` | POST | Ajouter un commentaire |
| `/api/attachments` | POST | Upload un fichier (Base64) |
| `/api/wiki?project_id=X` | GET | Liste les pages wiki |

📚 **Documentation complète** : `http://your-vps-ip:3000/api-docs`

## 🛠️ Commandes utiles

```bash
# Voir les logs
docker-compose logs -f taiga-rest-api
docker-compose logs -f n8n

# Redémarrer un service
docker-compose restart taiga-rest-api

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Rebuild après modifications
docker-compose up -d --build

# Vérifier la santé des services
curl http://localhost:3000/health
```

## 🔍 Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
docker-compose logs taiga-rest-api

# Vérifier que le port 3000 n'est pas utilisé
sudo netstat -tulpn | grep 3000
```

### Erreur d'authentification

```bash
# Vérifier les credentials dans .env
cat .env

# Tester l'authentification manuellement
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

### n8n ne peut pas accéder à l'API

- **Vérifier** que les deux containers sont sur le même réseau Docker
- **Utiliser** `http://taiga-rest-api:3000` (nom du service) au lieu de `http://localhost:3000` dans n8n
- **Vérifier** les logs : `docker-compose logs n8n`

## 🚀 Cas d'usage avancés

### Automatiser la création de sprints

Créer un workflow n8n qui crée automatiquement un sprint au début de chaque mois :

1. **Schedule Trigger** - Déclencher le 1er de chaque mois
2. **HTTP Request** - POST `/api/sprints` avec les dates du mois
3. **Notification** - Envoyer un email de confirmation

### Synchronisation bidirectionnelle

Synchroniser Taiga avec d'autres outils (Slack, Jira, GitHub) :

1. **Webhook Trigger** - Écouter les événements Taiga
2. **HTTP Request** - Créer/modifier des issues via l'API
3. **Integration nodes** - Synchroniser avec d'autres plateformes

## 📈 Performance et sécurité

### Optimisations

- Les containers sont limités en ressources (voir `docker-compose.yml`)
- Utiliser un reverse proxy (Nginx) pour HTTPS en production
- Configurer des backups réguliers du volume `n8n_data`

### Sécurité

```bash
# Changer les mots de passe par défaut
nano .env

# Redémarrer après modification
docker-compose up -d

# Utiliser HTTPS en production
# Configurer Nginx avec Let's Encrypt
```

## 🆘 Support

- **Issues GitHub** : https://github.com/greddy7574/taigaMcpServer/issues
- **Documentation Taiga** : https://docs.taiga.io
- **Documentation n8n** : https://docs.n8n.io

## 📝 Changelog

### Version 2.0.0 (Architecture Monorepo)

- ✨ Extraction de la logique métier dans `taiga-core`
- 🌐 Nouvelle API REST compatible n8n
- 🐳 Support Docker avec orchestration complète
- 📖 Documentation Swagger auto-générée
- 🔐 Multiple méthodes d'authentification
- 📦 48 endpoints couvrant toutes les fonctionnalités Taiga

---

**Développé avec ❤️ par greddy7574 et Claude Code**
