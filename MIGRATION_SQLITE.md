# Migration vers SQLite - Documentation

## ✅ Migration terminée !

L'application a été migrée avec succès de localStorage vers SQLite pour un stockage local robuste et hors ligne.

## 🗄️ Nouvelles fonctionnalités

### Base de données SQLite locale
- **Stockage persistant** : Toutes les données sont stockées dans un fichier SQLite local
- **Fonctionnement hors ligne** : Aucune connexion internet requise
- **Performance améliorée** : Requêtes SQL optimisées
- **Intégrité des données** : Contraintes et relations entre les tables
- **Sauvegarde simple** : Un seul fichier `.db` à sauvegarder

### Structure de la base de données

#### Tables créées
- `classes` : Informations des classes
- `students` : Données des étudiants
- `teachers` : Informations des professeurs
- `subjects` : Matières par classe et semestre
- `grades` : Notes des étudiants (devoirs et compositions)
- `schedule_slots` : Créneaux d'emploi du temps
- `attendance` : Présences, absences, retards

#### Relations établies
- Étudiants liés à leurs classes
- Notes liées aux étudiants et matières
- Emplois du temps liés aux classes et professeurs
- Présences liées aux étudiants et créneaux

## 📁 Fichiers ajoutés/modifiés

### Nouveaux services
- `src/services/database.ts` : Service principal SQLite
- `src/hooks/useSchoolDataSQL.ts` : Hook pour étudiants/classes
- `src/hooks/useTeacherDataSQL.ts` : Hook pour professeurs
- `src/hooks/useGradeDataSQL.ts` : Hook pour matières/notes
- `src/hooks/useClassScheduleDataSQL.ts` : Hook pour emplois du temps
- `src/hooks/useAttendanceDataSQL.ts` : Hook pour présences
- `src/hooks/useSchoolDataMigration.ts` : Hook principal unifié

### Fichiers modifiés
- `src/App.tsx` : Migration vers les nouveaux hooks
- `electron.js` : Configuration du chemin de base de données
- `package.json` : Ajout de better-sqlite3

## 🚀 Avantages de SQLite

### Performance
- Requêtes SQL rapides et optimisées
- Index automatiques pour les clés primaires
- Meilleure gestion des grandes quantités de données

### Fiabilité
- Transactions ACID garanties
- Contraintes d'intégrité référentielle
- Pas de corruption de données comme avec localStorage

### Facilité d'utilisation
- Interface familière avec SQL standard
- Outils de requête et d'analyse disponibles
- Export/import facile des données

## 🛠️ Configuration automatique

### Emplacement de la base de données
- **Développement** : `./school_management.db` (dossier du projet)
- **Production** : `%APPDATA%/school-app/school_management.db` (Windows)
- **Production** : `~/Library/Application Support/school-app/school_management.db` (macOS)
- **Production** : `~/.config/school-app/school_management.db` (Linux)

### Initialisation automatique
- Tables créées automatiquement au premier lancement
- Classes par défaut insérées (6ème A, 5ème A, etc.)
- Pas de configuration manuelle requise

## 📊 Données pré-existantes

Les anciennes données localStorage ont été conservées dans les anciens hooks si besoin de migration manuelle. Les nouveaux hooks SQLite démarrent avec des données propres.

## 🔧 Maintenance

### Sauvegarde
```bash
# Copier le fichier de base de données
cp school_management.db backup_$(date +%Y%m%d).db
```

### Inspection des données
Vous pouvez utiliser n'importe quel client SQLite pour examiner les données :
- DB Browser for SQLite
- SQLite Studio
- Ligne de commande sqlite3

### Réinitialisation
Pour repartir à zéro, il suffit de supprimer le fichier `school_management.db`.

## ✨ Prochaines étapes possibles

- Ajout d'un système de backup automatique
- Import/export Excel des données
- Synchronisation entre plusieurs postes
- Rapports PDF générés depuis les requêtes SQL
- Historique des modifications

---

**Note** : L'application fonctionne maintenant entièrement hors ligne avec SQLite. Toutes les fonctionnalités précédentes sont conservées avec une meilleure performance et fiabilité.