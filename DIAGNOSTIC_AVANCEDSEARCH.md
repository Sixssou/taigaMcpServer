# 🔍 Diagnostic advancedSearch - Rapport de Tests

**Date:** 2025-11-24
**Version:** v1.9.14+enhanced

## ✅ FONCTIONNALITÉS QUI MARCHENT

### Opérateurs
- ✅ `in:[value1,value2]` - Fonctionne parfaitement
  - Test: `status:in:[New,Done]` → 54 résultats
- ✅ `between:[start,end]` - Fonctionne parfaitement
  - Test: `created:between:[2025-11-01,2025-11-30]` → 62 résultats
- ✅ `AND` / `OR` / `NOT` - Logique booléenne OK
- ✅ `ORDER BY` - Tri fonctionnel
- ✅ `LIMIT` - Limitation fonctionnelle
- ✅ Pagination (`offset`) - OK

### Champs
- ✅ `comments` - Filtre par nombre de commentaires
  - Test: `comments:>0` → 3 résultats
- ✅ `created` - Avec opérateur `between`

## ❌ PROBLÈMES IDENTIFIÉS

### 1. Bug d'affichage `[object Object]`
**Symptôme:** Tous les résultats affichent `[object Object]` au lieu des valeurs réelles
**Cause probable:** Formatage incorrect des objets complexes dans `formatSearchItemWithMetadata()`
**Impact:** Haute - Impossible de lire les résultats correctement

### 2. Filtres non fonctionnels
**Symptôme:** La plupart des champs retournent tous les résultats (85) au lieu de filtrer
**Champs affectés:**
- `milestone` / `sprint`
- `epic`
- `status` (simple `status:New` ne marche pas)
- `assignee` / `assigned`
- `owner` / `created_by`
- `blocked` / `is_blocked`
- `closed` / `is_closed`
- `due_date`
- `finish_date`
- `attachments` / `has_attachments`
- `user_story`
- `priority`

**Cause probable:**
Le filtre `compareEqual()` ne match pas correctement les valeurs, SAUF pour `compareIn()` et `compareBetween()` qui fonctionnent.

**Hypothèses:**
1. Structure des données Taiga différente de celle attendue
2. Logique de résolution des valeurs dans `getFieldValue()` inadaptée
3. Comparaison case-sensitive ou format incorrect

### 3. Opérateurs `empty`/`notempty` non fonctionnels
**Symptôme:** `assignee:empty` ne filtre rien
**Cause probable:** Opérateur pas correctement normalisé ou exécuté

## 🎯 ACTIONS CORRECTIVES RECOMMANDÉES

### Priorité 1 : Fix display bug
- [ ] Corriger `formatSearchItemWithMetadata()` pour afficher les primitives correctement
- [ ] Améliorer `getSafeValue()` pour gérer les objets complexes

### Priorité 2 : Debug filtering logic
- [ ] Ajouter des logs dans `getFieldValue()` pour voir ce qui est retourné
- [ ] Ajouter des logs dans `compareEqual()` pour voir les comparaisons
- [ ] Créer un test avec des données mock simples

### Priorité 3 : Fix empty/notempty
- [ ] Vérifier que l'opérateur est bien normalisé dans `normalizeOperator()`
- [ ] S'assurer que `OPERATORS.EMPTY` et `OPERATORS.NOT_EMPTY` sont utilisés

## 📊 STATISTIQUES DES TESTS

- **Total queries testées:** 29
- **Queries fonctionnelles:** 6 (~20%)
- **Queries non fonctionnelles:** 23 (~80%)
- **Taux de succès:** 20%

## 🔬 TESTS À REFAIRE APRÈS CORRECTIONS

```javascript
// Test 1: Milestone filtering
"milestone:S47-S48" // Should return items in that sprint
"milestone:null"    // Should return items without sprint

// Test 2: Status filtering
"status:New"        // Should return only New items

// Test 3: Empty operator
"assignee:empty"    // Should return unassigned items

// Test 4: Boolean fields
"blocked:true"      // Should return blocked items
"closed:false"      // Should return open items

// Test 5: Combined complex query
"milestone:S47-S48 AND closed:false AND priority:high AND assignee:cyril"
```

## 📝 NOTES

- Les opérateurs `in:[]` et `between:[]` fonctionnent car ils ont une logique de comparaison différente et plus permissive
- Le problème de filtrage suggère que `compareEqual()` est trop strict ou mal implémenté
- Le bug d'affichage est indépendant de la logique de filtrage
