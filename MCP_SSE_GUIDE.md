# 🚀 Guide Serveur MCP Taiga (SSE Transport)

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le serveur MCP Taiga avec transport HTTP/SSE (Server-Sent Events), compatible avec Claude Desktop et les clients MCP.

## 🏗️ Architecture

Le projet contient maintenant **deux serveurs**:

### 1. **REST API** (Port 3000)
- ✅ Pour n8n et intégrations HTTP classiques
- ✅ Endpoints REST standard (GET, POST, PUT, DELETE)
- ✅ Documentation Swagger: `http://localhost:3000/api-docs`

### 2. **MCP Server** (Port 3001)
- ✅ Pour Claude Desktop et clients MCP
- ✅ Transport HTTP/SSE (Server-Sent Events)
- ✅ Protocole MCP complet avec tous les outils Taiga
- ✅ Endpoint SSE: `http://localhost:3001/sse`

## 🚀 Démarrage

### Build et démarrage des deux serveurs:

```bash
cd ~/taigaMcpServer
docker-compose build --no-cache
docker-compose up -d
```

### Vérification:

```bash
# REST API
curl http://localhost:3000/health

# MCP Server
curl http://localhost:3001/health
```

### Logs:

```bash
# REST API
docker-compose logs -f taiga-rest-api

# MCP Server
docker-compose logs -f taiga-mcp-server

# Les deux
docker-compose logs -f
```

## 🔧 Configuration Claude Desktop

Le serveur MCP avec SSE peut être utilisé avec Claude Desktop. Voici la configuration:

### Fichier: `claude_desktop_config.json`

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "taiga": {
      "url": "http://VOTRE_VPS_IP:3001/sse"
    }
  }
}
```

**Remplacez** `VOTRE_VPS_IP` par l'IP publique de votre VPS.

## 🛠️ Outils MCP disponibles

Le serveur MCP expose **48 outils** Taiga:

### 🔐 Authentication (1 outil)
- `authenticate` - Authentification Taiga

### 📁 Projects (2 outils)
- `list_projects` - Lister les projets
- `get_project` - Détails d'un projet (par ID ou slug)

### 🏃 Sprints/Milestones (4 outils)
- `list_milestones` - Lister les sprints
- `get_milestone` - Détails d'un sprint
- `create_milestone` - Créer un sprint
- `get_milestone_stats` - Statistiques sprint

### 🐛 Issues (6 outils)
- `list_issues` - Lister les issues
- `get_issue` - Détails issue
- `create_issue` - Créer issue
- `update_issue_status` - Modifier statut
- `assign_issue` - Assigner à membre
- `add_issue_to_sprint` - Ajouter au sprint

### 📝 User Stories (3 outils)
- `list_user_stories` - Lister stories
- `get_user_story` - Détails story
- `create_user_story` - Créer story

### ✅ Tasks (3 outils)
- `create_task` - Créer tâche
- `get_task` - Détails tâche
- `update_task` - Modifier tâche

### 🚀 Batch Operations (3 outils)
- `batch_create_issues` - Créer plusieurs issues
- `batch_create_user_stories` - Créer plusieurs stories
- `batch_create_tasks` - Créer plusieurs tâches

### 💬 Comments (4 outils)
- `add_comment` - Ajouter commentaire
- `list_comments` - Lister commentaires
- `edit_comment` - Modifier commentaire
- `delete_comment` - Supprimer commentaire

### 📎 Attachments (4 outils)
- `upload_attachment` - Upload fichier (Base64)
- `list_attachments` - Lister fichiers
- `download_attachment` - Télécharger fichier
- `delete_attachment` - Supprimer fichier

### 🏛️ Epics (6 outils)
- `create_epic` - Créer epic
- `list_epics` - Lister epics
- `get_epic` - Détails epic
- `update_epic` - Modifier epic
- `link_story_to_epic` - Lier story à epic
- `unlink_story_from_epic` - Délier story d'epic

### 📖 Wiki (6 outils)
- `create_wiki_page` - Créer page wiki
- `list_wiki_pages` - Lister pages wiki
- `get_wiki_page` - Détails page wiki
- `update_wiki_page` - Modifier page wiki
- `delete_wiki_page` - Supprimer page wiki
- `watch_wiki_page` - Suivre page wiki

### 🔍 Advanced Search (3 outils)
- `advanced_search` - Recherche avancée (syntaxe SQL-like)
- `query_help` - Aide syntaxe requête
- `validate_query` - Valider syntaxe requête

## 📡 Utilisation avec Claude Desktop

Une fois configuré, vous pouvez interagir avec Taiga via Claude Desktop:

**Exemples de prompts:**

```
"Liste tous mes projets Taiga"

"Crée un nouveau sprint pour le projet X du 1er au 15 décembre"

"Montre-moi toutes les issues du sprint actuel"

"Crée 3 user stories pour la fonctionnalité d'authentification"

"Ajoute un commentaire sur l'issue #42"
```

Claude utilisera automatiquement les bons outils MCP pour exécuter vos demandes.

## 🌐 Utilisation avec n8n

Pour n8n, continuez d'utiliser la **REST API** (port 3000), pas le serveur MCP.

Voir `DEPLOYMENT_SUMMARY.md` pour la configuration n8n.

## 🔒 Sécurité

### ⚠️ Exposition publique

Le serveur MCP sur le port 3001 est accessible publiquement. Considérez:

1. **Firewall**: Restreindre l'accès au port 3001
   ```bash
   # Autoriser seulement votre IP
   ufw allow from VOTRE_IP to any port 3001
   ```

2. **Reverse Proxy**: Utiliser nginx/traefik avec authentification
   ```nginx
   location /taiga-mcp/ {
       proxy_pass http://localhost:3001/;
       auth_basic "Restricted";
       auth_basic_user_file /etc/nginx/.htpasswd;
   }
   ```

3. **VPN**: Utiliser WireGuard/OpenVPN pour accès privé

## 🐛 Troubleshooting

### Le serveur MCP ne démarre pas

```bash
# Voir les logs
docker-compose logs taiga-mcp-server

# Vérifier le health check
docker inspect taiga-mcp-server --format='{{.State.Health.Status}}'

# Rebuild
docker-compose build --no-cache taiga-mcp-server
docker-compose up -d taiga-mcp-server
```

### Claude Desktop ne se connecte pas

1. **Vérifier l'URL**: `http://IP:3001/sse` (pas `https`)
2. **Firewall**: Port 3001 ouvert sur le VPS
3. **Logs serveur**: `docker-compose logs -f taiga-mcp-server`
4. **Test manuel**:
   ```bash
   curl http://VOTRE_VPS_IP:3001/health
   ```

### Erreurs d'authentification

Vérifier les variables d'environnement:
```bash
docker exec taiga-mcp-server env | grep TAIGA
```

## 📊 Monitoring

### Healthcheck endpoints

- REST API: `http://localhost:3000/health`
- MCP Server: `http://localhost:3001/health`

### Prometheus metrics (à venir)

Les métriques seront exposées sur `/metrics` dans une future version.

## 🔄 Mise à jour

```bash
cd ~/taigaMcpServer
git pull origin claude/taiga-mcp-n8n-docker-01RE5emd9GXvd7pS4FsyddfW
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Ressources

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Taiga API Documentation](https://docs.taiga.io/api.html)
- [Project Wiki](https://github.com/greddy7574/taigaMcpServer/wiki)

## 🆘 Support

En cas de problème:
1. Consulter les logs: `docker-compose logs -f`
2. Vérifier la configuration: `.env` et `docker-compose.yml`
3. Tester les endpoints de santé
4. Consulter le Wiki du projet
